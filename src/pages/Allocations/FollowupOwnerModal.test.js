import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FollowupOwnerModal from "./components/FollowupOwnerModal";
import api from "../../lib/utils/apiConfig";

jest.mock("../../lib/utils/apiConfig", () => ({ get: jest.fn(), put: jest.fn() }));
jest.mock("./components/JoiningWorkflowFields", () => ({
  StaffSelect: ({ label, users, value, onChange, disabled, emptyLabel }) => (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">{emptyLabel}</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </label>
  ),
}));
const allocation = {
  id: "allocation",
  name_as_in_indos_cert: "Test Cadet",
  follow_up_user_id: "old",
  owner: { name: "Previous Owner" },
};
beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({
    data: {
      data: [
        { id: "old", name: "Previous Owner" },
        { id: "new", name: "New Owner" },
      ],
    },
  });
  api.put.mockResolvedValue({ data: { success: true } });
});
it("requires a different person and reason before transferring responsibility", async () => {
  const saved = jest.fn();
  render(<FollowupOwnerModal allocation={allocation} onClose={jest.fn()} onSaved={saved} />);
  const select = await screen.findByLabelText("New Follow-up Person");
  await screen.findByRole("option", { name: "New Owner" });
  const button = screen.getByRole("button", { name: "Reassign Follow-up Person" });
  expect(button).toBeDisabled();
  fireEvent.change(select, { target: { value: "new" } });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Reason for Reassignment"), {
    target: { value: "Previous person is on leave" },
  });
  fireEvent.click(button);
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(api.put).toHaveBeenCalledWith(
    "/allocations/candidate-allocations/allocation/follow-up-owner",
    { user_id: "new", expected_follow_up_user_id: "old", remarks: "Previous person is on leave" },
  );
});
it("makes removal explicit and preserves the form if another admin changed ownership", async () => {
  api.put.mockRejectedValue({
    response: { data: { message: "Follow-up person changed. Reload before saving." } },
  });
  render(<FollowupOwnerModal allocation={allocation} onClose={jest.fn()} onSaved={jest.fn()} />);
  await screen.findByRole("option", { name: "New Owner" });
  fireEvent.change(screen.getByLabelText("New Follow-up Person"), { target: { value: "" } });
  const remove = screen.getByRole("button", { name: "Remove Assignment" });
  expect(remove).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Reason for Reassignment"), {
    target: { value: "Awaiting new coordinator" },
  });
  fireEvent.click(remove);
  expect(await screen.findByRole("alert")).toHaveTextContent("Reload before saving");
  expect(screen.getByLabelText("Reason for Reassignment")).toHaveValue("Awaiting new coordinator");
});
