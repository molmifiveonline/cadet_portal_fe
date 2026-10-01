import React from "react";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Allocations from "./index";
import api from "../../lib/utils/apiConfig";
import { usePermission } from "../../hooks/usePermission";
import { toast } from "sonner";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), {
  virtual: true,
});
jest.mock("../../hooks/usePermission", () => ({ usePermission: jest.fn() }));
jest.mock("../../lib/utils/apiConfig", () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

let cycles;
beforeEach(() => {
  jest.clearAllMocks();
  usePermission.mockReturnValue({ hasPermission: true });
  cycles = [
    {
      id: "drive-1",
      allocation_number: "CTV-2026-001",
      allocation_year: 2026,
      department: "Deck",
      rank_list_status: "Draft",
      candidate_count: 2,
      allocated_count: 1,
    },
  ];
  api.get.mockImplementation(async () => ({ data: { data: cycles } }));
  api.delete.mockImplementation(async (url, { data }) => {
    cycles = cycles.map((cycle) => ({
      ...cycle,
      deleted_at: "2026-10-01T04:30:00.000Z",
      deleted_by_name: "Test Admin",
      delete_reason: data.reason,
    }));
    return { data: { success: true } };
  });
});

it("requires a reason, keeps the disabled card, and excludes its cadets from active totals", async () => {
  render(<Allocations />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Disable", exact: true }),
  );
  const confirm = screen.getByRole("button", {
    name: "Disable Allocation",
    exact: true,
  });
  expect(confirm).toBeDisabled();
  fireEvent.change(
    screen.getByRole("textbox", { name: /Reason for disabling/ }),
    { target: { value: "   " } },
  );
  expect(confirm).toBeDisabled();
  expect(api.delete).not.toHaveBeenCalled();
  fireEvent.change(
    screen.getByRole("textbox", { name: /Reason for disabling/ }),
    { target: { value: "  Replacement drive  " } },
  );
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(api.delete).toHaveBeenCalledWith("/allocations/drive-1", {
      data: { reason: "Replacement drive" },
    }),
  );
  const history = await screen.findByRole("button", { name: "View History" });
  const card = history.closest("article");
  expect(card).toHaveClass("grayscale");
  expect(within(card).getByText("CTV-2026-001")).toBeInTheDocument();
  expect(within(card).getByText("2 cadets")).toBeInTheDocument();
  expect(
    within(card).getByText("Reason: Replacement drive"),
  ).toBeInTheDocument();
  expect(within(card).getByText(/10:00:00.*IST/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Disable|Restore/, exact: true }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Total Cadets").parentElement).toHaveTextContent("0");
  fireEvent.click(history);
  expect(mockNavigate).toHaveBeenCalledWith("/allocations/drive-1");
});

it.each([
  { rank_list_status: "Finalized" },
  { existing_joining_plan_count: 1 },
  { existing_onboarding_count: 1 },
])(
  "blocks disabling a drive with protected records: %j",
  async (protectedState) => {
    Object.assign(cycles[0], protectedState);
    render(<Allocations />);
    expect(
      await screen.findByRole("button", { name: "Disable", exact: true }),
    ).toBeDisabled();
    expect(api.delete).not.toHaveBeenCalled();
  },
);

it("keeps the reason and the active drive when the server rejects disabling", async () => {
  api.delete.mockRejectedValueOnce({
    response: { data: { message: "A joining plan was created" } },
  });
  render(<Allocations />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Disable", exact: true }),
  );
  const reason = screen.getByRole("textbox", { name: /Reason for disabling/ });
  fireEvent.change(reason, { target: { value: "Wrong drive" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Disable Allocation", exact: true }),
  );
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("A joining plan was created"),
  );
  expect(reason).toHaveValue("Wrong drive");
  expect(
    screen.getByRole("button", { name: "Open Allocation" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "View History" }),
  ).not.toBeInTheDocument();
});

it("does not offer disabling without edit permission", async () => {
  usePermission.mockReturnValue({ hasPermission: false });
  render(<Allocations />);
  await screen.findByRole("button", { name: "Open Allocation" });
  expect(
    screen.queryByRole("button", { name: "Disable", exact: true }),
  ).not.toBeInTheDocument();
});
