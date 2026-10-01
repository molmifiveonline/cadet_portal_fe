import {
  isPlanIntimated,
  today,
  formatJoiningDate,
  inputClass,
} from "../allocationUtils";
import React, { useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Mail, Phone, MessageCircle } from "lucide-react";
import {
  Modal,
  Status,
  Field,
  brandedSelectTriggerClass,
  BrandedSelectContent,
  BrandedSelectItem,
  FieldError,
} from "./AllocationPrimitives";
import CommunicationReview from "../CommunicationReview";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";

const CommunicationModal = ({
  plan,
  admins,
  currentUser,
  onClose,
  onSaved,
}) => {
  const previouslyInformed = isPlanIntimated(plan);
  const defaultMode = ["Email", "Phone", "WhatsApp"].includes(plan.last_mode)
    ? plan.last_mode
    : "Email";
  const [form, setForm] = useState({
    mode: defaultMode,
    informed_by: currentUser?.id || "",
    date_of_informing: today,
    confirmation_received: Boolean(Number(plan.confirmation_received)),
    candidate_remarks: "",
    admin_remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [attemptError, setAttemptError] = useState("");
  const requiredDocuments = Array.isArray(plan.required_documents)
    ? plan.required_documents
    : (() => {
        try {
          return JSON.parse(plan.required_documents || "[]");
        } catch (_) {
          return [];
        }
      })();
  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };
  const submit = async () => {
    const nextErrors = {};
    if (!form.informed_by)
      nextErrors.informed_by = "Select the Admin who informed the candidate.";
    if (!form.date_of_informing)
      nextErrors.date_of_informing = "Select the informing date.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      setSaving(true);
      setAttemptError("");
      await api.post(
        `/allocations/joining-plans/${plan.id}/communications`,
        form,
      );
      toast.success(
        form.confirmation_received
          ? "Confirmation recorded"
          : "Communication recorded",
      );
      onSaved();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to record communication";
      setAttemptError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  const ModeIcon =
    form.mode === "Email"
      ? Mail
      : form.mode === "Phone"
        ? Phone
        : MessageCircle;
  return (
    <Modal
      title={`Record Communication — ${plan.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-4xl"
    >
      <CommunicationReview
        plan={plan}
        previouslyInformed={previouslyInformed}
        onClose={onClose}
      >
        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Vessel Name</p>
              <p className="font-semibold">{plan.vessel_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vessel Type</p>
              <p className="font-semibold">
                {plan.vessel_type || "—"} · {plan.vessel_role}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Joining Date</p>
              <p className="font-semibold">
                {formatJoiningDate(plan.joining_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Reporting Port</p>
              <p className="font-semibold">
                {plan.reporting_port || plan.location || "—"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="text-sm font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
          >
            {showDetails ? "Hide" : "View"} vessel and communication details
          </button>
          {showDetails && (
            <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm md:grid-cols-2">
              <p>
                Location: <strong>{plan.location || "—"}</strong>
              </p>
              <p>
                Voyage Ref: <strong>{plan.voyage_ref || "—"}</strong>
              </p>
              <p>
                Total Seats: <strong>{plan.total_seats ?? "—"}</strong>
              </p>
              <p>
                Contact:{" "}
                <strong>
                  {plan.contact_person_name || "—"}{" "}
                  {plan.contact_person_phone || ""}
                </strong>
              </p>
              <p className="md:col-span-2">
                Contact Email:{" "}
                <strong>{plan.contact_person_email || "—"}</strong>
              </p>
              <p className="md:col-span-2 whitespace-pre-wrap">
                Communication Details:{" "}
                <strong>{plan.communication_details || "—"}</strong>
              </p>
              <div className="md:col-span-2">
                <p className="font-medium">Required Documents</p>
                {requiredDocuments.length ? (
                  <ul className="mt-1 list-disc pl-5">
                    {requiredDocuments.map((document) => (
                      <li key={document}>{document}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No specific documents added.</p>
                )}
              </div>
            </div>
          )}
          {plan.email_delivery_status && (
            <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
              <span>Previous Email Status:</span>
              <Status status={plan.email_delivery_status} />
              {plan.last_failure_reason && (
                <span className="text-red-600">{plan.last_failure_reason}</span>
              )}
            </div>
          )}
          {attemptError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {attemptError}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Communication Mode">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Email", Mail],
                  ["Phone", Phone],
                  ["WhatsApp", MessageCircle],
                ].map(([value, Icon]) => {
                  const active = form.mode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField("mode", value)}
                      aria-label={value}
                      aria-pressed={active}
                      className={`flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition ${
                        active
                          ? "border-[#3a5f9e] bg-[#3a5f9e] text-white"
                          : "border-[#3a5f9e]/20 bg-white text-slate-600 hover:bg-[#3a5f9e]/10 hover:text-[#3a5f9e]"
                      }`}
                    >
                      <Icon size={14} /> {value}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Informed By *">
              <Select
                value={form.informed_by || "no-admin"}
                onValueChange={(value) =>
                  setField("informed_by", value === "no-admin" ? "" : value)
                }
              >
                <SelectTrigger
                  className={brandedSelectTriggerClass}
                  aria-label="Informed by administrator"
                  invalid={Boolean(errors.informed_by)}
                >
                  <SelectValue />
                </SelectTrigger>
                <BrandedSelectContent>
                  <BrandedSelectItem value="no-admin">
                    Select Admin
                  </BrandedSelectItem>
                  {admins.map((item) => (
                    <BrandedSelectItem key={item.id} value={String(item.id)}>
                      {[item.first_name, item.last_name]
                        .filter(Boolean)
                        .join(" ") || item.email}{" "}
                      ({item.role})
                    </BrandedSelectItem>
                  ))}
                </BrandedSelectContent>
              </Select>
              {errors.informed_by && (
                <FieldError>{errors.informed_by}</FieldError>
              )}
            </Field>
            <Field label="Date of Informing *">
              <input
                className={`${inputClass} w-full`}
                type="date"
                max={today}
                value={form.date_of_informing}
                onChange={(event) =>
                  setField("date_of_informing", event.target.value)
                }
              />
              {errors.date_of_informing && (
                <FieldError>{errors.date_of_informing}</FieldError>
              )}
            </Field>
            <Field label="Confirmation Received">
              <div className="grid grid-cols-2 gap-2">
                {[false, true].map((value) => {
                  const active = form.confirmation_received === value;
                  return (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setField("confirmation_received", value)}
                      aria-label={value ? "Yes" : "No"}
                      aria-pressed={active}
                      className={`h-9 rounded-md border text-sm font-semibold transition ${
                        active
                          ? "border-[#3a5f9e] bg-[#3a5f9e] text-white"
                          : "border-[#3a5f9e]/20 bg-white text-slate-600 hover:bg-[#3a5f9e]/10 hover:text-[#3a5f9e]"
                      }`}
                    >
                      {value ? "Yes" : "No"}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <button
              type="button"
              onClick={() => setShowRemarks((value) => !value)}
              className="text-sm font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
            >
              {showRemarks ? "Hide optional remarks" : "Add optional remarks"}
            </button>
            {showRemarks && (
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <Field label="Candidate Remarks">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-[#3a5f9e] focus:ring-2 focus:ring-[#3a5f9e]/20"
                    value={form.candidate_remarks}
                    onChange={(event) =>
                      setField("candidate_remarks", event.target.value)
                    }
                  />
                </Field>
                <Field label="Admin Remarks">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-[#3a5f9e] focus:ring-2 focus:ring-[#3a5f9e]/20"
                    value={form.admin_remarks}
                    onChange={(event) =>
                      setField("admin_remarks", event.target.value)
                    }
                  />
                </Field>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Record communication handled outside the portal. No email or message
            will be sent. The recorded timestamp is saved automatically.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={submit}>
              <ModeIcon size={16} className="mr-2" />
              {saving
                ? "Saving…"
                : form.confirmation_received
                  ? "Record Confirmation"
                  : "Record Communication"}
            </Button>
          </div>
        </div>
      </CommunicationReview>
    </Modal>
  );
};

export default CommunicationModal;
