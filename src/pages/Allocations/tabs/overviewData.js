import { isPlanIntimated as isIntimated } from "../communicationUtils";

export const hasScore = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

// Plans belong to a berth, not just a cadet. A secondary assignment needs its own plan.
export const getOverviewData = (cycle, joiningPlans = [], vessels = []) => {
  const plansBySlot = new Map(
    joiningPlans.map((plan) => [
      `${plan.allocation_id}:${plan.vessel_role}`,
      plan,
    ]),
  );
  const vesselsById = new Map(vessels.map((vessel) => [vessel.id, vessel]));
  const utilization = new Map();
  const rows = (cycle.rank_lists || []).flatMap((list) =>
    (list.allocations || []).map((allocation) => {
      const slots = [
        {
          role: "Primary",
          vesselId: allocation.vessel_id,
          name: allocation.vessel_name,
          status: allocation.allocation_status,
          capacity: allocation.total_seats,
        },
        {
          role: "Secondary",
          vesselId: allocation.secondary_vessel_id,
          name: allocation.secondary_vessel_name,
          status: allocation.secondary_allocation_status,
          capacity: allocation.secondary_total_seats,
        },
      ]
        .filter((slot) => slot.vesselId && slot.status === "Allocated")
        .map((slot) => {
          const vessel = vesselsById.get(slot.vesselId);
          const plan = plansBySlot.get(`${allocation.id}:${slot.role}`);
          const currentPlan =
            plan &&
            !Number(plan.requires_refresh) &&
            (!plan.vessel_id || plan.vessel_id === slot.vesselId);
          const name = slot.name || vessel?.name || "Assigned vessel";
          const entry = utilization.get(slot.vesselId) || {
            id: slot.vesselId,
            name,
            capacity: vessel?.total_seats ?? slot.capacity,
            primary: 0,
            secondary: 0,
            departments: new Set(),
          };
          entry[slot.role.toLowerCase()] += 1;
          entry.departments.add(list.department);
          utilization.set(slot.vesselId, entry);
          return {
            ...slot,
            name,
            plan,
            hasPlan: Boolean(currentPlan),
            intimated: Boolean(currentPlan && isIntimated(plan)),
          };
        });
      let joiningStatus = "Awaiting vessel";
      if (allocation.onboarding_status === "Onboarded")
        joiningStatus = "Onboarded";
      else if (slots.some((slot) => slot.plan && !slot.hasPlan))
        joiningStatus = "Refresh plan";
      else if (slots.some((slot) => !slot.hasPlan))
        joiningStatus = "Plan needed";
      else if (slots.length && slots.every((slot) => slot.intimated))
        joiningStatus = "Intimated";
      else if (slots.length) joiningStatus = "Intimation pending";
      return { allocation, list, slots, joiningStatus };
    }),
  );
  const slots = rows.flatMap((row) => row.slots);
  return {
    rows,
    slots,
    vessels: [...utilization.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    primaryCount: slots.filter((slot) => slot.role === "Primary").length,
    secondaryCount: slots.filter((slot) => slot.role === "Secondary").length,
    planCount: slots.filter((slot) => slot.hasPlan).length,
    intimatedCount: slots.filter((slot) => slot.intimated).length,
    refreshCount: slots.filter((slot) => slot.plan && !slot.hasPlan).length,
  };
};

export const getOverviewMilestone = (cycle, data) => {
  const lists = cycle.rank_lists || [];
  const firstList = lists[0];
  const base = {
    step: 1,
    list: firstList,
    target: "workflow",
    icon: "candidates",
  };
  if (!data.rows.length)
    return {
      ...base,
      list: lists.find((list) => list.status === "Draft") || firstList,
      title: "Enroll CTV-ready cadets",
      description:
        "Add verified candidates to begin assessment scoring and vessel allocation.",
      target: "candidates",
      label: "Add Candidates",
    };
  if (
    data.rows.every(
      ({ allocation }) => allocation.onboarding_status === "Onboarded",
    )
  ) {
    return {
      ...base,
      step: 5,
      complete: true,
      icon: "complete",
      target: "onboarding",
      title: "Cycle complete: all cadets cleared",
      description: "Every cadet in this cycle has completed onboarding.",
      label: "View Onboarding",
    };
  }
  const unscored = data.rows.find(
    ({ allocation }) => !hasScore(allocation.final_score),
  );
  if (unscored)
    return {
      ...base,
      step: 2,
      list: unscored.list,
      icon: "scores",
      title: "Complete assessment scores",
      label: "Enter Scores",
      description: `${data.rows.filter(({ allocation }) => !hasScore(allocation.final_score)).length} cadet(s) still need a final assessment score.`,
    };
  const unranked = data.rows.find(
    ({ allocation }) => !Number(allocation.current_rank),
  );
  if (unranked)
    return {
      ...base,
      step: 3,
      list: unranked.list,
      icon: "ranks",
      title: "Complete the rank list",
      label: "Review Ranks",
      description:
        "Review the scored candidates and resolve missing ranks before finalizing.",
    };
  const draft = lists.find(
    (list) => list.allocations?.length && list.status !== "Finalized",
  );
  if (draft)
    return {
      ...base,
      step: 3,
      list: draft,
      icon: "ranks",
      target: "finalize",
      title: "Finalize the rank list",
      label: `Finalize ${draft.department} List`,
      description: `${data.rows.length}/${data.rows.length} cadets scored; ${data.rows.filter((row) => row.slots.length).length}/${data.rows.length} assigned a vessel. Lock scores and ranks to freeze merit standings. Vessel assignments remain editable.`,
    };
  const unallocated = data.rows.find((row) => !row.slots.length);
  if (unallocated)
    return {
      ...base,
      step: 4,
      list: unallocated.list,
      icon: "vessels",
      title: "Allocate compatible vessels",
      label: "Assign Vessels",
      description: `${data.rows.filter((row) => !row.slots.length).length} cadet(s) still need a compatible vessel assignment.`,
    };
  if (data.planCount < data.slots.length)
    return {
      ...base,
      step: 5,
      icon: "joining",
      target: "joining",
      title: "Create joining plans & intimate",
      label: "Open Joining Plans",
      description: `${data.slots.length - data.planCount} allocated berth(s) need a current joining plan.${data.refreshCount ? ` ${data.refreshCount} existing plan(s) need refreshing.` : ""}`,
    };
  if (data.intimatedCount < data.planCount)
    return {
      ...base,
      step: 5,
      icon: "joining",
      target: "joining",
      title: "Record candidate communication",
      label: "Open Communication Queue",
      description: `${data.planCount - data.intimatedCount} plan(s) still need the admin to record Email, WhatsApp, or Phone communication.`,
    };
  return {
    ...base,
    step: 5,
    icon: "onboarding",
    target: "onboarding",
    title: "Complete onboarding clearance",
    label: "Open Onboarding",
    description: `${data.rows.filter(({ allocation }) => allocation.onboarding_status !== "Onboarded").length} cadet(s) still need onboarding checklist clearance.`,
  };
};

export const getFormulaDetails = (list) => {
  let snapshot = list.formula_snapshot || {};
  if (typeof snapshot === "string") {
    try {
      snapshot = JSON.parse(snapshot) || {};
    } catch {
      snapshot = {};
    }
  }
  const average = ["AcademicAssessmentAverage", "SimpleTotal"].includes(
    snapshot.scoring_method,
  );
  const academic = average
    ? 50
    : hasScore(snapshot.academic_weight)
      ? Number(snapshot.academic_weight)
      : null;
  const assessment = average
    ? 50
    : Array.isArray(snapshot.components) && snapshot.components.length
      ? snapshot.components.reduce(
          (sum, component) => sum + Number(component.weight || 0),
          0,
        )
      : null;
  return {
    name: snapshot.name || list.formula_name || "Configured formula",
    version: snapshot.version ?? list.formula_version,
    academic,
    assessment,
    average,
  };
};
