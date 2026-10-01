import { isPlanIntimated } from "./communicationUtils";

const inputClass =
  "h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#3a5f9e] focus:ring-2 focus:ring-[#3a5f9e]/20";

const today = new Date().toISOString().slice(0, 10);

const formatRankHistoryDate = (value) => {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const formatJoiningDate = (value) => {
  if (!value) return "Date to be added";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRankHistoryAdmin = (event) =>
  event.changed_by_name || event.changed_by_email || "Unknown admin";

const isVesselAllocated = (allocation) =>
  (Boolean(allocation.vessel_id) &&
    allocation.allocation_status === "Allocated") ||
  (Boolean(allocation.secondary_vessel_id) &&
    allocation.secondary_allocation_status === "Allocated");

const getAllocatedSlotCount = (allocation) =>
  Number(
    Boolean(allocation.vessel_id) &&
      allocation.allocation_status === "Allocated",
  ) +
  Number(
    Boolean(allocation.secondary_vessel_id) &&
      allocation.secondary_allocation_status === "Allocated",
  );

const isDepartmentCompatible = (resourceDepartment, candidateDepartment) => {
  const resource = String(resourceDepartment || "Both")
    .trim()
    .toLowerCase();
  const candidate = String(candidateDepartment || "")
    .trim()
    .toLowerCase();
  return resource === "both" || resource === candidate;
};

const hasJoiningPlan = (allocation, role) =>
  Boolean(
    role === "Secondary"
      ? allocation.secondary_joining_plan_id
      : allocation.primary_joining_plan_id,
  );

const getCycleProgress = (cycle, joiningPlans = []) => {
  const lists = cycle.rank_lists || [];
  const allocations = lists.flatMap((list) => list.allocations || []);
  const activeLists = lists.filter(
    (list) => (list.allocations || []).length > 0,
  );
  const candidateCount = allocations.length;
  const scoredCount = allocations.filter(
    (item) => item.final_score !== null,
  ).length;
  const rankedCount = allocations.filter(
    (item) => item.current_rank !== null,
  ).length;
  const allocatedCount = allocations.filter(isVesselAllocated).length;
  const finalizedCount = activeLists.filter(
    (list) => list.status === "Finalized",
  ).length;
  const allocatedSlots = allocations.reduce(
    (total, item) => total + getAllocatedSlotCount(item),
    0,
  );
  const joiningPlanCount = joiningPlans.filter(
    (plan) => !Number(plan.requires_refresh),
  ).length;
  const intimatedCount = joiningPlans.filter(isPlanIntimated).length;
  const onboardingReadyCount = allocations.filter((item) =>
    Boolean(item.joining_intimation_complete),
  ).length;
  const onboardedCount = allocations.filter(
    (item) => item.onboarding_status === "Onboarded",
  ).length;
  const hasCandidates = candidateCount > 0;

  return {
    candidateCount,
    scoredCount,
    rankedCount,
    allocatedCount,
    finalizedCount,
    activeListCount: activeLists.length,
    allocatedSlots,
    joiningPlanCount,
    intimatedCount,
    onboardingReadyCount,
    onboardedCount,
    steps: [
      {
        key: "candidates",
        label: "Select Candidates",
        complete: hasCandidates,
        detail: `${candidateCount} added`,
      },
      {
        key: "scores",
        label: "Enter Scores",
        complete: hasCandidates && scoredCount === candidateCount,
        detail: `${scoredCount}/${candidateCount} scored`,
      },
      {
        key: "rank-allocation",
        label: "Finalize Ranks",
        complete:
          hasCandidates &&
          rankedCount === candidateCount &&
          finalizedCount === activeLists.length,
        detail: `${finalizedCount}/${activeLists.length} finalized`,
      },
      {
        key: "finalize-intimate",
        label: "Allocate & Intimate",
        complete:
          activeLists.length > 0 &&
          finalizedCount === activeLists.length &&
          allocatedCount === candidateCount &&
          allocatedSlots > 0 &&
          joiningPlanCount >= allocatedSlots &&
          intimatedCount === joiningPlanCount,
        detail: `${finalizedCount}/${activeLists.length} lists · ${intimatedCount}/${joiningPlanCount} informed`,
      },
      {
        key: "onboarding",
        label: "Onboarding",
        complete: hasCandidates && onboardedCount === candidateCount,
        detail: `${onboardedCount}/${candidateCount} onboarded`,
      },
    ],
  };
};

const formatAcademicScore = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "—";
};

export {
  inputClass,
  today,
  formatRankHistoryDate,
  formatJoiningDate,
  getRankHistoryAdmin,
  isVesselAllocated,
  getAllocatedSlotCount,
  isDepartmentCompatible,
  isPlanIntimated,
  hasJoiningPlan,
  getCycleProgress,
  formatAcademicScore,
};
