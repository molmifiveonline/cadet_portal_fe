import React from "react";
import {
  Field,
  BrandedSelectContent,
  BrandedSelectItem,
  brandedSelectTriggerClass,
} from "./AllocationPrimitives";
import { Select, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { inputClass } from "../allocationUtils";

export const todayInIndia = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const StaffSelect = ({
  users,
  value,
  onChange,
  disabled = false,
  label = "Informed By",
  emptyLabel = "Select user",
}) => (
  <Field label={label}>
    <Select
      value={value || "unassigned"}
      onValueChange={(v) => onChange(v === "unassigned" ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger className={brandedSelectTriggerClass} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <BrandedSelectContent>
        <BrandedSelectItem value="unassigned">{emptyLabel}</BrandedSelectItem>
        {users.map((u) => (
          <BrandedSelectItem key={u.id} value={u.id} disabled={u.status === "inactive"}>
            {u.name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
            {u.role ? ` (${u.role})` : ""}
          </BrandedSelectItem>
        ))}
      </BrandedSelectContent>
    </Select>
  </Field>
);
export const AssignedFollowupPerson = ({ userId, owner, users = [], label = "Informed By" }) => {
  const person = owner || users.find((u) => u.id === userId);
  const name =
    person?.name ||
    [person?.first_name, person?.last_name].filter(Boolean).join(" ") ||
    person?.email;
  return (
    <div>
      <Field label={label}>
        <input
          className={`${inputClass} w-full bg-slate-50`}
          readOnly
          value={userId ? name || "Assigned person unavailable" : "Not assigned"}
        />
      </Field>
      <p className="mt-1 text-xs text-slate-500">
        {!userId
          ? "Assign a follow-up person before continuing."
          : person?.status === "inactive"
            ? "This person is inactive. Reassign to an active user."
            : "Assigned to this cadet. Use Reassign Follow-up Person to change responsibility."}
      </p>
    </div>
  );
};
export const getJoiningDetails = (source) => ({
  joining_date: String(source?.joining_date || "").slice(0, 10),
  location: source?.location || "",
  voyage_ref: source?.voyage_ref || "",
  reporting_port: source?.reporting_port || "",
  contact_person_name: source?.contact_person_name || "",
  contact_person_phone: source?.contact_person_phone || "",
  contact_person_email: source?.contact_person_email || "",
  communication_details: source?.communication_details || "",
  required_documents: Array.isArray(source?.required_documents)
    ? source.required_documents.join("\n")
    : (() => {
        try {
          return JSON.parse(source?.required_documents || "[]").join("\n");
        } catch {
          return "";
        }
      })(),
});
export const JoiningDetailsFields = ({ form, onChange, disabled }) => {
  const field = (key, label, type = "text") => (
    <Field key={key} label={label}>
      <input
        aria-label={label}
        type={type}
        className={`${inputClass} w-full`}
        disabled={disabled}
        value={form[key]}
        onChange={(e) => onChange({ ...form, [key]: e.target.value })}
      />
    </Field>
  );
  return (
    <section
      aria-label="Joining Details"
      className="space-y-4 rounded-xl border border-[#3a5f9e]/25 p-4"
    >
      <h3 className="font-bold text-slate-900">Joining Details</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {field("joining_date", "Joining Date", "date")}
        {field("location", "Location")}
        {field("voyage_ref", "Voyage Reference")}
        {field("reporting_port", "Reporting Port")}
      </div>
      <details className="rounded-lg border p-4" open={undefined}>
        <summary className="cursor-pointer font-semibold text-[#3a5f9e]">
          Communication Details
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {field("contact_person_name", "Contact Person")}
          {field("contact_person_phone", "Contact Phone")}
          {field("contact_person_email", "Contact Email", "email")}
          <Field label="Required Documents">
            <textarea
              className="min-h-24 w-full rounded border p-2"
              disabled={disabled}
              value={form.required_documents}
              onChange={(e) => onChange({ ...form, required_documents: e.target.value })}
              placeholder="One document per line"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Joining / Reporting Instructions">
              <textarea
                className="min-h-24 w-full rounded border p-2"
                disabled={disabled}
                value={form.communication_details}
                onChange={(e) => onChange({ ...form, communication_details: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </details>
    </section>
  );
};
