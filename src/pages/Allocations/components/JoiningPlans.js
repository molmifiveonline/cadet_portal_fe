import {
  isPlanIntimated,
  formatJoiningDate,
  formatRankHistoryDate,
} from "../allocationUtils";
import { Th, Td, QueueStep, Status } from "./AllocationPrimitives";
import { ChevronRight, ClipboardCheck, Mail } from "lucide-react";
import { Button } from "../../../components/ui/button";
import React from "react";

const JoiningPlans = ({
  cycle,
  plans,
  openJoiningPlan,
  openCommunication,
  canEdit = false,
  canCommunicate = false,
}) => {
  const currentPlans = plans.filter((plan) => !Number(plan.requires_refresh));
  const eligibleWithoutPlan = cycle.rank_lists
    .filter((list) => list.status === "Finalized")
    .flatMap((list) =>
      list.allocations.flatMap((item) => {
        const slots = [];
        if (
          item.allocation_status === "Allocated" &&
          (!item.primary_joining_plan_id ||
            Number(item.primary_joining_plan_requires_refresh))
        )
          slots.push({
            ...item,
            department: list.department,
            vesselRole: "Primary",
            refreshJoiningPlan: Boolean(
              Number(item.primary_joining_plan_requires_refresh),
            ),
          });
        if (
          item.secondary_allocation_status === "Allocated" &&
          (!item.secondary_joining_plan_id ||
            Number(item.secondary_joining_plan_requires_refresh))
        )
          slots.push({
            ...item,
            department: list.department,
            vesselRole: "Secondary",
            refreshJoiningPlan: Boolean(
              Number(item.secondary_joining_plan_requires_refresh),
            ),
          });
        return slots;
      }),
    );
  const pendingRows = eligibleWithoutPlan.map((item) => {
    const secondary = item.vesselRole === "Secondary";
    return {
      queueKey: `pending-${item.id}-${item.vesselRole}`,
      needsPlan: true,
      sourceAllocation: item,
      name_as_in_indos_cert: item.name_as_in_indos_cert,
      cadet_unique_id: item.cadet_unique_id,
      department: item.department,
      current_rank: item.current_rank,
      vessel_role: item.vesselRole,
      vessel_name: secondary ? item.secondary_vessel_name : item.vessel_name,
      vessel_type: secondary
        ? item.secondary_vessel_type_name
        : item.vessel_type_name,
      joining_date: secondary ? item.secondary_joining_date : item.joining_date,
      voyage_ref: secondary ? item.secondary_voyage_ref : item.voyage_ref,
      reporting_port: secondary
        ? item.secondary_reporting_port
        : item.reporting_port,
      location: secondary ? item.secondary_location : item.location,
    };
  });
  const queueRows = [
    ...pendingRows,
    ...currentPlans.map((plan) => ({
      ...plan,
      queueKey: `plan-${plan.id}`,
      needsPlan: false,
    })),
  ].sort(
    (left, right) =>
      String(left.department).localeCompare(String(right.department)) ||
      Number(left.current_rank || Number.MAX_SAFE_INTEGER) -
        Number(right.current_rank || Number.MAX_SAFE_INTEGER) ||
      String(left.vessel_role).localeCompare(String(right.vessel_role)),
  );
  const needsIntimation = currentPlans.filter(
    (plan) => !isPlanIntimated(plan),
  ).length;
  const awaitingConfirmation = currentPlans.filter(
    (plan) => isPlanIntimated(plan) && !Number(plan.confirmation_received),
  ).length;
  const confirmed = currentPlans.filter((plan) =>
    Boolean(Number(plan.confirmation_received)),
  ).length;

  const getNextActionLabel = (row) => {
    if (row.needsPlan)
      return row.sourceAllocation.refreshJoiningPlan
        ? "Update Plan"
        : "Create Plan";
    if (!isPlanIntimated(row)) return "Record Communication";
    if (!Number(row.confirmation_received)) return "Record Confirmation";
    return "Add Contact";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[#3a5f9e]/20 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Joining & Intimation Queue
          </h2>
          <p className="text-sm text-slate-500">
            Work from top to bottom. Each vessel assignment shows one next
            action.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Plan needed", pendingRows.length, "text-amber-700"],
            ["To record", needsIntimation, "text-[#3a5f9e]"],
            ["Awaiting reply", awaitingConfirmation, "text-sky-700"],
            ["Confirmed", confirmed, "text-emerald-700"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="min-w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center"
            >
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-h-[68vh] overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              <Th className="w-[190px]">Candidate</Th>
              <Th className="w-[175px]">Vessel</Th>
              <Th className="w-[190px]">Joining Details</Th>
              <Th className="w-[235px]">Progress</Th>
              <Th className="w-[175px]">Last Contact</Th>
              <Th className="sticky right-0 z-20 w-[170px] bg-slate-50">
                Next Action
              </Th>
            </tr>
          </thead>
          <tbody>
            {queueRows.map((row) => {
              const informed = !row.needsPlan && isPlanIntimated(row);
              const rowConfirmed =
                !row.needsPlan && Boolean(Number(row.confirmation_received));
              return (
                <tr
                  key={row.queueKey}
                  className="group border-t align-top hover:bg-[#3a5f9e]/[0.025]"
                >
                  <Td>
                    <p className="font-semibold text-slate-900">
                      {row.name_as_in_indos_cert}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.cadet_unique_id}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#3a5f9e]">
                      {row.department} · Rank #{row.current_rank || "—"}
                    </p>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-900">
                      {row.vessel_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {row.vessel_role}
                      </span>{" "}
                      · {row.vessel_type || "Type unavailable"}
                    </p>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-800">
                      {formatJoiningDate(row.joining_date)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.reporting_port ||
                        row.location ||
                        "Reporting port to be added"}
                    </p>
                    {row.voyage_ref && (
                      <p className="text-xs text-slate-500">
                        Voyage: {row.voyage_ref}
                      </p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-nowrap items-center gap-1">
                      <QueueStep label="Plan" complete={!row.needsPlan} />
                      <ChevronRight
                        size={12}
                        className="shrink-0 text-slate-300"
                      />
                      <QueueStep label="Informed" complete={informed} />
                      <ChevronRight
                        size={12}
                        className="shrink-0 text-slate-300"
                      />
                      <QueueStep label="Confirmed" complete={rowConfirmed} />
                    </div>
                    {!row.needsPlan &&
                      row.email_delivery_status === "Failed" && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          Email failed
                          {row.last_failure_reason
                            ? `: ${row.last_failure_reason}`
                            : ""}
                        </p>
                      )}
                  </Td>
                  <Td>
                    {!row.needsPlan && row.last_mode ? (
                      <div>
                        <p className="font-semibold text-slate-800">
                          {row.last_mode}
                          {row.email_delivery_status && (
                            <span className="ml-2">
                              <Status status={row.email_delivery_status} />
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.last_informed_by || "Admin"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.last_informed_at
                            ? formatRankHistoryDate(row.last_informed_at)
                            : row.last_date_of_informing || ""}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.communication_count || 0} contact record(s)
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">No contact yet</span>
                    )}
                  </Td>
                  <Td className="sticky right-0 bg-white group-hover:bg-[#f8fafc]">
                    {(row.needsPlan ? canEdit : canCommunicate) ? (
                      <Button
                        size="sm"
                        variant={rowConfirmed ? "outline" : "default"}
                        className={`w-full whitespace-nowrap px-2 text-xs ${
                          rowConfirmed
                            ? "border-[#3a5f9e]/30 text-[#3a5f9e]"
                            : ""
                        }`}
                        onClick={() =>
                          row.needsPlan
                            ? openJoiningPlan(row.sourceAllocation)
                            : openCommunication(row)
                        }
                      >
                        {row.needsPlan ? (
                          <ClipboardCheck size={15} className="mr-2" />
                        ) : (
                          <Mail size={15} className="mr-2" />
                        )}
                        {getNextActionLabel(row)}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500">View only</span>
                    )}
                  </Td>
                </tr>
              );
            })}
            {!queueRows.length && (
              <tr>
                <td colSpan="6" className="p-10 text-center text-slate-500">
                  No finalized vessel assignments are ready for Joining &
                  Intimation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JoiningPlans;
