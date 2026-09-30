import React, { useEffect, useId, useState } from "react";
import { ArrowRight, Check, ChevronRight, Eye, Lock } from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";

const formatDate = (value, includeTime = false) => {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return includeTime
    ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const SavedField = ({ label, value, wide = false, children }) => (
  <div
    className={`min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 ${wide ? "sm:col-span-2" : ""}`}
  >
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
      {children ||
        (value === null || value === undefined || value === "" ? "—" : value)}
    </dd>
  </div>
);

const ReadOnlyHeading = ({ title, description }) => (
  <div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        <Lock size={12} aria-hidden="true" /> Read-only
      </span>
    </div>
    <p className="mt-1 text-xs text-slate-500">{description}</p>
  </div>
);

const SavedPlan = ({ plan }) => {
  let documents = plan.required_documents || [];
  if (typeof documents === "string") {
    try {
      documents = JSON.parse(documents);
    } catch {
      documents = [];
    }
  }
  if (!Array.isArray(documents)) documents = [];
  return (
    <section aria-label="Saved joining plan" className="space-y-4">
      <ReadOnlyHeading
        title="Saved joining plan"
        description="Details saved when this joining plan was created or last updated."
      />
      <dl className="grid gap-3 sm:grid-cols-2">
        <SavedField label="Vessel Name" value={plan.vessel_name} />
        <SavedField label="Vessel Assignment" value={plan.vessel_role} />
        <SavedField label="Vessel Type" value={plan.vessel_type} />
        <SavedField label="Department" value={plan.department} />
        <SavedField
          label="Joining Date"
          value={formatDate(plan.joining_date)}
        />
        <SavedField label="Reporting Port" value={plan.reporting_port} />
        <SavedField label="Location" value={plan.location} />
        <SavedField label="Voyage Reference" value={plan.voyage_ref} />
        <SavedField label="Total Seats" value={plan.total_seats} />
        <SavedField label="Contact Person" value={plan.contact_person_name} />
        <SavedField label="Contact Phone" value={plan.contact_person_phone} />
        <SavedField label="Contact Email" value={plan.contact_person_email} />
        <SavedField label="Required Documents" wide>
          {documents.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {documents.map((document, index) => (
                <li key={index}>{document}</li>
              ))}
            </ul>
          ) : (
            "No specific documents saved."
          )}
        </SavedField>
        <SavedField
          label="Communication Details"
          value={plan.communication_details}
          wide
        />
      </dl>
    </section>
  );
};

const CommunicationHistory = ({ plan }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .get(`/allocations/joining-plans/${plan.id}/communications`, {
        signal: controller.signal,
      })
      .then((response) => {
        if (!controller.signal.aborted) setRecords(response.data.data || []);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted)
          setError(
            requestError.response?.data?.message ||
              "Unable to load previous communications.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [plan.id, retry]);

  return (
    <section aria-label="Previous communications" className="space-y-4">
      <ReadOnlyHeading
        title="Previous communications"
        description="Saved contact records, newest first. Select Record Communication below to add a new entry."
      />
      {loading ? (
        <p
          role="status"
          className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500"
        >
          Loading previous communications…
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry loading history
          </Button>
        </div>
      ) : !records.length ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          No previous communications have been recorded for this joining plan.
        </p>
      ) : (
        <ol className="space-y-4">
          {records.map((record, index) => {
            const previousVersion =
              Number(record.plan_revision) !== Number(plan.revision || 1);
            const failed =
              record.mode === "Email" && record.delivery_status === "Failed";
            return (
              <li
                key={record.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    {record.mode} contact{index === 0 ? " · Latest" : ""}
                  </h4>
                  {previousVersion && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                      Previous plan version
                    </span>
                  )}
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <SavedField label="Communication Mode" value={record.mode} />
                  <SavedField
                    label="Informed By"
                    value={
                      record.informed_by_name || "Administrator unavailable"
                    }
                  />
                  <SavedField
                    label="Date of Informing"
                    value={formatDate(record.date_of_informing)}
                  />
                  <SavedField
                    label="Recorded At"
                    value={formatDate(record.informed_at, true)}
                  />
                  <SavedField
                    label="Confirmation Received"
                    value={Number(record.confirmation_received) ? "Yes" : "No"}
                  />
                  {record.mode === "Email" && (
                    <SavedField
                      label="Email Delivery Status"
                      value={record.delivery_status || "Not recorded"}
                    />
                  )}
                  <SavedField
                    label="Candidate Remarks"
                    value={record.candidate_remarks}
                    wide
                  />
                  <SavedField
                    label="Admin Remarks"
                    value={record.admin_remarks}
                    wide
                  />
                  {failed && (
                    <SavedField
                      label="Failure Reason"
                      value={record.failure_reason}
                      wide
                    />
                  )}
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

const CommunicationReview = ({
  plan,
  previouslyInformed,
  onClose,
  children,
}) => {
  const [view, setView] = useState("record");
  const panelId = useId();
  const stepClass = (complete) =>
    `inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`;
  return (
    <div className="space-y-5">
      <nav
        aria-label="Joining plan and communication details"
        className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        {[
          {
            key: "plan",
            label: "Plan Ready",
            complete: !Number(plan.requires_refresh),
          },
          {
            key: "history",
            label: "Candidate Informed",
            complete: previouslyInformed,
          },
        ].map((step, index) => (
          <React.Fragment key={step.key}>
            {index > 0 && (
              <ChevronRight
                size={14}
                className="text-slate-300"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              aria-pressed={view === step.key}
              aria-controls={panelId}
              title={`View ${step.key === "plan" ? "saved plan" : "previous communication"} details (read-only)`}
              onClick={() => setView(step.key)}
              className={`${stepClass(step.complete)} transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a5f9e] focus-visible:ring-offset-2 ${view === step.key ? "ring-2 ring-[#3a5f9e] ring-offset-2" : ""}`}
            >
              {step.complete && (
                <Check size={12} strokeWidth={3} aria-hidden="true" />
              )}
              {step.label}
              <Eye size={12} aria-hidden="true" />
            </button>
          </React.Fragment>
        ))}
        <ChevronRight size={14} className="text-slate-300" aria-hidden="true" />
        <span
          className={stepClass(Boolean(Number(plan.confirmation_received)))}
        >
          {Boolean(Number(plan.confirmation_received)) && (
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          )}
          Confirmation Received
        </span>
      </nav>
      <div id={panelId}>
        {view === "plan" && <SavedPlan plan={plan} />}
        {view === "history" && <CommunicationHistory plan={plan} />}
        <div hidden={view !== "record"}>{children}</div>
      </div>
      {view !== "record" && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => setView("record")}>
            Record Communication
            <ArrowRight size={16} className="ml-2" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunicationReview;
