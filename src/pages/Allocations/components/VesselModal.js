import React, { useCallback, useEffect, useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Modal, Field } from "./AllocationPrimitives";
import { Button } from "../../../components/ui/button";
import VesselSlot from "./VesselSlot";
import { JoiningDetailsFields, getJoiningDetails } from "./JoiningWorkflowFields";
import JoiningEmailModal from "./JoiningEmailModal";
import AllocationHistoryModal from "./AllocationHistoryModal";
import VesselFollowupSection from "./VesselFollowupSection";
import FollowupOwnerModal from "./FollowupOwnerModal";

export default function VesselModal({ allocation, role, onClose, onSaved }) {
  const [staff, setStaff] = useState([]);
  const [followupUser, setFollowupUser] = useState("");
  const [staffError, setStaffError] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [record, setRecord] = useState(null),
    [lookups, setLookups] = useState({ types: [], vessels: [] }),
    [form, setForm] = useState({}),
    [details, setDetails] = useState(getJoiningDetails()),
    [initial, setInitial] = useState("");
  const [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dialog, setDialog] = useState(null);
  const secondary = role === "Secondary",
    vesselField = secondary ? "secondary_vessel_id" : "vessel_id",
    typeField = secondary ? "secondary_vessel_type_id" : "vessel_type_id",
    statusField = secondary ? "secondary_allocation_status" : "allocation_status",
    versionField = secondary ? "secondary_plan_version" : "primary_plan_version";
  const load = useCallback(async () => {
    const [r, l] = await Promise.all([
      api.get(`/allocations/follow-ups/${allocation.id}`),
      api.get(`/allocations/follow-ups/${allocation.id}/lookups`),
    ]);
    const current = r.data.data,
      options = l.data.data,
      plan = current.plans.find((p) => p.vessel_role === role);
    const slot = {
      vessel_id: current.vessel_id || "",
      vessel_type_id: current.vessel_type_id || "",
      allocation_status: current.allocation_status || "Pending",
      secondary_vessel_id: current.secondary_vessel_id || "",
      secondary_vessel_type_id: current.secondary_vessel_type_id || "",
      secondary_allocation_status: current.secondary_allocation_status || "Pending",
    };
    const fields = getJoiningDetails(
      plan || options.vessels.find((v) => v.id === current[vesselField]),
    );
    setRecord(current);
    setFollowupUser(current.follow_up_user_id || "");
    setLookups(options);
    setForm(slot);
    setDetails(fields);
    setInitial(JSON.stringify([slot, fields]));
    setReason("");
    return current;
  }, [allocation.id, role, vesselField]);
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || "Could not load allocation"));
  }, [load]);
  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    setStaffError("");
    try {
      const response = await api.get("/allocations/follow-up-users");
      setStaff(response.data.data);
    } catch (e) {
      setStaffError("Could not load follow-up people.");
    } finally {
      setStaffLoading(false);
    }
  }, []);
  useEffect(() => {
    if (record?.abilities.can_assign && !record.follow_up_user_id) loadStaff();
  }, [record?.abilities.can_assign, record?.follow_up_user_id, loadStaff]);
  const dirty = JSON.stringify([form, details]) !== initial;
  const ownerDirty = Boolean(record) && followupUser !== (record.follow_up_user_id || "");
  const plan = record?.plans.find((p) => p.vessel_role === role);
  const needsReview = Boolean(
    plan && (Number(plan.requires_refresh) || plan.vessel_id !== record[vesselField]),
  );
  const readOnly = !record?.abilities.can_edit;
  const changedVessel = (next) => {
    if (next[vesselField] !== form[vesselField])
      setDetails(getJoiningDetails(lookups.vessels.find((v) => v.id === next[vesselField])));
    setForm(next);
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const ownerChange = ownerDirty
        ? {
            follow_up_user_id: followupUser || null,
            expected_follow_up_user_id: record.follow_up_user_id || null,
          }
        : {};
      if (ownerDirty && (readOnly || (!dirty && plan && !needsReview))) {
        await api.put(`/allocations/candidate-allocations/${allocation.id}/follow-up-owner`, {
          user_id: followupUser || null,
          expected_follow_up_user_id: record.follow_up_user_id || null,
        });
      } else
        await api.patch(`/allocations/candidate-allocations/${allocation.id}/vessel-plan`, {
          ...ownerChange,
          vessel_role: role,
          expected_version: record[versionField],
          vessel_id: form[vesselField] || null,
          allocation_status: form[statusField],
          change_reason: reason,
          joining_details: {
            ...details,
            required_documents: details.required_documents
              .split(/\n/)
              .map((v) => v.trim())
              .filter(Boolean),
          },
        });
      await load();
      onSaved?.();
      toast.success(`${role} allocation saved`);
    } catch (e) {
      setError(e.response?.data?.message || "Could not save allocation");
    } finally {
      setBusy(false);
    }
  };
  const sent = async () => {
    setDialog(null);
    toast.success("Joining email sent.");
    await load();
    onSaved?.();
  };
  if (dialog === "email")
    return (
      <JoiningEmailModal
        plan={plan}
        onClose={() => setDialog(null)}
        onSent={() => sent().catch(() => setError("Email sent; reload to check its status."))}
      />
    );
  if (dialog === "owner")
    return (
      <FollowupOwnerModal
        allocation={record}
        onClose={() => setDialog(null)}
        onSaved={() => {
          setDialog(null);
          load().catch(() =>
            setError("Assignment saved. Reload to see the current follow-up person."),
          );
          onSaved?.();
        }}
      />
    );
  if (dialog === "history")
    return <AllocationHistoryModal allocationId={allocation.id} onClose={() => setDialog(null)} />;
  return (
    <Modal
      title={`${role} Vessel Allocation — ${record?.name_as_in_indos_cert || allocation.name_as_in_indos_cert || ""}`}
      width="max-w-6xl"
      onClose={() => !busy && onClose()}
    >
      {error && (
        <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
          {!record && (
            <Button variant="outline" onClick={() => load().catch(() => {})}>
              Retry
            </Button>
          )}
        </p>
      )}
      {!record ? (
        <p>Loading allocation…</p>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            {record.cadet_unique_id} · {record.department}. Total seats are for reference only.
          </p>
          {record.onboarding_status === "Onboarded" && (
            <p className="rounded bg-slate-100 p-3 text-sm">
              Onboarding is complete. Joining details are locked.
            </p>
          )}
          {record.admission_source && record.onboarding_status !== "Onboarded" && (
            <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">
              This cadet is available in Onboarding. Sending a joining email is optional.
            </p>
          )}
          <VesselSlot
            role={role}
            typeField={typeField}
            vesselField={vesselField}
            statusField={statusField}
            form={form}
            setForm={changedVessel}
            types={lookups.types}
            vessels={lookups.vessels}
            department={record.department}
            otherVesselId={record[secondary ? "vessel_id" : "secondary_vessel_id"]}
            readOnly={readOnly || busy}
          />
          <JoiningDetailsFields form={details} onChange={setDetails} disabled={readOnly || busy} />
          <VesselFollowupSection
            allocation={record}
            value={followupUser}
            onChange={setFollowupUser}
            users={staff}
            loading={staffLoading}
            error={staffError}
            onRetry={loadStaff}
            onReassign={() => setDialog("owner")}
            reassignDisabled={busy || dirty || ownerDirty}
            disabled={
              busy ||
              !record.abilities.can_assign ||
              !(
                record.admission_source ||
                (form.vessel_id &&
                  ["Allocated", "Hold", "Cancelled"].includes(form.allocation_status)) ||
                (form.secondary_vessel_id &&
                  ["Allocated", "Hold", "Cancelled"].includes(form.secondary_allocation_status))
              )
            }
          />
          {!readOnly && record[vesselField] && (
            <Field label="Reason for Change">
              <textarea
                aria-label="Reason for Change"
                className="min-h-20 w-full rounded border p-2"
                maxLength={4000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required when changing the vessel or joining date"
                disabled={busy}
              />
            </Field>
          )}
          {plan?.email_status && (
            <p className="text-sm">
              Latest joining email: <strong>{plan.email_status}</strong>
              {plan.updated_email_pending && (
                <span className="ml-3 text-amber-700">Updated email pending</span>
              )}
            </p>
          )}
          {plan?.email_failure_reason && (
            <p className="text-sm text-red-700">{plan.email_failure_reason}</p>
          )}
          {(dirty || ownerDirty || needsReview) && (
            <p className="text-sm text-amber-700">
              Save your changes before sending the joining email.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setDialog("history")}>
              History
            </Button>
            <Button variant="outline" disabled={busy} onClick={onClose}>
              Close
            </Button>
            {(!readOnly || record.abilities.can_assign) && (
              <Button
                disabled={
                  busy || (!ownerDirty && (readOnly || (!dirty && Boolean(plan) && !needsReview)))
                }
                onClick={save}
              >
                {busy ? "Saving…" : "Save Allocation"}
              </Button>
            )}
            {record.abilities.can_send && (
              <Button
                disabled={
                  busy ||
                  dirty ||
                  ownerDirty ||
                  needsReview ||
                  !plan ||
                  !record.follow_up_user_id ||
                  form[statusField] !== "Allocated" ||
                  !details.joining_date ||
                  !details.reporting_port.trim() ||
                  !details.contact_person_name.trim() ||
                  ["Sending", "Unknown"].includes(plan?.email_status)
                }
                onClick={() => setDialog("email")}
              >
                {plan?.updated_email_pending
                  ? "Send Updated Intimation"
                  : plan?.current_email_sent
                    ? "Resend Joining Intimation"
                    : "Send Joining Intimation"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
