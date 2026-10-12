import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { Button } from "../../../components/ui/button";
import VesselModal from "./VesselModal";
import CommunicationModal from "./CommunicationModal";
import AllocationHistoryModal from "./AllocationHistoryModal";
import FollowupOwnerModal from "./FollowupOwnerModal";
import FollowupConfirmation, { FollowupConfirmationSummary } from "./FollowupConfirmation";
import { formatTimestampInIndia } from "../../../lib/utils/timestampUtils";
import { getAllocatedVesselRoles } from "../allocationUtils";

export default function FollowupWorkspace({ cycleId, mine = false, onChanged }) {
  const [rows, setRows] = useState([]),
    [users, setUsers] = useState([]),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [search, setSearch] = useState(""),
    [confirmation, setConfirmation] = useState("all");
  const [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [dialog, setDialog] = useState(null);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setBusy(true);
    setError("");
    try {
      const [r, u] = await Promise.all([
        api.get("/allocations/follow-ups", {
          params: {
            cycle_id: cycleId,
            mine: mine ? "true" : undefined,
            page,
            search,
            confirmation,
          },
        }),
        api.get("/allocations/follow-up-users"),
      ]);
      if (version !== requestVersion.current) return;
      setRows(r.data.data.data.filter((a) => getAllocatedVesselRoles(a).length));
      setPages(r.data.data.pagination.totalPages);
      setPage(r.data.data.pagination.page || page);
      setUsers(u.data.data);
    } catch (e) {
      if (version === requestVersion.current)
        setError(e.response?.data?.message || "Could not load follow-ups");
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }, [cycleId, mine, page, search, confirmation]);
  useEffect(() => {
    load();
    return () => {
      requestVersion.current += 1;
    };
  }, [load]);
  const saved = () => {
    setDialog(null);
    load();
    onChanged?.();
  };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-xl font-bold">
          {mine ? "My Follow-ups" : "Joining & Intimation Queue"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Assign responsibility, record contact, and keep joining details up to date.
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <input
            aria-label="Search follow-up cadets"
            placeholder="Search cadet name or ID"
            className="h-10 w-full max-w-md rounded border px-3"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Confirmation status</legend>
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["confirmed", "Confirmed"],
                ["pending", "Pending"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={confirmation === value ? "default" : "outline"}
                  aria-pressed={confirmation === value}
                  onClick={() => {
                    setConfirmation(value);
                    setPage(1);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Pending includes cadets with an allocated vessel still awaiting confirmation.
        </p>
      </div>
      {error && (
        <div role="alert" className="rounded border bg-white p-4 text-red-700">
          {error}
          <Button variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}
      {busy && <p role="status">Loading follow-ups…</p>}
      {!busy && !error && !rows.length && (
        <p className="rounded border bg-white p-6">
          {confirmation !== "all" || search.trim()
            ? "No cadets match these filters."
            : mine
              ? "No allocated cadets are currently assigned to you."
              : "No Allocated vessels to follow up."}
        </p>
      )}
      {(!busy && !error ? rows : []).map((a) => (
        <article key={a.id} className="overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-wrap justify-between gap-4 bg-slate-50 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-bold">{a.name_as_in_indos_cert}</h3>
                <FollowupConfirmationSummary
                  plans={getAllocatedVesselRoles(a).map((role) =>
                    a.plans.find((plan) => plan.vessel_role === role),
                  )}
                />
              </div>
              <p className="text-sm text-slate-500">
                {a.cadet_unique_id} · {a.department} · {a.allocation_number}
              </p>
              <p className="mt-2 text-sm">
                Follow-up user: <strong>{a.owner?.name || "Unassigned"}</strong>
                {a.owner?.status === "inactive" && " (Inactive — reassign)"}
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              {a.abilities.can_assign && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialog({ kind: "owner", allocation: a })}
                >
                  {a.follow_up_user_id ? "Reassign Follow-up Person" : "Assign Follow-up Person"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog({ kind: "history", allocation: a })}
              >
                View History
              </Button>
            </div>
          </div>
          {getAllocatedVesselRoles(a).map((role) => {
            const p = a.plans.find((p) => p.vessel_role === role),
              secondary = role === "Secondary",
              status = a[secondary ? "secondary_allocation_status" : "allocation_status"];
            const vessel = a.vessels?.find(
              (v) => v.id === a[secondary ? "secondary_vessel_id" : "vessel_id"],
            );
            const time = p?.last_contact?.informed_at
              ? formatTimestampInIndia(p.last_contact.informed_at)
              : null;
            const confirmed = Boolean(Number(p?.confirmation_received));
            return (
              <section
                key={role}
                aria-label={`${role} vessel follow-up`}
                className={`grid gap-4 border-t border-t-slate-200 border-l-4 p-4 lg:grid-cols-[1fr_1fr_1.3fr_auto] ${
                  confirmed ? "border-l-emerald-500" : "border-l-amber-400"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">{role} Vessel</p>
                  <p className="mt-1 font-semibold">
                    {p?.vessel_name || vessel?.name || "No vessel selected"}
                  </p>
                  <p className="text-sm text-slate-500">{status}</p>
                  <FollowupConfirmation confirmed={confirmed} />
                </div>
                <div className="text-sm">
                  <p>Joining: {p?.joining_date || "Not set"}</p>
                  <p>Reporting port: {p?.reporting_port || "Not set"}</p>
                  <p>
                    Email: <strong>{p?.email_status || "Not sent"}</strong>
                  </p>
                  {p?.updated_email_pending && (
                    <p className="text-amber-700">Updated email pending</p>
                  )}
                </div>
                <div className="text-sm">
                  {p?.last_contact ? (
                    <>
                      <p>{p.last_contact.mode} · Recorded externally</p>
                      <p className="text-slate-500">
                        {p.last_contact.informed_by_name} · {time?.date} {time?.time} IST
                      </p>
                      {p.last_contact.candidate_remarks && (
                        <p className="whitespace-pre-wrap">
                          Candidate: {p.last_contact.candidate_remarks}
                        </p>
                      )}
                      {p.last_contact.admin_remarks && (
                        <p className="whitespace-pre-wrap">Admin: {p.last_contact.admin_remarks}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400">No manual follow-up yet</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {(a.abilities.can_edit || a.abilities.can_send) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDialog({ kind: "vessel", allocation: a, role })}
                    >
                      {a.abilities.can_edit ? "Change Vessel / Joining Details" : "Joining Email"}
                    </Button>
                  )}
                  {a.abilities.can_follow && (
                    <Button
                      size="sm"
                      disabled={
                        !p ||
                        Boolean(Number(p.requires_refresh)) ||
                        p.vessel_id !== a[secondary ? "secondary_vessel_id" : "vessel_id"]
                      }
                      title={
                        !p || Number(p.requires_refresh)
                          ? "Save the current joining details before adding a follow-up"
                          : `Add a follow-up for the ${role.toLowerCase()} vessel`
                      }
                      onClick={() => setDialog({ kind: "contact", allocation: a, plan: p })}
                    >
                      Add Follow-up
                    </Button>
                  )}
                </div>
              </section>
            );
          })}
        </article>
      ))}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>
            {page} / {pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= pages || busy}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
      {dialog?.kind === "vessel" && (
        <VesselModal
          allocation={dialog.allocation}
          role={dialog.role}
          onClose={() => {
            setDialog(null);
            load();
          }}
          onSaved={() => {
            load();
            onChanged?.();
          }}
        />
      )}
      {dialog?.kind === "owner" && (
        <FollowupOwnerModal
          allocation={dialog.allocation}
          onClose={() => {
            setDialog(null);
            load();
          }}
          onSaved={saved}
        />
      )}
      {dialog?.kind === "history" && (
        <AllocationHistoryModal
          allocationId={dialog.allocation.id}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "contact" && (
        <CommunicationModal
          plan={dialog.plan}
          admins={users}
          followupUserId={dialog.allocation.follow_up_user_id}
          followupOwner={dialog.allocation.owner}
          onClose={() => {
            setDialog(null);
            load();
          }}
          onSaved={saved}
        />
      )}
    </div>
  );
}
