import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import FollowupWorkspace from "./components/FollowupWorkspace";
import api from "../../lib/utils/apiConfig";
import { getCycleProgress } from "./allocationUtils";

jest.mock("../../lib/utils/apiConfig", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../context/AuthContext", () => ({ useAuth: () => ({ user: { id: "admin" } }) }));
const staff = [
  { id: "admin", name: "Admin", role: "Admin" },
  { id: "owner", name: "Follow-up Person", role: "Custom Staff" },
];
const fixture = (roles) => ({
  id: "allocation",
  name_as_in_indos_cert: "Test Cadet",
  cadet_unique_id: "CAD-001",
  follow_up_user_id: "owner",
  owner: staff[1],
  vessel_id: roles.includes("Primary") ? "v1" : null,
  secondary_vessel_id: roles.includes("Secondary") ? "v2" : null,
  allocation_status: roles.includes("Primary") ? "Allocated" : "Pending",
  secondary_allocation_status: roles.includes("Secondary") ? "Allocated" : "Pending",
  abilities: { can_follow: true, can_assign: false },
  plans: ["Primary", "Secondary"].map((role, i) => ({
    id: `plan-${i}`,
    vessel_role: role,
    vessel_id: `v${i + 1}`,
    vessel_name: `${role} Test Vessel`,
    revision: i + 2,
    name_as_in_indos_cert: "Test Cadet",
  })),
});
const setup = async (roles, mine, changes = {}) => {
  const row = { ...fixture(roles), ...changes };
  api.get.mockImplementation(async (url) => ({
    data: {
      data: url.endsWith("follow-up-users")
        ? staff
        : { data: [row], pagination: { totalPages: 1 } },
    },
  }));
  api.post.mockResolvedValue({ data: { success: true } });
  render(<FollowupWorkspace mine={mine} cycleId={mine ? undefined : "cycle"} />);
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
};
beforeEach(() => jest.clearAllMocks());
it("shows allocation complete and onboarding ready without an email or finalized ranks", () => {
  const progress = getCycleProgress(
    { rank_lists: [{ status: "Draft", allocations: [fixture(["Secondary"])] }] },
    [],
  );
  expect(progress.onboardingReadyCount).toBe(1);
  expect(progress.intimatedCount).toBe(0);
  expect(progress.steps.find((s) => s.key === "vessels").complete).toBe(true);
});
it.each([false, true])(
  "shows only allocated roles and records the correct plan/owner (mine=%s)",
  async (mine) => {
    await setup(["Secondary"], mine);
    expect(
      screen.queryByRole("region", { name: "Primary vessel follow-up" }),
    ).not.toBeInTheDocument();
    const secondary = screen.getByRole("region", { name: "Secondary vessel follow-up" });
    expect(screen.queryByText("No vessel selected")).not.toBeInTheDocument();
    fireEvent.click(within(secondary).getByRole("button", { name: "Add Follow-up" }));
    expect(screen.getByRole("textbox", { name: "Informed By" })).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Phone", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Record Communication" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/allocations/joining-plans/plan-1/communications",
        expect.objectContaining({ expected_revision: 3, informed_by: "owner", mode: "Phone" }),
      ),
    );
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(
      "/allocations/follow-ups",
      expect.objectContaining({
        params: expect.objectContaining({ mine: mine ? "true" : undefined }),
      }),
    );
  },
);
it("shows a separate Add Follow-up for each allocated vessel", async () => {
  await setup(["Primary", "Secondary"], false);
  for (const role of ["Primary", "Secondary"])
    expect(
      within(screen.getByRole("region", { name: `${role} vessel follow-up` })).getByRole("button", {
        name: "Add Follow-up",
      }),
    ).toBeEnabled();
});
it("shows Primary only when Secondary is on Hold", async () => {
  await setup(["Primary", "Secondary"], true, { secondary_allocation_status: "Hold" });
  expect(screen.getByRole("region", { name: "Primary vessel follow-up" })).toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Secondary vessel follow-up" }),
  ).not.toBeInTheDocument();
});
it("hides cadet groups without any allocated vessel", async () => {
  await setup([], false);
  expect(screen.queryByText("Test Cadet")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add Follow-up" })).not.toBeInTheDocument();
  expect(screen.getByText("No Allocated vessels to follow up.")).toBeInTheDocument();
});

it.each([false, true])(
  "filters across pages while retaining search and assignment scope (mine=%s)",
  async (mine) => {
    const row = fixture(["Primary"]);
    row.plans[0].confirmation_received = 1;
    api.get.mockImplementation(async (url, options) => ({
      data: {
        data: url.endsWith("follow-up-users")
          ? staff
          : {
              data: options.params.confirmation === "pending" ? [] : [row],
              pagination: {
                page: options.params.page,
                totalPages: options.params.confirmation === "all" ? 2 : 1,
              },
            },
      },
    }));
    render(<FollowupWorkspace mine={mine} cycleId={mine ? undefined : "cycle"} />);
    await screen.findByText("Test Cadet");
    fireEvent.change(screen.getByLabelText("Search follow-up cadets"), {
      target: { value: "CAD" },
    });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Next", exact: true }));
    await screen.findByText("2 / 2");
    fireEvent.click(screen.getByRole("button", { name: "Confirmed", exact: true }));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/allocations/follow-ups", {
        params: {
          confirmation: "confirmed",
          page: 1,
          search: "CAD",
          cycle_id: mine ? undefined : "cycle",
          mine: mine ? "true" : undefined,
        },
      }),
    );
    expect(await screen.findByText("Confirmation: Yes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next", exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pending", exact: true }));
    expect(await screen.findByText("No cadets match these filters.")).toBeInTheDocument();
    expect(screen.queryByText("Test Cadet")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pending", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "All", exact: true }));
    await screen.findByText("Test Cadet");
    expect(screen.getByLabelText("Search follow-up cadets")).toHaveValue("CAD");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  },
);

it("keeps the latest confirmation filter when an older response arrives late", async () => {
  await setup(["Primary"], true);
  let resolveConfirmed;
  api.get.mockImplementation((url, options) => {
    if (url.endsWith("follow-up-users")) return Promise.resolve({ data: { data: staff } });
    if (options.params.confirmation === "confirmed")
      return new Promise((resolve) => {
        resolveConfirmed = resolve;
      });
    return Promise.resolve({
      data: { data: { data: [], pagination: { page: 1, totalPages: 0 } } },
    });
  });
  fireEvent.click(screen.getByRole("button", { name: "Confirmed", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Pending", exact: true }));
  await screen.findByText("No cadets match these filters.");
  await act(async () =>
    resolveConfirmed({
      data: { data: { data: [fixture(["Primary"])], pagination: { page: 1, totalPages: 1 } } },
    }),
  );
  expect(screen.getByRole("button", { name: "Pending", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.queryByText("Test Cadet")).not.toBeInTheDocument();
  expect(screen.getByText("No cadets match these filters.")).toBeInTheDocument();
});
