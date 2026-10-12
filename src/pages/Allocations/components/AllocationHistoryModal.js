import React, { useEffect, useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { Modal } from "./AllocationPrimitives";
import { formatTimestampInIndia } from "../../../lib/utils/timestampUtils";
import { Button } from "../../../components/ui/button";

const labels = {
  vessel_name: "Vessel",
  joining_date: "Joining Date",
  reporting_port: "Reporting Port",
  location: "Location",
  vessel_type: "Vessel Type",
  allocation_status: "Allocation Status",
  voyage_ref: "Voyage Ref",
  contact_person_name: "Contact Person",
  contact_person_email: "Contact Email",
  contact_person_phone: "Contact Phone",
  required_documents: "Required Documents",
  communication_details: "Reporting Instructions",
  name: "Follow-up Person",
};
const display = (v) => (Array.isArray(v) ? v.join(", ") : v || "—");
export default function AllocationHistoryModal({ allocationId, onClose }) {
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(`/allocations/candidate-allocations/${allocationId}/history`)
      .then((r) => active && setRows(r.data.data))
      .catch((e) => active && setError(e.response?.data?.message || "History could not be loaded"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [allocationId, retry]);
  return (
    <Modal title="Allocation & Follow-up History" width="max-w-4xl" onClose={onClose}>
      {loading ? (
        <p>Loading history…</p>
      ) : error ? (
        <div role="alert">
          {error}
          <Button onClick={() => setRetry(retry + 1)}>Retry</Button>
        </div>
      ) : !rows.length ? (
        <p>No history recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const time = formatTimestampInIndia(row.timestamp),
              before = row.before_snapshot || {},
              after = row.after_snapshot || {};
            return (
              <article key={`${row.kind}-${row.id}`} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>
                    {row.kind === "change"
                      ? ["Assigned", "Reassigned", "Unassigned"].includes(row.event_type)
                        ? {
                            Assigned: "Follow-up assignment",
                            Reassigned: "Follow-up reassigned",
                            Unassigned: "Follow-up assignment removed",
                          }[row.event_type]
                        : row.event_type === "Imported"
                          ? "Existing saved allocation"
                          : `${row.vessel_role} allocation changed`
                      : row.kind === "email"
                        ? `${row.subject} · ${row.status}`
                        : `${row.mode} contact · ${row.delivery_status || "Recorded externally"}`}
                  </strong>
                  <span className="text-xs text-slate-500">
                    {time.date} {time.time} IST
                  </span>
                </div>
                {row.kind === "change" ? (
                  <>
                    <p className="my-2 text-slate-600">
                      {row.actor_name || "Existing record"}
                      {row.reason ? ` — ${row.reason}` : ""}
                    </p>
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th>Detail</th>
                          <th>Before</th>
                          <th>After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(labels)
                          .filter(([k]) => Object.hasOwn(before, k) || Object.hasOwn(after, k))
                          .filter(
                            ([k]) =>
                              row.event_type === "Imported" ||
                              JSON.stringify(before[k]) !== JSON.stringify(after[k]),
                          )
                          .map(([k, label]) => (
                            <tr key={k} className="border-t">
                              <td className="py-2 pr-3">{label}</td>
                              <td className="pr-3 whitespace-pre-wrap">{display(before[k])}</td>
                              <td className="whitespace-pre-wrap">{display(after[k])}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </>
                ) : row.kind === "email" ? (
                  <>
                    <p className="mt-2">To: {row.recipient_email}</p>
                    {row.cc?.length > 0 && (
                      <p>
                        CC:{" "}
                        {row.cc
                          .map((c) => (typeof c === "string" ? c : c.address || c.email))
                          .join(", ")}
                      </p>
                    )}
                    <p>Plan revision: {row.plan_revision}</p>
                    {row.failure_reason && <p className="text-red-700">{row.failure_reason}</p>}
                    {["Sending", "Unknown"].includes(row.status) && (
                      <p className="text-amber-700">
                        Delivery needs review. This attempt will not be automatically resent.
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[#3a5f9e]">
                        Details included in this email
                      </summary>
                      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                        {Object.entries(labels)
                          .filter(([k]) => row.snapshot?.[k] != null)
                          .map(([k, label]) => (
                            <div key={k}>
                              <dt className="text-slate-500">{label}</dt>
                              <dd className="whitespace-pre-wrap">{display(row.snapshot[k])}</dd>
                            </div>
                          ))}
                      </dl>
                    </details>
                  </>
                ) : (
                  <div className="mt-2 space-y-1">
                    <p>
                      {row.vessel_role} · Revision {row.plan_revision} · Confirmation:{" "}
                      {Number(row.confirmation_received) ? "Yes" : "No"}
                    </p>
                    <p>
                      Informed by: {row.informed_by_name || "Unknown"} · Date:{" "}
                      {row.date_of_informing}
                    </p>
                    {row.recorded_by_name && <p>Recorded by: {row.recorded_by_name}</p>}
                    {row.candidate_remarks && (
                      <p className="whitespace-pre-wrap">Candidate: {row.candidate_remarks}</p>
                    )}
                    {row.admin_remarks && (
                      <p className="whitespace-pre-wrap">Admin: {row.admin_remarks}</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
