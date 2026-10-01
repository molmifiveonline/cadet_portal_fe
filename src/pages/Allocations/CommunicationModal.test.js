import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CommunicationModal } from "./AllocationDetail";
import api from "../../lib/utils/apiConfig";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: jest.fn(),
    useParams: jest.fn(),
    useSearchParams: jest.fn(),
  }),
  { virtual: true },
);
jest.mock("../../lib/utils/apiConfig", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const sentPlan = {
  id: "plan-email-sent",
  name_as_in_indos_cert: "Example Cadet",
  email_id: "cadet@example.invalid",
  vessel_name: "Example Vessel",
  vessel_role: "Primary",
  last_mode: "Email",
  email_delivery_status: "Sent",
  successful_communication_count: 1,
  successful_email_count: 1,
  confirmation_received: 0,
};

const setup = (overrides = {}) =>
  render(
    <CommunicationModal
      plan={{ ...sentPlan, ...overrides }}
      admins={[]}
      currentUser={{ id: "admin-1" }}
      onClose={jest.fn()}
      onSaved={jest.fn()}
    />,
  );

beforeEach(() => jest.clearAllMocks());

it("opens an Email Sent record with Email selected and keeps it selected when confirming", () => {
  setup();
  expect(
    screen.getByRole("button", { name: "Email", pressed: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Phone", pressed: false }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Record Communication" }),
  ).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Yes", exact: true }));
  expect(
    screen.getByRole("button", { name: "Email", pressed: true }),
  ).toBeTruthy();
  expect(api.post).not.toHaveBeenCalled();
});

it.each(["Phone", "WhatsApp"])(
  "preserves a saved %s contact instead of selecting Email",
  (mode) => {
    setup({ last_mode: mode, email_delivery_status: null });
    expect(
      screen.getByRole("button", { name: mode, pressed: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Record Communication" }),
    ).toBeTruthy();
  },
);

it("selects Email for a first intimation", () => {
  setup({
    last_mode: null,
    email_delivery_status: null,
    successful_communication_count: 0,
    successful_email_count: 0,
  });
  expect(
    screen.getByRole("button", { name: "Email", pressed: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Record Communication" }),
  ).toBeTruthy();
});

it("keeps Email selected for a failed attempt", () => {
  setup({ email_delivery_status: "Failed" });
  expect(
    screen.getByRole("button", { name: "Email", pressed: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Record Communication" }),
  ).toBeTruthy();
});

it("allows changing the mode and preserves that selection while reviewing the plan", () => {
  setup();
  fireEvent.click(
    screen.getByRole("button", { name: "WhatsApp", exact: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Plan Ready" }));
  fireEvent.click(screen.getByRole("button", { name: "Record Communication" }));
  expect(
    screen.getByRole("button", { name: "WhatsApp", pressed: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Email", pressed: false }),
  ).toBeTruthy();
  expect(api.post).not.toHaveBeenCalled();
});

it.each(["Email", "Phone", "WhatsApp"])(
  "records received confirmation through %s without offering to send a message",
  async (mode) => {
    api.post.mockResolvedValue({ data: { success: true } });
    setup({ last_mode: mode, email_id: null, confirmation_received: "0" });
    expect(
      screen.getByRole("button", { name: "No", exact: true, pressed: true }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yes", exact: true }));
    const save = screen.getByRole("button", { name: "Record Confirmation" });
    expect(save).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /Send|Retry/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(save);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        `/allocations/joining-plans/${sentPlan.id}/communications`,
        expect.objectContaining({
          mode,
          confirmation_received: true,
          informed_by: "admin-1",
        }),
      ),
    );
  },
);
