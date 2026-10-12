import React from "react";
import { Field } from "./AllocationPrimitives";
import { StaffSelect } from "./JoiningWorkflowFields";
import { inputClass } from "../allocationUtils";
import { Button } from "../../../components/ui/button";

export default function VesselFollowupSection({
  allocation,
  value,
  onChange,
  users,
  loading,
  error,
  onRetry,
  disabled,
  onReassign,
  reassignDisabled,
}) {
  // Keep the saved name visible when its owner is no longer in the active-user list.
  const options =
    allocation.owner && !users.some((u) => u.id === allocation.follow_up_user_id)
      ? [
          ...users,
          {
            id: allocation.follow_up_user_id,
            name: allocation.owner.name,
            status: allocation.owner.status,
            role: allocation.owner.status === "inactive" ? "Inactive" : null,
          },
        ]
      : users;
  return (
    <section
      aria-label="Follow-up Details"
      className="space-y-4 rounded-xl border border-[#3a5f9e]/25 p-4"
    >
      <h3 className="font-bold text-slate-900">Follow-up Details</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {allocation.abilities.can_assign && !allocation.follow_up_user_id ? (
          <StaffSelect
            label="Follow-up Person (Informed By)"
            users={options}
            value={value}
            onChange={onChange}
            disabled={disabled || loading || Boolean(error)}
          />
        ) : (
          <Field label="Follow-up Person (Informed By)">
            <input
              className={inputClass + " w-full bg-slate-50"}
              readOnly
              value={allocation.owner?.name || "Not assigned"}
            />
          </Field>
        )}
      </div>
      {!allocation.follow_up_user_id && allocation.abilities.can_send && (
        <p className="text-xs text-slate-500">
          Assign a follow-up person before sending a joining email.
        </p>
      )}
      {allocation.follow_up_user_id && allocation.abilities.can_assign && (
        <div>
          <Button variant="outline" disabled={reassignDisabled} onClick={onReassign}>
            Reassign Follow-up Person
          </Button>
          {reassignDisabled && (
            <p className="mt-2 text-sm text-amber-700">
              Save joining changes before reassigning this person.
            </p>
          )}
        </div>
      )}
      {error && !allocation.follow_up_user_id && (
        <div role="alert" className="flex items-center gap-3 text-sm text-red-700">
          {error}
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </section>
  );
}
