import { getRankHistoryAdmin, formatRankHistoryDate } from "../allocationUtils";
import React from "react";
import { Modal } from "./AllocationPrimitives";

const RankHistorySummary = ({ allocation, onView }) => {
  const history = allocation.rank_history || [];
  const latest = history[0];
  if (!latest) return <span className="text-slate-400">—</span>;

  return (
    <div className="w-64 space-y-1.5">
      <p className="truncate font-medium text-slate-800" title={latest.remarks}>
        {latest.remarks}
      </p>
      <p
        className="truncate text-xs text-slate-500"
        title={getRankHistoryAdmin(latest)}
      >
        {getRankHistoryAdmin(latest)} ·{" "}
        {formatRankHistoryDate(latest.created_at)}
      </p>
      <button
        type="button"
        onClick={onView}
        className="text-xs font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
      >
        View all ({history.length})
      </button>
    </div>
  );
};

const RankHistoryModal = ({ allocation, onClose }) => {
  const history = allocation.rank_history || [];
  return (
    <Modal
      title={`Rank Change History — ${allocation.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">
          {allocation.cadet_unique_id}
        </span>{" "}
        · {history.length} rank change{history.length === 1 ? "" : "s"}
      </div>
      <ol className="space-y-3">
        {history.map((event) => {
          const movedUp = event.action === "MoveUp";
          return (
            <li
              key={event.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${movedUp ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {movedUp ? "Move Up" : "Move Down"}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Rank {event.from_rank} → Rank {event.to_rank}
                  </span>
                </div>
                <time
                  className="text-xs text-slate-500"
                  dateTime={event.created_at || undefined}
                >
                  {formatRankHistoryDate(event.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">
                {event.remarks}
              </p>
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Changed by:
                </span>{" "}
                {getRankHistoryAdmin(event)}
                {event.changed_by_name && event.changed_by_email ? (
                  <span> · {event.changed_by_email}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
};

export { RankHistorySummary, RankHistoryModal };
