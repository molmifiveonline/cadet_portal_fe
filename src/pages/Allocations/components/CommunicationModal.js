import React, { useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Modal, Field } from "./AllocationPrimitives";
import { AssignedFollowupPerson, todayInIndia } from "./JoiningWorkflowFields";
import { Button } from "../../../components/ui/button";

export default function CommunicationModal({
  plan,
  admins,
  followupUserId,
  followupOwner,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    mode: plan.last_contact?.mode || plan.last_mode || "Email",
    informed_by: followupUserId || "",
    date_of_informing: todayInIndia(),
    confirmation_received: Boolean(Number(plan.confirmation_received)),
    candidate_remarks: "",
    admin_remarks: "",
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const field = (name, value) => setForm({ ...form, [name]: value });
  const save = async () => {
    if (!form.informed_by || !form.date_of_informing) {
      setError("Select Informed By and Date of Informing.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(`/allocations/joining-plans/${plan.id}/communications`, {
        ...form,
        expected_revision: plan.revision,
      });
      toast.success(form.confirmation_received ? "Confirmation recorded" : "Follow-up recorded");
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || "Could not record follow-up");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={`${plan.vessel_role} Follow-up — ${plan.name_as_in_indos_cert}`}
      onClose={() => !busy && onClose()}
      width="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-semibold">
            {plan.vessel_role} · {plan.vessel_name}
          </p>
          <p>
            Joining: {plan.joining_date || "Not set"} · Reporting:{" "}
            {plan.reporting_port || "Not set"}
          </p>
        </div>
        <p className="text-sm text-slate-600">
          Record contact already handled outside the portal. This form does not send an email, make
          a call, or send a WhatsApp message.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Communication Mode</legend>
            <div className="flex gap-2">
              {["Email", "Phone", "WhatsApp"].map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={mode === form.mode ? "default" : "outline"}
                  aria-pressed={mode === form.mode}
                  disabled={busy}
                  onClick={() => field("mode", mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>
          </fieldset>
          <AssignedFollowupPerson userId={form.informed_by} owner={followupOwner} users={admins} />
          <Field label="Date of Informing">
            <input
              aria-label="Date of Informing"
              type="date"
              max={todayInIndia()}
              className="h-10 w-full rounded border px-2"
              value={form.date_of_informing}
              onChange={(e) => field("date_of_informing", e.target.value)}
              disabled={busy}
            />
          </Field>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">
              Confirmation Received
            </legend>
            <div className="flex gap-2">
              {[false, true].map((value) => (
                <Button
                  key={String(value)}
                  type="button"
                  variant={value === form.confirmation_received ? "default" : "outline"}
                  aria-pressed={value === form.confirmation_received}
                  disabled={busy}
                  onClick={() => field("confirmation_received", value)}
                >
                  {value ? "Yes" : "No"}
                </Button>
              ))}
            </div>
          </fieldset>
          <Field label="Candidate Remarks">
            <textarea
              className="min-h-24 w-full rounded border p-2"
              value={form.candidate_remarks}
              maxLength={10000}
              onChange={(e) => field("candidate_remarks", e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Admin Remarks">
            <textarea
              className="min-h-24 w-full rounded border p-2"
              value={form.admin_remarks}
              maxLength={10000}
              onChange={(e) => field("admin_remarks", e.target.value)}
              disabled={busy}
            />
          </Field>
        </div>
        <p className="text-xs text-slate-500">
          The timestamp is recorded automatically and displayed in India time (IST). Email contacts
          saved here are marked Recorded externally.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={busy || !form.informed_by || followupOwner?.status === "inactive"}
          >
            {busy
              ? "Saving…"
              : form.confirmation_received
                ? "Record Confirmation"
                : "Record Communication"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
