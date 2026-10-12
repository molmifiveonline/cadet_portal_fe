import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import JoiningEmailModal from "./components/JoiningEmailModal";
import api from "../../lib/utils/apiConfig";

jest.mock("../../lib/utils/apiConfig", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../context/AuthContext", () => ({ useAuth: () => ({ user: { id: "admin" } }) }));
const plan = {
  id: "plan",
  revision: 4,
  name_as_in_indos_cert: "Test Cadet",
  vessel_role: "Secondary",
};
const ready = async () => {
  const onSent = jest.fn();
  render(<JoiningEmailModal plan={plan} onClose={jest.fn()} onSent={onSent} />);
  await screen.findByTitle("Joining email preview");
  return onSent;
};
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  let n = 0;
  Object.defineProperty(global, "crypto", {
    configurable: true,
    value: { randomUUID: () => `request-key-${++n}-12345` },
  });
  api.get.mockImplementation(async (url) => ({
    data: {
      data: url.endsWith("email-preview")
        ? {
            follow_up_user_id: "admin",
            follow_up_user_name: "Admin",
            follow_up_user_status: "active",
            recipient_email: "cadet@example.test",
            subject: "Updated Joining Intimation – MOLMI",
            html: "<p>Vessel A · Mumbai</p>",
          }
        : [{ id: "admin", name: "Admin", role: "SuperAdmin" }],
    },
  }));
});
it("only sends after confirmation, with saved revision and optional CC", async () => {
  const onSent = await ready();
  expect(api.post).not.toHaveBeenCalled();
  expect(screen.getByText("cadet@example.test")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: /Add CC recipients/ }));
  fireEvent.change(screen.getByLabelText("CC email address 1"), {
    target: { value: "copy@example.test" },
  });
  api.post.mockResolvedValue({ data: { data: { status: "Sent" } } });
  fireEvent.click(screen.getByRole("button", { name: "Send Email" }));
  await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
  expect(api.post).toHaveBeenCalledWith(
    "/allocations/joining-plans/plan/send-intimation",
    expect.objectContaining({
      expected_revision: 4,
      cc: [{ email: "copy@example.test" }],
      informed_by: "admin",
      request_key: "request-key-1-12345",
    }),
  );
  expect(sessionStorage.getItem("joining-email-plan-4")).toBeNull();
});
it("retains the request identifier after a lost response to prevent a duplicate send", async () => {
  const onSent = await ready();
  api.post.mockRejectedValueOnce(new Error("Network lost"));
  fireEvent.click(screen.getByRole("button", { name: "Send Email" }));
  await screen.findByRole("alert");
  api.post.mockResolvedValueOnce({ data: { data: { status: "Sent", replayed: true } } });
  fireEvent.click(screen.getByRole("button", { name: "Send Email" }));
  await waitFor(() => expect(onSent).toHaveBeenCalled());
  expect(api.post.mock.calls[0][1].request_key).toBe(api.post.mock.calls[1][1].request_key);
});
it("offers an explicit retry only after a definite failure", async () => {
  await ready();
  api.post.mockResolvedValueOnce({
    data: { data: { status: "Failed", failure_reason: "Rejected" } },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send Email" }));
  const retry = await screen.findByRole("button", { name: "Retry Email" });
  expect(api.post).toHaveBeenCalledTimes(1);
  api.post.mockResolvedValueOnce({
    data: { data: { status: "Unknown", failure_reason: "Delivery needs review" } },
  });
  fireEvent.click(retry);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Delivery needs review"));
  expect(api.post.mock.calls[0][1].request_key).not.toBe(api.post.mock.calls[1][1].request_key);
  expect(screen.getByRole("button", { name: "Send Email" })).toBeDisabled();
});
it("uses the assigned follow-up person rather than the sending admin", async () => {
  api.get.mockImplementation(async (url) => ({
    data: {
      data: url.endsWith("email-preview")
        ? {
            recipient_email: "cadet@example.test",
            html: "<p>Joining details</p>",
            follow_up_user_id: "owner",
            follow_up_user_name: "Follow-up Person",
            follow_up_user_status: "active",
          }
        : [{ id: "owner", name: "Follow-up Person", role: "Custom Staff" }],
    },
  }));
  const onSent = await ready();
  expect(screen.getByRole("textbox", { name: "Informed By" })).toHaveAttribute("readonly");
  api.post.mockResolvedValue({ data: { data: { status: "Sent" } } });
  fireEvent.click(screen.getByRole("button", { name: "Send Email" }));
  await waitFor(() => expect(onSent).toHaveBeenCalled());
  expect(api.post).toHaveBeenCalledWith(
    "/allocations/joining-plans/plan/send-intimation",
    expect.objectContaining({ informed_by: "owner" }),
  );
});
