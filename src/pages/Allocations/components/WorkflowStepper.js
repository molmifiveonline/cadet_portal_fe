import React from "react";
import { Check } from "lucide-react";

const WorkflowStepper = ({ steps }) => {
  const currentIndex = steps.findIndex((step) => !step.complete);
  return (
    <section
      aria-label="CTV allocation workflow"
      className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex min-w-[680px] items-start">
        {steps.map((step, index) => {
          const complete = step.complete;
          const current = index === currentIndex;
          return (
            <React.Fragment key={step.key}>
              <div className="w-24 shrink-0 text-center">
                <div
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 ${complete ? "border-emerald-500 bg-emerald-500 text-white" : current ? "border-[#3a5f9e] bg-[#3a5f9e]/10 text-[#3a5f9e]" : "border-slate-200 bg-white text-slate-400"}`}
                >
                  {complete ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <p
                  className={`mt-2 text-xs font-bold ${current ? "text-[#3a5f9e]" : complete ? "text-slate-800" : "text-slate-400"}`}
                >
                  {step.label}
                </p>
                <p
                  className="mt-0.5 truncate text-[10px] text-slate-500"
                  title={step.detail}
                >
                  {step.detail}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mt-4 h-0.5 min-w-4 flex-1 ${complete ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};

export default WorkflowStepper;
