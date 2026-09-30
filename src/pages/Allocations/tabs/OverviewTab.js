import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ListOrdered,
  Lock,
  Mail,
  Pencil,
  Plus,
  Ship,
  Unlock,
  UserCheck,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  getFormulaDetails,
  getOverviewData,
  getOverviewMilestone,
  hasScore,
} from "./overviewData";

const focusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a5f9e] focus-visible:ring-offset-2";
const panelClass =
  "min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
const percent = (value, total) =>
  total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
const score = (value) =>
  hasScore(value) ? `${Number(value).toFixed(2)}%` : "—";
const dateLabel = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const Badge = ({ children, tone = "slate" }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${
      tone === "green"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-800"
          : "bg-slate-100 text-slate-600"
    }`}
  >
    {children}
  </span>
);

const MetricCard = ({
  label,
  value,
  detail,
  completed,
  total,
  icon: Icon,
  onClick,
  children,
}) => {
  const completion = percent(completed, total);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${label}: ${value}. ${detail}`}
      className={`${focusClass} group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition enabled:hover:border-[#3a5f9e]/40 enabled:hover:shadow-md disabled:cursor-default`}
    >
      <span className="mb-3 flex w-full items-center justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3a5f9e]/10 text-[#3a5f9e]">
          <Icon size={18} aria-hidden="true" />
        </span>
        {onClick && (
          <ArrowUpRight
            size={16}
            className="text-slate-400 group-hover:text-[#3a5f9e]"
            aria-hidden="true"
          />
        )}
      </span>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </span>
      <span className="mt-1 min-h-8 text-xs leading-4 text-slate-500">
        {detail}
      </span>
      {children && (
        <span className="mt-2 flex flex-wrap gap-1">{children}</span>
      )}
      <span className="mt-auto w-full pt-3">
        <span className="mb-1.5 flex justify-between text-[10px] font-semibold text-slate-500">
          <span>{total ? "Progress" : "Not started"}</span>
          <span>{completion}%</span>
        </span>
        <span
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          className="block h-1.5 overflow-hidden rounded-full bg-slate-100"
        >
          <span
            className={`block h-full rounded-full ${completion === 100 ? "bg-emerald-500" : "bg-[#3a5f9e]"}`}
            style={{ width: `${completion}%` }}
          />
        </span>
      </span>
    </button>
  );
};

const RosterSnapshot = ({ lists, data, canEdit, openCandidates, setTab }) => (
  <section className={panelClass} aria-labelledby="overview-roster-heading">
    <div className="border-b border-slate-100 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3a5f9e]">
        Merit & placement
      </p>
      <h2
        id="overview-roster-heading"
        className="mt-1 text-base font-bold text-slate-900"
      >
        Cadet allocation snapshot
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Top ranks, assigned vessels and joining readiness.
      </p>
    </div>
    {!lists.length && (
      <p className="p-6 text-sm text-slate-500">
        No department rank lists are available.
      </p>
    )}
    {lists.map((list) => {
      const rows = data.rows
        .filter((row) => row.list.id === list.id)
        .sort(
          (a, b) =>
            (Number(a.allocation.current_rank) || Infinity) -
              (Number(b.allocation.current_rank) || Infinity) ||
            String(a.allocation.cadet_unique_id || "").localeCompare(
              String(b.allocation.cadet_unique_id || ""),
            ),
        );
      return (
        <div key={list.id}>
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <h3 className="text-xs font-bold text-slate-700">
              {list.department} cadets
            </h3>
            <span className="text-[11px] text-slate-500">
              {rows.length > 5
                ? `Top 5 of ${rows.length}`
                : `${rows.length} enrolled`}
            </span>
          </div>
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <caption className="sr-only">
                  Top {list.department} cadets by current rank
                </caption>
                <thead className="border-y border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Rank",
                      "Cadet",
                      "Scores",
                      "Assigned vessel",
                      "Joining",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="px-4 py-2.5 font-semibold"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows
                    .slice(0, 5)
                    .map(({ allocation, slots, joiningStatus }) => {
                      const movement =
                        list.ranking_mode === "Manual"
                          ? allocation.rank_history?.[0]
                          : null;
                      return (
                        <tr
                          key={allocation.id}
                          className="align-top hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex min-w-8 justify-center rounded-lg px-2 py-1.5 font-bold ${Number(allocation.current_rank) === 1 ? "bg-[#3a5f9e] text-white" : "bg-[#3a5f9e]/10 text-[#3a5f9e]"}`}
                            >
                              {allocation.current_rank
                                ? `#${allocation.current_rank}`
                                : "—"}
                            </span>
                            {movement && (
                              <span
                                className="mt-1 block whitespace-nowrap text-[10px] font-medium text-amber-700"
                                title={`Last manual move: #${movement.from_rank} to #${movement.to_rank}`}
                              >
                                {Number(movement.to_rank) <
                                Number(movement.from_rank)
                                  ? "↑"
                                  : "↓"}{" "}
                                {Math.abs(
                                  Number(movement.from_rank) -
                                    Number(movement.to_rank),
                                )}{" "}
                                moved
                              </span>
                            )}
                          </td>
                          <td className="max-w-48 px-4 py-4">
                            <p className="font-semibold text-slate-900">
                              {allocation.name_as_in_indos_cert ||
                                "Unnamed cadet"}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-[#3a5f9e]">
                              {allocation.cadet_unique_id || "ID unavailable"}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {allocation.institute_name ||
                                "Institute unavailable"}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="inline-flex rounded-md bg-[#3a5f9e]/10 px-2 py-1 font-bold text-[#3a5f9e]">
                              {score(allocation.final_score)}
                            </span>
                            <p className="mt-1.5 text-[10px] text-slate-500">
                              Academic {score(allocation.academic_score)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            {slots.length ? (
                              <div className="space-y-2">
                                {slots.map((slot) => (
                                  <div
                                    key={slot.role}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
                                  >
                                    <p className="font-medium text-slate-700">
                                      {slot.name}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                      {slot.role}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">
                                Not allocated
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              tone={
                                ["Onboarded", "Intimated"].includes(
                                  joiningStatus,
                                )
                                  ? "green"
                                  : "amber"
                              }
                            >
                              {joiningStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mx-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <UserCheck
                size={24}
                className="mx-auto text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No {list.department} cadets enrolled yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add CTV-ready candidates to start this cycle.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0">
            {canEdit && list.status === "Draft" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCandidates(list)}
              >
                <Plus size={14} className="mr-1.5" />
                Add {list.department} Candidates
              </Button>
            )}
            <button
              type="button"
              className={`${focusClass} ml-auto inline-flex items-center gap-1.5 rounded text-xs font-semibold text-[#3a5f9e] hover:underline`}
              onClick={() => setTab(list.department)}
            >
              View Full {list.department} Roster{" "}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      );
    })}
  </section>
);

const CycleStatus = ({ lists, data }) => (
  <section className={panelClass} aria-labelledby="overview-status-heading">
    <div className="border-b border-slate-100 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3a5f9e]">
        Cycle controls
      </p>
      <h2
        id="overview-status-heading"
        className="mt-1 text-base font-bold text-slate-900"
      >
        Status & vessel berths
      </h2>
    </div>
    <div className="space-y-5 p-5">
      {lists.map((list) => {
        const finalized = list.status === "Finalized";
        const SecurityIcon = finalized ? Lock : Unlock;
        const formula = getFormulaDetails(list);
        const lastFinalized = list.admin_remarks_history?.find(
          (event) => event.action === "Finalize",
        );
        const finalizedBy =
          lastFinalized?.changed_by_name ||
          lastFinalized?.changed_by_email ||
          "Administrator";
        return (
          <div key={list.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <SecurityIcon
                  size={15}
                  className={finalized ? "text-emerald-600" : "text-amber-600"}
                  aria-hidden="true"
                />
                {list.department} rank list
              </h3>
              <Badge tone={finalized ? "green" : "amber"}>
                {finalized ? "Finalized · Locked" : "Draft · Unlocked"}
              </Badge>
            </div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Ranking mode</dt>
                <dd className="text-right font-semibold text-slate-700">
                  {list.ranking_mode === "Manual"
                    ? "Manual override active"
                    : "Automatic score order"}
                </dd>
              </div>
              {(list.finalized_at || lastFinalized) && (
                <div>
                  <dt className="text-slate-500">Last finalized</dt>
                  <dd className="mt-1 text-slate-700">
                    {finalizedBy}
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {dateLabel(
                        list.finalized_at || lastFinalized?.created_at,
                      )}
                    </span>
                  </dd>
                </div>
              )}
              {list.unlock_remarks && (
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <dt className="font-semibold text-amber-800">
                    Last unlock remarks
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-amber-900">
                    {list.unlock_remarks}
                  </dd>
                </div>
              )}
            </dl>
            <div className="rounded-xl border border-[#3a5f9e]/10 bg-[#3a5f9e]/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Formula snapshot
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-800">
                {formula.name}
                {formula.version != null ? ` · v${formula.version}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                <span>
                  Academic{" "}
                  <strong className="text-[#3a5f9e]">
                    {formula.academic === null ? "—" : `${formula.academic}%`}
                  </strong>
                </span>
                <span>
                  Assessment{" "}
                  <strong className="text-[#3a5f9e]">
                    {formula.assessment === null
                      ? "—"
                      : `${formula.assessment}%`}
                  </strong>
                </span>
              </div>
              {formula.average && (
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  Final = (IMU Academic % + Assessment Average %) ÷ 2
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Assigned vessels
          </h3>
          <Badge>{data.vessels.length} vessels</Badge>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Berths allocated within this cycle.
        </p>
        {data.vessels.length ? (
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {data.vessels.map((vessel) => (
              <li
                key={vessel.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
              >
                <Ship
                  size={17}
                  className="mt-0.5 shrink-0 text-[#3a5f9e]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800">
                    {vessel.name}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {[...vessel.departments].join(" & ")} · {vessel.primary}{" "}
                    primary · {vessel.secondary} secondary
                  </p>
                  {hasScore(vessel.capacity) && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      Vessel capacity: {vessel.capacity}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-center">
                  <strong className="block text-sm text-[#3a5f9e]">
                    {vessel.primary + vessel.secondary}
                  </strong>
                  <span className="text-[9px] text-slate-500">berths</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
            No vessels assigned yet. Vessel berths will appear here after
            allocation.
          </p>
        )}
      </div>
    </div>
  </section>
);

const OverviewTab = ({
  cycle,
  progress,
  joiningPlans = [],
  vessels = [],
  openCandidates,
  setTab,
  openOnboarding,
  canEdit,
  canFinalize,
  canViewOnboarding,
}) => {
  const lists = cycle.rank_lists || [];
  const data = getOverviewData(cycle, joiningPlans, vessels);
  const milestone = getOverviewMilestone(cycle, data);
  const department = milestone.list?.department || lists[0]?.department;
  const openWorkflow = department ? () => setTab(department) : undefined;
  const openJoining = () => setTab("Joining Plan");
  let action = openWorkflow;
  let actionLabel = milestone.label;
  if (milestone.target === "candidates") {
    if (canEdit && milestone.list?.status === "Draft")
      action = () => openCandidates(milestone.list);
    else actionLabel = "View Roster";
  } else if (milestone.target === "joining") {
    action = openJoining;
    if (!canEdit) actionLabel = "View Joining Plans";
  } else if (milestone.target === "onboarding") {
    action = canViewOnboarding ? openOnboarding : openJoining;
    if (!canViewOnboarding) actionLabel = "View Joining Status";
  } else if (milestone.target === "finalize" && !canFinalize)
    actionLabel = "Review Rank List";
  else if (!canEdit && milestone.target === "workflow")
    actionLabel = "View Roster";
  const HeroIcon = {
    candidates: UserCheck,
    scores: Pencil,
    ranks: Lock,
    vessels: Ship,
    joining: Mail,
    onboarding: ClipboardCheck,
    complete: CheckCircle2,
  }[milestone.icon];
  const candidateCount = data.rows.length;
  const scoredCount = data.rows.filter(({ allocation }) =>
    hasScore(allocation.final_score),
  ).length;
  const enrolledDetail =
    lists
      .map((list) => `${list.allocations?.length || 0} ${list.department}`)
      .join(" · ") || "No candidates yet";
  const scoreList =
    lists.find((list) =>
      list.allocations?.some((allocation) => !hasScore(allocation.final_score)),
    ) || lists[0];
  const vesselList =
    data.rows.find((row) => !row.slots.length)?.list || lists[0];
  return (
    <div className="space-y-5">
      <section
        aria-labelledby="overview-milestone-heading"
        className="rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/10 p-px shadow-sm"
      >
        <div className="rounded-2xl bg-gradient-to-br from-white/95 to-blue-50/80 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${milestone.complete ? "bg-emerald-100 text-emerald-700" : "bg-[#3a5f9e]/10 text-[#3a5f9e]"}`}
              >
                <HeroIcon size={23} aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3a5f9e]">
                    {milestone.complete
                      ? "Cycle complete"
                      : `Milestone ${milestone.step} of 5`}
                  </p>
                  <span aria-hidden="true" className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <span
                        key={step}
                        className={`h-1 w-5 rounded-full ${milestone.complete || step < milestone.step ? "bg-emerald-500" : step === milestone.step ? "bg-[#3a5f9e]" : "bg-slate-200"}`}
                      />
                    ))}
                  </span>
                </div>
                <h2
                  id="overview-milestone-heading"
                  className="mt-2 text-xl font-bold tracking-tight text-slate-900"
                >
                  {milestone.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                  {milestone.description}
                </p>
                {!canEdit && (
                  <p className="mt-2 text-xs text-slate-500">
                    {canFinalize
                      ? "You can review and finalize rank lists. Candidate editing is unavailable for your role."
                      : "You have read-only access to candidate details."}
                  </p>
                )}
              </div>
            </div>
            {action && (
              <Button className="w-full shrink-0 sm:w-auto" onClick={action}>
                {actionLabel}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Cadets enrolled"
          value={`${candidateCount} cadets`}
          detail={enrolledDetail}
          completed={candidateCount}
          total={candidateCount}
          icon={UserCheck}
          onClick={lists[0] ? () => setTab(lists[0].department) : undefined}
        />
        <MetricCard
          label="Assessment scored"
          value={`${scoredCount}/${candidateCount}`}
          detail={`${progress.rankedCount} ranked · final scores ready`}
          completed={scoredCount}
          total={candidateCount}
          icon={GraduationCap}
          onClick={scoreList ? () => setTab(scoreList.department) : undefined}
        />
        <MetricCard
          label="Vessel allocated"
          value={`${progress.allocatedCount}/${candidateCount}`}
          detail={`${data.slots.length} berths assigned to cadets`}
          completed={progress.allocatedCount}
          total={candidateCount}
          icon={Ship}
          onClick={vesselList ? () => setTab(vesselList.department) : undefined}
        >
          <Badge>{data.primaryCount} primary</Badge>
          <Badge>{data.secondaryCount} secondary</Badge>
        </MetricCard>
        <MetricCard
          label="Joining plans & intimation"
          value={`${data.planCount}/${data.slots.length}`}
          detail={`${data.intimatedCount}/${data.slots.length} intimated · Email, WhatsApp or Phone`}
          completed={data.planCount}
          total={data.slots.length}
          icon={Mail}
          onClick={openJoining}
        >
          {data.refreshCount > 0 && (
            <Badge tone="amber">{data.refreshCount} to refresh</Badge>
          )}
        </MetricCard>
        <MetricCard
          label="Onboarding cleared"
          value={`${progress.onboardedCount}/${candidateCount}`}
          detail="Cadets cleared in Onboarding"
          completed={progress.onboardedCount}
          total={candidateCount}
          icon={ClipboardCheck}
          onClick={canViewOnboarding ? openOnboarding : undefined}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
        <RosterSnapshot
          lists={lists}
          data={data}
          canEdit={canEdit}
          openCandidates={openCandidates}
          setTab={setTab}
        />
        <CycleStatus lists={lists} data={data} />
      </div>

      <section
        aria-labelledby="overview-shortcuts-heading"
        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
      >
        <h2
          id="overview-shortcuts-heading"
          className="text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          Workflow shortcuts
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {lists.map((list) => (
            <React.Fragment key={list.id}>
              {canEdit && list.status === "Draft" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCandidates(list)}
                  >
                    <Plus size={14} className="mr-1.5" />
                    Add {list.department} Candidates
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTab(list.department)}
                  >
                    <Pencil size={14} className="mr-1.5" />
                    Score {list.department} Assessments
                  </Button>
                  {list.allocations?.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTab(list.department)}
                    >
                      <ListOrdered size={14} className="mr-1.5" />
                      Adjust {list.department} Ranks
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTab(list.department)}
              >
                <Ship size={14} className="mr-1.5" />
                {list.department} Workflow
              </Button>
            </React.Fragment>
          ))}
          <Button variant="outline" size="sm" onClick={openJoining}>
            <Mail size={14} className="mr-1.5" />
            Joining Plans & Intimation
          </Button>
          {canViewOnboarding && (
            <Button variant="outline" size="sm" onClick={openOnboarding}>
              <ClipboardCheck size={14} className="mr-1.5" />
              Cycle Onboarding
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
