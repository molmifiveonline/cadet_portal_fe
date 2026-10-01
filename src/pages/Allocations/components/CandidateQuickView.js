import { X, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { formatAcademicScore } from "../allocationUtils";
import { Button } from "../../../components/ui/button";
import React from "react";

const CandidateQuickView = ({ candidate, department, onClose }) => (
  <div
    className="fixed inset-0 z-[60] flex justify-end bg-black/40"
    onMouseDown={onClose}
  >
    <aside
      role="dialog"
      aria-modal="true"
      aria-label={`Candidate details for ${candidate.name_as_in_indos_cert}`}
      className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#3a5f9e]">
            Candidate quick view
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {candidate.name_as_in_indos_cert}
          </h2>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {candidate.cadet_unique_id}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close candidate quick view"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#3a5f9e]/20 bg-[#3a5f9e]/10 text-[#3a5f9e] shadow-sm transition hover:border-[#3a5f9e] hover:bg-[#3a5f9e] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3a5f9e]/30 focus:ring-offset-2"
          onClick={onClose}
        >
          <X size={25} strokeWidth={2.5} />
        </button>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <QuickViewValue label="Department" value={department} />
          <QuickViewValue
            label="Batch / Year"
            value={candidate.batch_year || "—"}
          />
          <QuickViewValue
            label="IMU Academic Score"
            value={formatAcademicScore(candidate.academic_score)}
          />
          <QuickViewValue
            label="Documents"
            value={candidate.document_verification_status || "—"}
          />
        </div>
        <QuickViewValue
          label="Institute"
          value={candidate.institute_name || "—"}
        />
        <div
          className={`rounded-xl border p-4 ${candidate.eligible ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
        >
          <p
            className={`flex items-center gap-2 font-bold ${candidate.eligible ? "text-emerald-800" : "text-amber-900"}`}
          >
            {candidate.eligible ? (
              <CheckCircle2 size={17} />
            ) : (
              <AlertTriangle size={17} />
            )}
            {candidate.eligible ? "Eligible for allocation" : "Needs attention"}
          </p>
          {!candidate.eligible && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {candidate.ineligible_reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() =>
              window.open(`/cadets/view/${candidate.id}`, "_blank")
            }
          >
            Open Full Profile <ArrowRight size={15} className="ml-2" />
          </Button>
        </div>
      </div>
    </aside>
  </div>
);

const QuickViewValue = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 font-semibold text-slate-900">{value}</p>
  </div>
);

export { QuickViewValue };
export default CandidateQuickView;
