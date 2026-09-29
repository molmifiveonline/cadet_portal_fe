import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileSignature,
  IdCard,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Ship,
  Stethoscope,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/utils/apiConfig";
import PageHeader from "../../components/common/PageHeader";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { usePermission } from "../../hooks/usePermission";

const checklistItems = [
  {
    key: "passport_verified",
    label: "Passport Verified",
    shortLabel: "Passport",
    icon: IdCard,
  },
  {
    key: "medical_cert_verified",
    label: "Medical Certificate Verified",
    shortLabel: "Medical",
    icon: Stethoscope,
  },
  {
    key: "bank_details_verified",
    label: "Bank Details Verified",
    shortLabel: "Bank Details",
    icon: CircleDollarSign,
  },
  {
    key: "agreement_signed",
    label: "Agreement Signed",
    shortLabel: "Agreement",
    icon: FileSignature,
  },
  {
    key: "final_clearance",
    label: "Final Clearance",
    shortLabel: "Final Clearance",
    icon: ShieldCheck,
    final: true,
  },
];

const preClearanceKeys = checklistItems
  .filter((item) => !item.final)
  .map((item) => item.key);

const isChecklistChecked = (value) => value === true || Number(value) === 1;

const formatDate = (value) => {
  if (!value) return "Date to be added";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const VesselAssignment = ({ role, name, type, joiningDate, reportingPort }) => {
  if (!name) return null;
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <Ship className="mt-0.5 h-4 w-4 shrink-0 text-[#3a5f9e]" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-[#3a5f9e]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3a5f9e]">
            {role}
          </span>
          {type && <span className="text-[11px] text-slate-500">{type}</span>}
        </div>
        <p className="mt-1 truncate text-sm font-bold text-slate-800" title={name}>
          {name}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} /> {formatDate(joiningDate)}
          </span>
          {reportingPort && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {reportingPort}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChecklistButton = ({ item, checked, blocked, disabled, saving, onChange }) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={item.label}
      title={blocked ? "Complete the first four items before Final Clearance" : item.label}
      disabled={disabled || blocked || saving}
      onClick={() => onChange(!checked)}
      className={`group flex min-h-[62px] min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#3a5f9e]/30 focus:ring-offset-1 disabled:cursor-not-allowed ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : blocked
            ? "border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-200 bg-white text-slate-600 hover:border-[#3a5f9e]/50 hover:bg-[#3a5f9e]/5"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          checked
            ? "bg-emerald-600 text-white"
            : "border border-slate-200 bg-slate-100 text-slate-500 group-hover:text-[#3a5f9e]"
        }`}
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : checked ? (
          <Check size={15} strokeWidth={3} />
        ) : blocked ? (
          <Lock size={13} />
        ) : (
          <Icon size={14} />
        )}
      </span>
      <span className="min-w-0 text-xs font-semibold leading-4">
        {item.shortLabel}
      </span>
    </button>
  );
};

const Onboarding = () => {
  const { hasPermission: canEdit } = usePermission("onboarding", "edit");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("allocation") || "",
  );
  const [status, setStatus] = useState("Pending");
  const [department, setDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [pendingCompletion, setPendingCompletion] = useState(null);

  const load = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      const response = await api.get("/onboarding");
      setRows(response.data.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load onboarding queue",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const pending = rows.filter((row) => row.status === "Pending");
    return {
      pending: pending.length,
      inProgress: pending.filter((row) => Number(row.completed_checks) > 0).length,
      onboarded: rows.filter((row) => row.status === "Onboarded").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "All" || row.status === status;
      const matchesDepartment =
        department === "All" || row.department === department;
      const searchable = [
        row.name_as_in_indos_cert,
        row.cadet_unique_id,
        row.institute_name,
        row.allocation_number,
        row.primary_vessel_name,
        row.secondary_vessel_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && matchesDepartment && (!term || searchable.includes(term));
    });
  }, [department, rows, search, status]);

  const updateChecklist = async (row, key, checked) => {
    const savingKey = `${row.id}:${key}`;
    try {
      setSaving(savingKey);
      const response = await api.put(`/onboarding/${row.id}/checklist`, {
        [key]: checked,
      });
      const updated = response.data.data;
      setRows((current) =>
        current.map((item) =>
          item.id === row.id ? { ...item, ...updated } : item,
        ),
      );
      if (updated.status === "Onboarded") {
        toast.success(`${row.name_as_in_indos_cert} is now Onboarded`);
        setPendingCompletion(null);
      } else {
        toast.success("Checklist updated");
      }
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update checklist",
      );
      if (error.response?.status === 409) load(false);
      return false;
    } finally {
      setSaving(null);
    }
  };

  const handleChecklistChange = (row, item, checked) => {
    if (item.final && checked) {
      setPendingCompletion({ row, item });
      return;
    }
    updateChecklist(row, item.key, checked);
  };

  return (
    <div className="py-6">
      <PageHeader
        title="Cadet Onboarding"
        subtitle="Complete final checks for CTV Assigned cadets"
        icon={ClipboardCheck}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => load(false)}
          disabled={refreshing}
          className="border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10"
        >
          <RefreshCw size={16} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </PageHeader>

      <section className="mb-5 rounded-xl border border-[#3a5f9e]/20 bg-gradient-to-r from-[#3a5f9e]/10 via-blue-50 to-white px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3a5f9e] px-3 py-1.5 text-white">
            <Ship size={14} /> CTV Assigned
          </span>
          <ChevronRight size={16} className="text-slate-400" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3a5f9e]/20 bg-white px-3 py-1.5 text-[#3a5f9e]">
            <ClipboardCheck size={14} /> Verify 5 Checks
          </span>
          <ChevronRight size={16} className="text-slate-400" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
            <BadgeCheck size={14} /> Onboarded
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Cadets enter this queue automatically after their finalized CTV vessel assignment. Complete the first four checks, then approve Final Clearance.
        </p>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Users}
          label="CTV Assigned"
          value={counts.pending}
          tone="blue"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="In Progress"
          value={counts.inProgress}
          tone="amber"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Onboarded"
          value={counts.onboarded}
          tone="emerald"
        />
      </section>

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <Input
              className="border-slate-300 pl-9 focus-visible:ring-[#3a5f9e]/30"
              placeholder="Search candidate, allocation or vessel"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger
                className="w-full border-slate-300 bg-white sm:w-44"
                aria-label="Filter by department"
              >
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent align="end" className="z-[100] bg-white">
                <SelectItem value="All">All departments</SelectItem>
                <SelectItem value="Deck">Deck</SelectItem>
                <SelectItem value="Engine">Engine</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                className="w-full border-slate-300 bg-white sm:w-44"
                aria-label="Filter by onboarding status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent align="end" className="z-[100] bg-white">
                <SelectItem value="All">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Onboarded">Onboarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{filtered.length}</strong> of {rows.length} cadets
          </span>
          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
              <Lock size={12} /> Read-only access
            </span>
          )}
        </div>
      </section>

      <section className="space-y-3">
        {filtered.map((row) => {
          const locked = row.status === "Onboarded";
          const completedChecks = Number(row.completed_checks || 0);
          const totalChecks = Number(row.total_checks || checklistItems.length);
          const percent = Math.round((completedChecks / totalChecks) * 100);
          const clearanceReady = preClearanceKeys.every((key) =>
            isChecklistChecked(row[key]),
          );
          const rowSaving = saving?.startsWith(`${row.id}:`);
          const assignments = [
            row.allocation_status === "Allocated" && {
              role: "Primary",
              name: row.primary_vessel_name,
              type: row.primary_vessel_type,
              joiningDate: row.primary_joining_date,
              reportingPort: row.primary_reporting_port,
            },
            row.secondary_allocation_status === "Allocated" && {
              role: "Secondary",
              name: row.secondary_vessel_name,
              type: row.secondary_vessel_type,
              joiningDate: row.secondary_joining_date,
              reportingPort: row.secondary_reporting_port,
            },
          ].filter(Boolean);

          return (
            <article
              key={row.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                locked ? "border-emerald-200" : "border-slate-200"
              }`}
            >
              <div className="grid gap-4 p-4 xl:grid-cols-[minmax(220px,0.8fr)_minmax(280px,1fr)_minmax(520px,2fr)] xl:items-center">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3 xl:block">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900" title={row.name_as_in_indos_cert}>
                        {row.name_as_in_indos_cert}
                      </h2>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {row.cadet_unique_id}
                      </p>
                    </div>
                    <StatusBadge status={row.status} className="xl:hidden" />
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Building2 size={13} className="shrink-0 text-slate-400" />
                      <span className="truncate">{row.institute_name || "Institute not available"}</span>
                    </p>
                    <p className="font-semibold text-[#3a5f9e]">
                      {row.allocation_number} · {row.department}
                      {row.current_rank ? ` · Rank #${row.current_rank}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={row.status} className="mt-3 hidden xl:inline-flex" />
                </div>

                <div className="grid min-w-0 gap-2">
                  {assignments.map((assignment) => (
                    <VesselAssignment key={assignment.role} {...assignment} />
                  ))}
                  {!assignments.length && (
                    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-700">
                      Allocated vessel details are unavailable.
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Onboarding Checklist
                    </p>
                    <span className="whitespace-nowrap text-xs font-bold text-slate-700">
                      {completedChecks}/{totalChecks} complete
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {checklistItems.map((item) => {
                      const itemSaving = saving === `${row.id}:${item.key}`;
                      const checked = isChecklistChecked(row[item.key]);
                      const blocked = item.final && !clearanceReady && !checked;
                      return (
                        <ChecklistButton
                          key={item.key}
                          item={item}
                          checked={checked}
                          blocked={blocked}
                          disabled={locked || !canEdit || rowSaving}
                          saving={itemSaving}
                          onChange={(checked) =>
                            handleChecklistChange(row, item, checked)
                          }
                        />
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          locked ? "bg-emerald-500" : "bg-[#3a5f9e]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${locked ? "text-emerald-700" : "text-[#3a5f9e]"}`}>
                      {percent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-xs ${locked ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-slate-50"}`}>
                <span className="text-slate-500">
                  {locked
                    ? `Completed ${formatDateTime(row.completed_at)}${row.completed_by_name ? ` by ${row.completed_by_name}` : ""}`
                    : clearanceReady
                      ? "Ready for Final Clearance"
                      : "Complete the first four checks to enable Final Clearance"}
                </span>
                {locked && (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <Lock size={12} /> Checklist locked
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {!filtered.length && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#3a5f9e]/10 text-[#3a5f9e]">
              <ClipboardCheck size={24} />
            </div>
            <h3 className="mt-3 font-bold text-slate-800">
              {loading ? "Loading onboarding candidates..." : "No candidates found"}
            </h3>
            {!loading && (
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {status === "Pending"
                  ? "There are no CTV Assigned cadets waiting for onboarding with the selected filters."
                  : status === "Onboarded"
                    ? "No completed onboarding records match the selected filters."
                    : "Try clearing the search or changing the filters."}
              </p>
            )}
          </div>
        )}
      </section>

      <ConfirmationModal
        isOpen={Boolean(pendingCompletion)}
        onClose={() => setPendingCompletion(null)}
        onConfirm={() => {
          if (!pendingCompletion) return;
          updateChecklist(
            pendingCompletion.row,
            pendingCompletion.item.key,
            true,
          );
        }}
        title="Complete onboarding?"
        message={
          pendingCompletion
            ? `${pendingCompletion.row.name_as_in_indos_cert} has all required checks completed. Final Clearance will set the cadet status to Onboarded and lock this checklist.`
            : ""
        }
        confirmText="Mark as Onboarded"
        isLoading={
          pendingCompletion
            ? saving === `${pendingCompletion.row.id}:final_clearance`
            : false
        }
        maxWidthClass="max-w-md"
      />
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-[#3a5f9e]",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${tones[tone]}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 shadow-sm">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-xl font-extrabold">{value}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
      status === "Onboarded"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700"
    } ${className}`}
  >
    {status === "Onboarded" ? <CheckCircle2 size={13} /> : <ClipboardCheck size={13} />}
    {status}
  </span>
);

export default Onboarding;
