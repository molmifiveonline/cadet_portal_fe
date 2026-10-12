import { getCycleProgress } from "./allocationUtils";

const allocation = (id, overrides = {}) => ({
  id,
  is_active: 1,
  final_score: null,
  current_rank: null,
  vessel_id: "v1",
  allocation_status: "Allocated",
  secondary_vessel_id: null,
  secondary_allocation_status: "Pending",
  primary_plan_version: 1,
  secondary_plan_version: 1,
  onboarding_status: "Pending",
  onboarding_admission_source: "allocation",
  ...overrides,
});
const plan = (allocationId, role = "Primary", overrides = {}) => ({
  allocation_id: allocationId,
  vessel_role: role,
  vessel_id: role === "Primary" ? "v1" : "v2",
  revision: 1,
  confirmation_received: 0,
  requires_refresh: 0,
  successful_email_count: 0,
  ...overrides,
});
const cycle = (allocations, status = "Draft") => ({
  rank_lists: [{ id: "rank", status, allocations }],
});

test("two of three cadets can start onboarding with draft ranks and no joining emails", () => {
  const data = getCycleProgress(
    cycle([
      allocation("first", { final_score: 0, current_rank: 1, follow_up_user_id: "owner" }),
      allocation("second", {
        vessel_id: null,
        allocation_status: "Pending",
        secondary_vessel_id: "v2",
        secondary_allocation_status: "Allocated",
        final_score: undefined,
      }),
      allocation("third", {
        vessel_id: null,
        allocation_status: "Pending",
        onboarding_status: null,
        onboarding_admission_source: null,
      }),
    ]),
    [plan("first", "Primary", { confirmation_received: 1 }), plan("second", "Secondary")],
  );
  expect(data).toMatchObject({
    candidateCount: 3,
    allocatedCount: 2,
    allocatedSlots: 2,
    onboardingReadyCount: 2,
    onboardingPendingCount: 2,
    awaitingAllocationCount: 1,
    scoredCount: 1,
    finalizedCount: 0,
    intimatedCount: 0,
    followupAssignedCount: 1,
    confirmedCadetCount: 1,
    pendingConfirmationCount: 1,
  });
  expect(data.steps.map((step) => step.key)).toEqual(["candidates", "vessels", "onboarding"]);
  expect(data.steps.find((step) => step.key === "onboarding")).toMatchObject({
    active: true,
    complete: false,
    detail: "0/3 completed",
  });
  expect(data.rankSteps.every((step) => !step.complete)).toBe(true);
});

test("rank finalization and unlocking affect only rank progress", () => {
  const a = allocation("cadet", { final_score: 80, current_rank: 1 });
  const draft = getCycleProgress(cycle([a]));
  const finalized = getCycleProgress(cycle([a], "Finalized"));
  expect(finalized.steps).toEqual(draft.steps);
  expect(draft.rankSteps[1].complete).toBe(false);
  expect(finalized.rankSteps[1].complete).toBe(true);
});

test("primary and secondary confirmations belong to their current plans under one cadet", () => {
  const a = allocation("cadet", {
    secondary_vessel_id: "v2",
    secondary_allocation_status: "Allocated",
    follow_up_user_id: "owner",
  });
  const primary = plan("cadet", "Primary", { confirmation_received: 1, successful_email_count: 1 });
  const secondary = plan("cadet", "Secondary");
  const partial = getCycleProgress(cycle([a]), [primary, secondary]);
  expect(partial).toMatchObject({
    allocatedCount: 1,
    allocatedSlots: 2,
    followupAssignedCount: 1,
    confirmedSlotCount: 1,
    confirmedCadetCount: 0,
    pendingConfirmationCount: 1,
  });
  secondary.confirmation_received = "1";
  expect(getCycleProgress(cycle([a]), [primary, secondary]).confirmedCadetCount).toBe(1);
  a.primary_plan_version = 2;
  const changed = getCycleProgress(cycle([a]), [primary, secondary]);
  expect(changed).toMatchObject({
    confirmedSlotCount: 1,
    confirmedCadetCount: 0,
    intimatedCount: 0,
    onboardingPendingCount: 1,
  });
  expect(changed.steps.find((step) => step.key === "onboarding").active).toBe(true);
});

test("hold, cancelled, stale and other cadets' plans cannot inflate progress", () => {
  const a = allocation("cadet", { secondary_vessel_id: "v2", secondary_allocation_status: "Hold" });
  for (const primary of [
    plan("cadet", "Primary", {
      requires_refresh: 1,
      confirmation_received: 1,
      successful_email_count: 1,
    }),
    plan("cadet", "Primary", {
      vessel_id: "old-vessel",
      confirmation_received: 1,
      successful_email_count: 1,
    }),
  ]) {
    const data = getCycleProgress(cycle([a]), [
      primary,
      plan("cadet", "Secondary", { confirmation_received: 1, successful_email_count: 1 }),
      plan("other", "Primary", { confirmation_received: 1, successful_email_count: 1 }),
    ]);
    expect(data).toMatchObject({
      allocatedSlots: 1,
      joiningPlanCount: 0,
      confirmedSlotCount: 0,
      intimatedCount: 0,
    });
  }
  a.allocation_status = "Cancelled";
  const paused = getCycleProgress(cycle([a]));
  expect(paused).toMatchObject({
    allocatedCount: 0,
    onboardingReadyCount: 0,
    onboardingPendingCount: 1,
    onboardingPausedCount: 1,
    awaitingAllocationCount: 1,
    awaitingOnboardingCount: 0,
  });
  expect(paused.steps.find((step) => step.key === "onboarding").description).toBe("1 pending.");
});

test("completed onboarding stays complete without final ranks, emails or confirmations", () => {
  const data = getCycleProgress(
    cycle([
      allocation("cadet", {
        onboarding_status: "Onboarded",
        onboarding_admission_source: "legacy",
      }),
    ]),
    [plan("cadet")],
  );
  expect(data).toMatchObject({
    onboardedCount: 1,
    onboardingPendingCount: 0,
    onboardingReadyCount: 0,
    intimatedCount: 0,
    confirmedCadetCount: 0,
  });
  expect(data.steps.find((step) => step.key === "onboarding").complete).toBe(true);
  expect(data.rankSteps.every((step) => !step.complete)).toBe(true);
});

test("empty and inactive allocations have no false completion", () => {
  for (const allocations of [[], [allocation("inactive", { is_active: 0 })]]) {
    const data = getCycleProgress(cycle(allocations));
    expect(data).toMatchObject({
      candidateCount: 0,
      activeListCount: 0,
      onboardingReadyCount: 0,
      allocatedSlots: 0,
    });
    expect(data.steps.every((step) => !step.complete)).toBe(true);
    expect(data.rankSteps.every((step) => !step.complete)).toBe(true);
  }
});

test("manual Email contact is separate from an actual joining email", () => {
  const manual = plan("cadet", "Primary", {
    last_mode: "Email",
    email_delivery_status: null,
    successful_communication_count: 1,
    confirmation_received: 1,
  });
  const data = getCycleProgress(cycle([allocation("cadet")]), [manual]);
  expect(data.confirmedCadetCount).toBe(1);
  expect(data.intimatedCount).toBe(0);
  expect(
    getCycleProgress(cycle([allocation("cadet")]), [{ ...manual, successful_email_count: 1 }])
      .intimatedCount,
  ).toBe(1);
});
