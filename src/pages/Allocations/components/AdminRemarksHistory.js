import { Lock, Unlock, RotateCcw, MessageCircle } from "lucide-react";
import { getRankHistoryAdmin, formatRankHistoryDate } from "../allocationUtils";
import React from "react";

const AdminRemarksHistory = ({ list }) => {
  const history = list.admin_remarks_history || [];
  const actions = {
    Finalize: {
      label: "Finalized",
      icon: Lock,
      color: "bg-emerald-100 text-emerald-700",
    },
    Unlock: {
      label: "Unlocked",
      icon: Unlock,
      color: "bg-amber-100 text-amber-700",
    },
    Reset: {
      label: "Ranks reset",
      icon: RotateCcw,
      color: "bg-slate-100 text-slate-700",
    },
  };

  return (
    <section
      aria-label={`${list.department} admin remarks`}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="font-semibold text-slate-900">Admin Remarks</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {list.department} rank list finalize, unlock and reset history. Latest
          first.
        </p>
      </div>
      {history.length ? (
        <ol className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
          {history.map((event) => {
            const action = actions[event.action];
            const Icon = action?.icon || MessageCircle;
            return (
              <li key={event.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${action?.color || "bg-slate-100 text-slate-700"}`}
                  >
                    <Icon size={12} aria-hidden="true" />
                    {action?.label || event.action}
                  </span>
                  <span className="break-words text-xs font-medium text-slate-700">
                    {getRankHistoryAdmin(event)}
                  </span>
                  <time
                    className="text-xs text-slate-500"
                    dateTime={event.created_at || undefined}
                  >
                    {formatRankHistoryDate(event.created_at)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {event.remarks || "No remarks added."}
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="px-4 py-3 text-sm text-slate-500">
          Remarks will appear here when this rank list is finalized, unlocked or
          reset.
        </p>
      )}
    </section>
  );
};

export default AdminRemarksHistory;
