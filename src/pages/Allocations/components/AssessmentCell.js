import { Button } from "../../../components/ui/button";
import { Pencil, Plus, Lock } from "lucide-react";
import React from "react";

const AssessmentCell = ({ allocation, locked, lockReason, onEdit }) => {
  const scores = (allocation.scores || []).filter(
    (item) => item.score !== null && item.score !== "",
  );

  return (
    <div className="min-w-56 space-y-2">
      {scores.length ? (
        <div className="space-y-1.5">
          {scores.map((item) => (
            <div
              key={item.id || item.course_id}
              className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-2.5 py-1.5"
            >
              <span className="text-xs font-medium text-slate-700">
                {item.course_name_snapshot}
              </span>
              <span className="whitespace-nowrap text-xs font-bold text-[#3a5f9e]">
                {Number(item.score).toFixed(2)} / 100
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">No assessment selected</p>
      )}
      {!locked && (
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          {scores.length ? (
            <Pencil size={14} className="mr-1.5" />
          ) : (
            <Plus size={14} className="mr-1.5" />
          )}
          {scores.length ? "Edit Assessment" : "Add Assessment"}
        </Button>
      )}
      {locked && (
        <p className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
          <Lock size={11} />
          Read-only · {lockReason || "Locked"}
        </p>
      )}
    </div>
  );
};

export default AssessmentCell;
