import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import CommunicationReview from "./CommunicationReview";
import api from "../../lib/utils/apiConfig";

jest.mock("../../lib/utils/apiConfig", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const plan = {
  id: "plan-1",
  revision: 2,
  vessel_name: "Example Vessel",
  vessel_role: "Primary",
  vessel_type: "LNG Carrier",
  department: "Deck",
  joining_date: "2026-09-30",
  reporting_port: "Mumbai",
  location: "India",
  voyage_ref: "VOY-01",
  total_seats: 12,
  contact_person_name: "Vessel Contact",
  contact_person_email: "contact@example.invalid",
  contact_person_phone: "1234567890",
  communication_details: "Report at the main gate.",
  required_documents: '["Passport","Medical certificate"]',
  confirmation_received: 0,
};
const record = {
  id: "record-1",
  plan_revision: 2,
  mode: "WhatsApp",
  informed_by_name: "Previous Administrator",
  date_of_informing: "2026-09-25",
  informed_at: "2026-09-25T10:15:00Z",
  confirmation_received: 0,
  candidate_remarks: "Will confirm tomorrow.",
  admin_remarks: "Details shared.",
};
const setup = (overrides = {}) => {
  const onSubmit = jest.fn((event) => event.preventDefault());
  render(
    <CommunicationReview
      plan={plan}
      previouslyInformed
      onClose={jest.fn()}
      {...overrides}
    >
      <form onSubmit={onSubmit}>
        <input aria-label="New remarks" defaultValue="" />
        <button type="submit">Send Joining Intimation</button>
      </form>
    </CommunicationReview>,
  );
  return onSubmit;
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("shows all saved plan fields as read-only and preserves the current form", () => {
  const onSubmit = setup();
  fireEvent.change(screen.getByRole("textbox", { name: "New remarks" }), {
    target: { value: "Unsaved note" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Plan Ready" }));
  const saved = within(
    screen.getByRole("region", { name: "Saved joining plan" }),
  );
  for (const value of [
    "Example Vessel",
    "Primary",
    "Mumbai",
    "Vessel Contact",
    "contact@example.invalid",
    "1234567890",
    "VOY-01",
    "Passport",
    "Medical certificate",
    "Report at the main gate.",
  ]) {
    expect(saved.getByText(value)).toBeTruthy();
  }
  expect(saved.queryAllByRole("textbox")).toHaveLength(0);
  expect(saved.queryAllByRole("combobox")).toHaveLength(0);
  expect(
    screen.queryByRole("button", { name: "Send Joining Intimation" }),
  ).toBeNull();
  expect(api.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Record Communication" }));
  expect(screen.getByRole("textbox", { name: "New remarks" }).value).toBe(
    "Unsaved note",
  );
  expect(onSubmit).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
});

it("shows the recorded administrator, dates, confirmation and remarks without editable fields", async () => {
  api.get.mockResolvedValue({
    data: {
      data: [
        record,
        {
          ...record,
          id: "older",
          plan_revision: 1,
          mode: "Email",
          confirmation_received: 1,
          delivery_status: "Failed",
          failure_reason: "Delivery failed",
          candidate_remarks: "Older note",
        },
      ],
    },
  });
  const onSubmit = setup();
  fireEvent.click(screen.getByRole("button", { name: "Candidate Informed" }));
  expect(await screen.findByText("WhatsApp contact · Latest")).toBeTruthy();
  const history = within(
    screen.getByRole("region", { name: "Previous communications" }),
  );
  expect(history.getAllByText("Previous Administrator")).toHaveLength(2);
  expect(history.getByText("Will confirm tomorrow.")).toBeTruthy();
  expect(history.getByText("Previous plan version")).toBeTruthy();
  expect(history.getByText("Delivery failed")).toBeTruthy();
  expect(history.getByText("No")).toBeTruthy();
  expect(history.getByText("Yes")).toBeTruthy();
  expect(history.queryAllByRole("textbox")).toHaveLength(0);
  expect(api.get).toHaveBeenCalledWith(
    "/allocations/joining-plans/plan-1/communications",
    expect.objectContaining({ signal: expect.anything() }),
  );
  expect(onSubmit).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
});

it("lets users inspect an empty communication history before the candidate is informed", async () => {
  api.get.mockResolvedValue({ data: { data: [] } });
  setup({ previouslyInformed: false });
  fireEvent.click(screen.getByRole("button", { name: "Candidate Informed" }));
  expect(
    await screen.findByText(/No previous communications have been recorded/),
  ).toBeTruthy();
});

it("shows loading failures and retries the read-only request", async () => {
  api.get
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { data: [record] } });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Candidate Informed" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Retry loading history" }),
  );
  expect(await screen.findByText("WhatsApp contact · Latest")).toBeTruthy();
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(api.post).not.toHaveBeenCalled();
});

it("does not show a stale response after switching back to the saved plan", async () => {
  let resolve;
  api.get.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Candidate Informed" }));
  const signal = api.get.mock.calls[0][1].signal;
  fireEvent.click(screen.getByRole("button", { name: "Plan Ready" }));
  expect(signal.aborted).toBe(true);
  resolve({ data: { data: [record] } });
  await waitFor(() =>
    expect(
      screen.getByRole("region", { name: "Saved joining plan" }),
    ).toBeTruthy(),
  );
  expect(screen.queryByText("Will confirm tomorrow.")).toBeNull();
});
