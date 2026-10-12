import React, { useEffect, useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { Modal, Field } from "./AllocationPrimitives";
import { AssignedFollowupPerson, todayInIndia } from "./JoiningWorkflowFields";
import { Button } from "../../../components/ui/button";
import CcRecipientsEditor from "../../../components/common/CcRecipientsEditor";

const newRequestKey = () =>
  crypto.randomUUID?.() ||
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");

export default function JoiningEmailModal({ plan, onClose, onSent }) {
  const [preview, setPreview] = useState(null),
    [ccEnabled, setCcEnabled] = useState(false),
    [cc, setCc] = useState([]);
  const [informedBy, setInformedBy] = useState(""),
    [date, setDate] = useState(todayInIndia()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [outcome, setOutcome] = useState(null);
  const storageKey = `joining-email-${plan.id}-${plan.revision}`;
  const [requestKey, setRequestKey] = useState(
    () => sessionStorage.getItem(storageKey) || newRequestKey(),
  );
  useEffect(() => {
    let active = true;
    api
      .get(`/allocations/joining-plans/${plan.id}/email-preview`, {
        params: { revision: plan.revision },
      })
      .then((p) => {
        if (active) {
          setPreview(p.data.data);
          setInformedBy(p.data.data.follow_up_user_id || "");
        }
      })
      .catch(
        (e) => active && setError(e.response?.data?.message || "Could not load email preview"),
      );
    return () => {
      active = false;
    };
  }, [plan.id, plan.revision]);
  const send = async () => {
    if (!informedBy || !date) {
      setError("Select Informed By and Date of Informing.");
      return;
    }
    if (ccEnabled && (!cc.length || cc.some((c) => !c.email?.trim()))) {
      setError("Enter an email address for every CC recipient.");
      return;
    }
    setBusy(true);
    setError("");
    sessionStorage.setItem(storageKey, requestKey);
    try {
      const r = await api.post(`/allocations/joining-plans/${plan.id}/send-intimation`, {
        expected_revision: plan.revision,
        request_key: requestKey,
        cc: ccEnabled ? cc : [],
        informed_by: informedBy,
        date_of_informing: date,
      });
      const result = r.data.data;
      setOutcome(result.status);
      if (result.status === "Sent") {
        sessionStorage.removeItem(storageKey);
        onSent();
      } else {
        setError(
          result.failure_reason || "Delivery is still awaiting review. Do not send another copy.",
        );
        if (result.status === "Failed") {
          sessionStorage.removeItem(storageKey);
          setRequestKey(newRequestKey());
        }
      }
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "The send result could not be loaded. Retry checks the same send request without creating another email.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Confirm Joining Email" width="max-w-3xl" onClose={() => !busy && onClose()}>
      <div className="space-y-4">
        <p className="font-semibold">
          {plan.name_as_in_indos_cert} · {plan.vessel_role}
        </p>
        {preview && (
          <>
            <p>
              To: <strong>{preview.recipient_email}</strong>
            </p>
            <p>Subject: {preview.subject}</p>
            <iframe
              title="Joining email preview"
              sandbox=""
              srcDoc={preview.html}
              className="h-72 w-full rounded border bg-white"
            />
          </>
        )}
        <CcRecipientsEditor
          enabled={ccEnabled}
          onEnabledChange={setCcEnabled}
          recipients={cc}
          onChange={setCc}
          disabled={busy}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <AssignedFollowupPerson
            userId={informedBy}
            owner={{ name: preview?.follow_up_user_name, status: preview?.follow_up_user_status }}
          />
          <Field label="Date of Informing">
            <input
              aria-label="Date of Informing"
              className="h-9 w-full rounded border px-2"
              type="date"
              max={todayInIndia()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={busy}
            />
          </Field>
        </div>
        <p className="text-xs text-slate-500">
          Sent means the mail server accepted the email. The cadet’s confirmation is recorded
          separately.
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
            disabled={
              busy ||
              !preview ||
              !informedBy ||
              preview?.follow_up_user_status === "inactive" ||
              ["Sending", "Unknown"].includes(outcome)
            }
            onClick={send}
          >
            {busy ? "Sending…" : outcome === "Failed" ? "Retry Email" : "Send Email"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
