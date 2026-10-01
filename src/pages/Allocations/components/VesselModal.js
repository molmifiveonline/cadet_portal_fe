import {
  hasJoiningPlan,
  isDepartmentCompatible,
  isPlanIntimated,
} from "../allocationUtils";
import React, { useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Modal, Field, Status } from "./AllocationPrimitives";
import VesselSlot from "./VesselSlot";
import { Button } from "../../../components/ui/button";
import { Mail } from "lucide-react";

const VesselModal = ({
  allocation,
  role,
  readOnly: viewOnly,
  canManageJoiningPlans,
  canCommunicate,
  list,
  types,
  vessels,
  joiningPlan,
  onCreateJoiningPlan,
  onCommunicate,
  onClose,
  onSaved,
}) => {
  const planCreated = hasJoiningPlan(allocation, role) || Boolean(joiningPlan);
  const readOnly = viewOnly || planCreated;
  const compatibleTypes = types.filter((item) =>
    isDepartmentCompatible(item.department, list.department),
  );
  const secondary = role === "Secondary";
  const typeField = secondary ? "secondary_vessel_type_id" : "vessel_type_id";
  const vesselField = secondary ? "secondary_vessel_id" : "vessel_id";
  const statusField = secondary
    ? "secondary_allocation_status"
    : "allocation_status";
  const otherVesselId = secondary
    ? allocation.vessel_id
    : allocation.secondary_vessel_id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vessel_type_id: allocation.vessel_type_id || "",
    vessel_id: allocation.vessel_id || "",
    allocation_status: allocation.allocation_status || "Pending",
    secondary_vessel_type_id: allocation.secondary_vessel_type_id || "",
    secondary_vessel_id: allocation.secondary_vessel_id || "",
    secondary_allocation_status:
      allocation.secondary_allocation_status || "Pending",
    admin_remarks: allocation.admin_remarks || "",
  });
  const vesselRequired =
    ["Allocated", "Hold"].includes(form[statusField]) && !form[vesselField];
  const save = async () => {
    if (readOnly || vesselRequired) return;
    try {
      setSaving(true);
      await api.put(
        `/allocations/candidate-allocations/${allocation.id}/vessel`,
        form,
      );
      toast.success(`${role} vessel allocation saved`);
      onSaved();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save vessel allocation",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      title={`${role} Vessel Allocation — ${allocation.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-[96vw]"
    >
      <div className="space-y-5">
        {planCreated && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            The {role.toLowerCase()} vessel assignment is locked because its
            joining plan has been created.
          </p>
        )}
        <div className="grid gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Candidate</p>
            <p className="font-semibold text-slate-900">
              {allocation.name_as_in_indos_cert}
            </p>
            <p className="text-xs text-slate-500">
              {allocation.cadet_unique_id}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Department</p>
            <p className="font-semibold text-slate-900">{list.department}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Rank</p>
            <p className="font-semibold text-[#3a5f9e]">
              {allocation.current_rank
                ? `#${allocation.current_rank}`
                : "Not ranked"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Final Score</p>
            <p className="font-semibold text-slate-900">
              {allocation.final_score === null
                ? "Incomplete"
                : Number(allocation.final_score).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 text-sm text-[#2b4b80]">
          <p>
            The department filter is automatic. Seat counts are for reference
            only and do not limit allocation.
          </p>
          <span className="rounded-full bg-[#3a5f9e] px-3 py-1 text-xs font-bold text-white">
            Showing {list.department} + Both-compatible vessels
          </span>
        </div>
        <VesselSlot
          role={role}
          typeField={typeField}
          vesselField={vesselField}
          statusField={statusField}
          form={form}
          setForm={setForm}
          types={compatibleTypes}
          vessels={vessels}
          department={list.department}
          otherVesselId={otherVesselId}
          readOnly={readOnly}
        />
        <Field label="Admin remarks">
          <textarea
            disabled={readOnly}
            className="min-h-20 w-full rounded-md border p-2 text-sm disabled:bg-slate-50"
            value={form.admin_remarks}
            onChange={(e) =>
              setForm({ ...form, admin_remarks: e.target.value })
            }
          />
        </Field>
        {vesselRequired && (
          <p className="text-sm font-semibold text-red-600">
            Select an actual vessel before using {form[statusField]} status.
          </p>
        )}
        {readOnly && joiningPlan && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 text-sm">
            <span className="font-semibold text-slate-700">Joining Plan:</span>
            <Status status={joiningPlan.status || "Draft"} />
            <span className="font-semibold text-slate-700">Communication:</span>
            <Status
              status={isPlanIntimated(joiningPlan) ? "Recorded" : "Pending"}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {readOnly &&
            canManageJoiningPlans &&
            list.status === "Finalized" &&
            form[statusField] === "Allocated" &&
            form[vesselField] &&
            (joiningPlan && !Number(joiningPlan.requires_refresh) ? (
              canCommunicate && (
                <Button onClick={() => onCommunicate(joiningPlan)}>
                  <Mail size={16} className="mr-2" />
                  Record Communication
                </Button>
              )
            ) : (
              <Button onClick={onCreateJoiningPlan}>
                <Mail size={16} className="mr-2" />
                {joiningPlan ? "Update Joining Plan" : "Create Joining Plan"}
              </Button>
            ))}
          {!readOnly && (
            <Button disabled={saving || vesselRequired} onClick={save}>
              {saving ? "Saving…" : `Save ${role} Allocation`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VesselModal;
