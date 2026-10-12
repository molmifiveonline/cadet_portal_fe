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
  (Boolean(allocation.vessel_id) && allocation.allocation_status === "Allocated") ||
  (Boolean(allocation.secondary_vessel_id) &&
    allocation.secondary_allocation_status === "Allocated");

const getAllocatedVesselRoles = (allocation) =>
  ["Primary", "Secondary"].filter((role) => {
    const prefix = role === "Secondary" ? "secondary_" : "";
    return (
      Boolean(allocation[`${prefix}vessel_id`]) &&
      allocation[`${prefix}allocation_status`] === "Allocated"
    );
  });

const getAllocatedSlotCount = (allocation) =>
  Number(Boolean(allocation.vessel_id) && allocation.allocation_status === "Allocated") +
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
  const activeAllocations = (list) =>
    (list.allocations || []).filter((item) => Number(item.is_active ?? 1) === 1);
  const allocations = lists.flatMap(activeAllocations);
  const activeLists = lists.filter((list) => activeAllocations(list).length > 0);
  const candidateCount = allocations.length;
  const scoredCount = allocations.filter(
    (item) =>
      item.final_score != null &&
      item.final_score !== "" &&
      Number.isFinite(Number(item.final_score)),
  ).length;
  const rankedCount = allocations.filter((item) => Number(item.current_rank) > 0).length;
  const allocated = allocations.filter(isVesselAllocated);
  const allocatedCount = allocated.length;
  const finalizedCount = activeLists.filter((list) => list.status === "Finalized").length;
  const plansBySlot = new Map(
    joiningPlans.map((plan) => [`${plan.allocation_id}:${plan.vessel_role}`, plan]),
  );
  const slotsFor = (allocation) =>
    getAllocatedVesselRoles(allocation).map((role) => {
      const plan = plansBySlot.get(`${allocation.id}:${role}`);
      const secondary = role === "Secondary";
      const version = allocation[secondary ? "secondary_plan_version" : "primary_plan_version"];
      const current =
        plan &&
        !Number(plan.requires_refresh) &&
        plan.vessel_id === allocation[secondary ? "secondary_vessel_id" : "vessel_id"] &&
        (version == null || Number(plan.revision) === Number(version));
      return current ? plan : null;
    });
  const slotsByCadet = allocated.map(slotsFor);
  const slots = slotsByCadet.flat();
  const allocatedSlots = slots.length;
  const joiningPlanCount = slots.filter(Boolean).length;
  const intimatedCount = slots.filter(isPlanIntimated).length;
  const followupAssignedCount = allocated.filter((item) => item.follow_up_user_id).length;
  const confirmedSlotCount = slots.filter((plan) => Number(plan?.confirmation_received)).length;
  const confirmedCadetCount = slotsByCadet.filter(
    (plans) => plans.length && plans.every((plan) => Number(plan?.confirmation_received)),
  ).length;
  const onboardingReadyCount = allocated.filter(
    (item) => item.onboarding_status !== "Onboarded",
  ).length;
  const onboardedCount = allocations.filter(
    (item) => item.onboarding_status === "Onboarded",
  ).length;
  const onboardingPendingCount = allocations.filter(
    (item) => item.onboarding_status === "Pending" && item.onboarding_admission_source,
  ).length;
  const onboardingPausedCount = allocations.filter(
    (item) =>
      item.onboarding_status === "Pending" &&
      item.onboarding_admission_source &&
      !isVesselAllocated(item),
  ).length;
  const awaitingAllocationCount = allocations.filter(
    (item) => !isVesselAllocated(item) && item.onboarding_status !== "Onboarded",
  ).length;
  const awaitingOnboardingCount = candidateCount - onboardedCount - onboardingPendingCount;
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
    onboardingPendingCount,
    onboardingPausedCount,
    awaitingAllocationCount,
    awaitingOnboardingCount,
    followupAssignedCount,
    confirmedSlotCount,
    confirmedCadetCount,
    pendingConfirmationCount: allocatedCount - confirmedCadetCount,
    steps: [
      {
        key: "candidates",
        label: "Select Candidates",
        complete: hasCandidates,
        active: !hasCandidates,
        detail: `${candidateCount} added`,
        description: "Select eligible cadets for this allocation.",
      },
      {
        key: "vessels",
        label: "Allocate Vessels",
        complete: hasCandidates && allocatedCount === candidateCount,
        active: hasCandidates,
        detail: `${allocatedCount}/${candidateCount} cadets allocated`,
        description: `Save the vessel and joining details. ${onboardingReadyCount} ready for onboarding.`,
      },
      {
        key: "onboarding",
        label: "Onboarding",
        complete: hasCandidates && onboardedCount === candidateCount,
        active: onboardingReadyCount > 0 || onboardingPendingCount > 0 || onboardedCount > 0,
        detail: `${onboardedCount}/${candidateCount} completed`,
        description: `${onboardingPendingCount} pending${awaitingOnboardingCount ? ` · ${awaitingOnboardingCount} not yet in onboarding` : ""}.`,
      },
    ],
    rankSteps: [
      {
        key: "scores",
        label: "Enter Scores",
        complete: hasCandidates && scoredCount === candidateCount,
        detail: `${scoredCount}/${candidateCount} scored`,
      },
      {
        key: "ranks",
        label: "Finalize Ranks",
        complete:
          hasCandidates && rankedCount === candidateCount && finalizedCount === activeLists.length,
        detail: `${finalizedCount}/${activeLists.length} lists finalized`,
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
  getAllocatedVesselRoles,
  getAllocatedSlotCount,
  isDepartmentCompatible,
  isPlanIntimated,
  hasJoiningPlan,
  getCycleProgress,
  formatAcademicScore,
};
