import React from "react";
import { CheckCircle2, Check, X } from "lucide-react";
import { SelectContent, SelectItem } from "../../../components/ui/select";

const Metric = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-slate-500">{label}</p>
    <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
  </div>
);

const ReadinessItem = ({ label, complete, value }) => (
  <div
    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}
  >
    <span className="flex items-center gap-2">
      {complete ? (
        <CheckCircle2 size={15} />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
      )}
      {label}
    </span>
    <strong>{value}</strong>
  </div>
);

const brandedSelectTriggerClass =
  "h-9 border-slate-300 bg-white text-slate-700 focus:border-[#3a5f9e] focus:ring-[#3a5f9e]/20";

const BrandedSelectContent = ({ children }) => (
  <SelectContent className="z-[100] border-[#3a5f9e]/20 bg-white shadow-xl">
    {children}
  </SelectContent>
);

const BrandedSelectItem = ({ value, children }) => (
  <SelectItem
    value={value}
    className="focus:bg-[#3a5f9e]/10 focus:text-[#3a5f9e] data-[state=checked]:font-semibold data-[state=checked]:text-[#3a5f9e]"
  >
    {children}
  </SelectItem>
);

const QueueStep = ({ label, complete }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[10px] font-bold leading-none ${
      complete
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-500"
    }`}
  >
    {complete && <Check size={10} strokeWidth={3} className="shrink-0" />}
    {label}
  </span>
);

const Modal = ({
  title,
  onClose,
  children,
  width = "max-w-2xl",
  bodyClassName = "",
}) => (
  <div
    role="presentation"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onMouseDown={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-2xl`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button
          type="button"
          aria-label={`Close ${title}`}
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#3a5f9e]/20 bg-[#3a5f9e]/10 text-[#3a5f9e] shadow-sm transition hover:border-[#3a5f9e] hover:bg-[#3a5f9e] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3a5f9e]/30 focus:ring-offset-2"
        >
          <X size={25} strokeWidth={2.5} />
        </button>
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName || "overflow-auto"}`}>
        {children}
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    <div className="mt-1">{children}</div>
  </label>
);

const FieldError = ({ children }) => (
  <p className="mt-1 text-xs font-normal text-red-600">{children}</p>
);

const Th = ({ children, className = "" }) => (
  <th
    className={`whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-3 text-slate-700 ${className}`}>{children}</td>
);

const Status = ({ status }) => {
  const good = [
    "Finalized",
    "Allocated",
    "Primary Allocated",
    "Secondary Allocated",
    "Both Allocated",
    "Verified",
    "Onboarded",
    "Sent",
    "Confirmed",
    "Informed",
    "Recorded",
  ].includes(status);
  const bad = ["Cancelled", "Failed", "Needs Review", "Not Allocated"].includes(
    status,
  );
  return (
    <span
      className={`inline-flex h-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${good ? "bg-emerald-100 text-emerald-700" : bad ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
    >
      {status || "Pending"}
    </span>
  );
};

export {
  Metric,
  ReadinessItem,
  brandedSelectTriggerClass,
  BrandedSelectContent,
  BrandedSelectItem,
  QueueStep,
  Modal,
  Field,
  FieldError,
  Th,
  Td,
  Status,
};
