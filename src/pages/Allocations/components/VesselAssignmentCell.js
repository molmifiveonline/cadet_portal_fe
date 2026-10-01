import { Status } from "./AllocationPrimitives";
import { Anchor } from "lucide-react";
import React from "react";
import { hasJoiningPlan } from "../allocationUtils";

const VesselAssignmentCell = ({ allocation, role, locked, openVessel }) => {
  const readOnly = locked || hasJoiningPlan(allocation, role);
  const secondary = role === "Secondary";
  const vesselName = secondary
    ? allocation.secondary_vessel_name
    : allocation.vessel_name;
  const status = secondary
    ? allocation.secondary_allocation_status
    : allocation.allocation_status;
  const colorClass = "border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10";

  return (
    <div className="min-w-48 space-y-2">
      <div>
        <p className="font-semibold text-slate-900">
          {vesselName || "No vessel selected"}
        </p>
        <Status status={status} />
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={() => openVessel({ allocation, role, readOnly })}
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${colorClass}`}
        >
          <Anchor size={14} />
          {vesselName ? `Change ${role}` : `Allocate ${role}`}
        </button>
      )}
    </div>
  );
};

export default VesselAssignmentCell;
