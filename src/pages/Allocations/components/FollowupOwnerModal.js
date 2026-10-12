import React, { useEffect, useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Modal, Field } from "./AllocationPrimitives";
import { StaffSelect } from "./JoiningWorkflowFields";
import { Button } from "../../../components/ui/button";

export default function FollowupOwnerModal({ allocation, onClose, onSaved }) {
  const reassigning = Boolean(allocation.follow_up_user_id);
  const [reason, setReason] = useState("");
  const [users, setUsers] = useState([]),
    [owner, setOwner] = useState(allocation.follow_up_user_id || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/allocations/follow-up-users")
      .then((r) => setUsers(r.data.data))
      .catch(() => setError("Could not load users. Reopen to retry."));
  }, []);
  const save = async () => {
    if (
      (owner || null) === (allocation.follow_up_user_id || null) ||
      (reassigning && reason.trim().length < 3)
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api.put(`/allocations/candidate-allocations/${allocation.id}/follow-up-owner`, {
        user_id: owner || null,
        expected_follow_up_user_id: allocation.follow_up_user_id || null,
        remarks: reason.trim(),
      });
      toast.success("Follow-up responsibility saved");
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || "Could not assign user");
    } finally {
      setBusy(false);
    }
  };
  const options =
    allocation.owner && !users.some((u) => u.id === allocation.follow_up_user_id)
      ? [
          ...users,
          { id: allocation.follow_up_user_id, name: allocation.owner.name, status: "inactive" },
        ]
      : users;
  return (
    <Modal
      title={`${reassigning ? "Reassign" : "Assign"} Follow-up Person — ${allocation.name_as_in_indos_cert}`}
      onClose={() => !busy && onClose()}
    >
      <p className="mb-4 text-sm text-slate-600">
        {reassigning
          ? "Transfer responsibility for both vessels. This cadet moves to the new person's My Follow-ups. Previous contact records stay in History."
          : "Choose one person to follow up with this cadet for both vessels."}
      </p>
      {reassigning && (
        <p className="mb-4 text-sm">
          Current person: <strong>{allocation.owner?.name || "Unavailable user"}</strong>
        </p>
      )}
      <StaffSelect
        label={reassigning ? "New Follow-up Person" : "Follow-up Person"}
        emptyLabel={reassigning ? "Remove assignment" : "Select person"}
        users={options}
        value={owner}
        onChange={setOwner}
        disabled={busy}
      />
      {reassigning && (
        <div className="mt-4">
          <Field label="Reason for Reassignment">
            <textarea
              aria-label="Reason for Reassignment"
              className="min-h-24 w-full rounded border p-2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={4000}
              disabled={busy}
              placeholder="For example: current person is on leave"
            />
          </Field>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={
            busy ||
            !users.length ||
            (owner || null) === (allocation.follow_up_user_id || null) ||
            (reassigning && reason.trim().length < 3)
          }
          onClick={save}
        >
          {busy
            ? "Saving…"
            : reassigning
              ? owner
                ? "Reassign Follow-up Person"
                : "Remove Assignment"
              : "Assign Follow-up Person"}
        </Button>
      </div>
    </Modal>
  );
}
