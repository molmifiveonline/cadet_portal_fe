import React from "react";
import { Ban } from "lucide-react";
import { formatTimestampInIndia } from "../../../lib/utils/timestampUtils";

const DisabledAllocationNotice = ({ cycle, compact = false }) => {
  if (!cycle?.deleted_at) return null;
  const { date, time } = formatTimestampInIndia(cycle.deleted_at);
  return (
    <div
      className={`rounded-xl border border-slate-300 bg-slate-100 p-3 text-slate-700 ${compact ? "mt-4 text-xs" : "mb-5 text-sm"}`}
    >
      <p className="flex items-center gap-2 font-semibold">
        <Ban size={16} />
        Disabled allocation — view only
      </p>
      <p className="mt-1">
        Disabled by {cycle.deleted_by_name || "Admin"} on{" "}
        <time dateTime={cycle.deleted_at}>
          {date}, {time} IST
        </time>
        .
      </p>
      {cycle.delete_reason && (
        <p
          className={`mt-1 whitespace-pre-wrap break-words ${compact ? "line-clamp-2" : ""}`}
        >
          Reason: {cycle.delete_reason}
        </p>
      )}
      {!compact && (
        <p className="mt-2">
          History is retained. Eligible cadets can be selected in another
          allocation. This allocation cannot be restored.
        </p>
      )}
    </div>
  );
};
export default DisabledAllocationNotice;
