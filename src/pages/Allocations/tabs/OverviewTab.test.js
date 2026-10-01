import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import OverviewTab from "./OverviewTab";
import {
  getFormulaDetails,
  getOverviewData,
  getOverviewMilestone,
} from "./overviewData";

const allocation = (overrides = {}) => ({
  id: "cadet-1",
  current_rank: 1,
  final_score: 80,
  academic_score: 75,
  name_as_in_indos_cert: "Test Cadet",
  cadet_unique_id: "CTV-001",
  institute_name: "Test Institute",
  vessel_id: "vessel-1",
  vessel_name: "Test Vessel",
  allocation_status: "Allocated",
  ...overrides,
});
const cycle = (allocations = [allocation()], listOverrides = {}) => ({
  rank_lists: [
    {
      id: "deck-list",
      department: "Deck",
      status: "Finalized",
      ranking_mode: "Auto",
      allocations,
      ...listOverrides,
    },
  ],
});
const plan = (overrides = {}) => ({
  id: "plan-1",
  allocation_id: "cadet-1",
  vessel_id: "vessel-1",
  vessel_role: "Primary",
  requires_refresh: 0,
  ...overrides,
});
const milestone = (currentCycle, plans = []) =>
  getOverviewMilestone(currentCycle, getOverviewData(currentCycle, plans));

describe("overview workflow and berth summaries", () => {
  it("advances through enrollment, scores, ranking, vessels, plans, intimation and onboarding", () => {
    expect(milestone(cycle([], { status: "Draft" })).target).toBe("candidates");
    expect(milestone(cycle([allocation({ final_score: null })])).step).toBe(2);
    expect(milestone(cycle([allocation({ current_rank: null })])).title).toBe(
      "Complete the rank list",
    );
    expect(milestone(cycle(undefined, { status: "Draft" })).target).toBe(
      "finalize",
    );
    expect(
      milestone(cycle([allocation({ allocation_status: "Not Allocated" })]))
        .step,
    ).toBe(4);
    expect(milestone(cycle()).title).toBe("Create joining plans & intimate");
    expect(milestone(cycle(), [plan()]).title).toBe(
      "Record candidate communication",
    );
    expect(milestone(cycle(), [plan({ last_mode: "Phone" })]).target).toBe(
      "onboarding",
    );
    expect(
      milestone(cycle([allocation({ onboarding_status: "Onboarded" })]))
        .complete,
    ).toBe(true);
  });

  it("treats zero as a completed score and absent scores as incomplete", () => {
    expect(
      milestone(cycle([allocation({ final_score: 0 })], { status: "Draft" }))
        .step,
    ).toBe(3);
    expect(
      milestone(cycle([allocation({ final_score: undefined })])).step,
    ).toBe(2);
  });

  it("requires a separate plan and intimation for each allocated berth", () => {
    const currentCycle = cycle([
      allocation({
        secondary_vessel_id: "vessel-2",
        secondary_allocation_status: "Allocated",
      }),
    ]);
    const data = getOverviewData(currentCycle, [plan({ last_mode: "Phone" })]);
    expect(data.slots).toHaveLength(2);
    expect(data.planCount).toBe(1);
    expect(data.intimatedCount).toBe(1);
    expect(data.rows[0].joiningStatus).toBe("Plan needed");
    expect(getOverviewMilestone(currentCycle, data).target).toBe("joining");
  });

  it("excludes cancelled assignments, unrelated plans and plans for previous vessels", () => {
    const currentCycle = cycle([
      allocation({
        secondary_vessel_id: "vessel-2",
        secondary_allocation_status: "Cancelled",
      }),
    ]);
    const data = getOverviewData(currentCycle, [
      plan({ vessel_id: "old-vessel", last_mode: "Phone" }),
      plan({ allocation_id: "other-cadet" }),
      plan({ vessel_role: "Secondary", vessel_id: "vessel-2" }),
    ]);
    expect(data.slots).toHaveLength(1);
    expect(data.planCount).toBe(0);
    expect(data.intimatedCount).toBe(0);
    expect(data.rows[0].joiningStatus).toBe("Refresh plan");
  });

  it("never counts stale plans or failed emails as successful intimations", () => {
    const stale = getOverviewData(cycle(), [
      plan({
        requires_refresh: "1",
        successful_communication_count: 2,
        last_mode: "Phone",
      }),
    ]);
    expect(stale.planCount).toBe(0);
    expect(stale.intimatedCount).toBe(0);
    expect(stale.refreshCount).toBe(1);
    const failed = getOverviewData(cycle(), [
      plan({ last_mode: "Email", email_delivery_status: "Failed" }),
    ]);
    expect(failed.planCount).toBe(1);
    expect(failed.intimatedCount).toBe(0);
    expect(failed.rows[0].joiningStatus).toBe("Intimation pending");
  });

  it.each([
    { last_mode: "Email", email_delivery_status: "Sent" },
    { last_mode: "Email", email_delivery_status: null },
    { last_mode: "WhatsApp" },
    { last_mode: "Phone" },
    {
      last_mode: "Email",
      email_delivery_status: "Failed",
      successful_communication_count: 1,
    },
  ])("recognizes a successful communication: %j", (communication) => {
    expect(
      getOverviewData(cycle(), [plan(communication)]).rows[0].joiningStatus,
    ).toBe("Intimated");
  });

  it("groups berths by vessel ID across departments and sends the next action to the incomplete department", () => {
    const currentCycle = cycle();
    currentCycle.rank_lists.push({
      id: "engine-list",
      department: "Engine",
      status: "Draft",
      allocations: [allocation({ id: "cadet-2", final_score: null })],
    });
    const data = getOverviewData(currentCycle);
    expect(data.vessels).toHaveLength(1);
    expect(data.vessels[0].primary).toBe(2);
    expect([...data.vessels[0].departments]).toEqual(["Deck", "Engine"]);
    expect(getOverviewMilestone(currentCycle, data).list.department).toBe(
      "Engine",
    );
  });

  it("uses the snapshotted formula and the correct scoring weights", () => {
    expect(
      getFormulaDetails({
        formula_name: "Renamed live formula",
        formula_snapshot: {
          name: "Original",
          version: 2,
          academic_weight: 20,
          components: [{ weight: 30 }, { weight: 50 }],
        },
      }),
    ).toMatchObject({
      name: "Original",
      version: 2,
      academic: 20,
      assessment: 80,
    });
    expect(
      getFormulaDetails({
        formula_snapshot: {
          scoring_method: "AcademicAssessmentAverage",
          components: [{ weight: 0 }],
        },
      }),
    ).toMatchObject({ academic: 50, assessment: 50 });
    expect(getFormulaDetails({ formula_snapshot: "invalid" })).toMatchObject({
      academic: null,
      assessment: null,
    });
  });
});

const renderOverview = (overrides = {}) => {
  const props = {
    cycle: cycle(undefined, { status: "Draft" }),
    progress: { rankedCount: 1, allocatedCount: 1, onboardedCount: 0 },
    canEdit: true,
    canFinalize: true,
    canViewOnboarding: true,
    openCandidates: jest.fn(),
    setTab: jest.fn(),
    openOnboarding: jest.fn(),
    ...overrides,
  };
  render(<OverviewTab {...props} />);
  return props;
};

describe("overview interactions and permissions", () => {
  it("opens the existing picker, workflow, joining tab and cycle onboarding", () => {
    const props = renderOverview();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Add Deck Candidates" })[0],
    );
    expect(props.openCandidates).toHaveBeenCalledWith(
      props.cycle.rank_lists[0],
    );
    fireEvent.click(screen.getByRole("button", { name: "Finalize Deck List" }));
    expect(props.setTab).toHaveBeenLastCalledWith("Deck");
    fireEvent.click(
      screen.getByRole("button", { name: /^Joining plans & intimation:/ }),
    );
    expect(props.setTab).toHaveBeenLastCalledWith("Joining Plan");
    fireEvent.click(
      screen.getByRole("button", { name: /^Onboarding cleared:/ }),
    );
    expect(props.openOnboarding).toHaveBeenCalledTimes(1);
  });

  it("shows review actions and hides editing shortcuts for read-only users", () => {
    const props = renderOverview({
      canEdit: false,
      canFinalize: false,
      canViewOnboarding: false,
    });
    expect(
      screen.queryByRole("button", { name: /Add Deck Candidates/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Score Deck Assessments/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Adjust Deck Ranks/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Cycle Onboarding" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /^Onboarding cleared:/ }).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Review Rank List" }));
    expect(props.setTab).toHaveBeenCalledWith("Deck");
    expect(props.openCandidates).not.toHaveBeenCalled();
  });

  it("allows the finalize shortcut for a user with finalize permission only", () => {
    renderOverview({ canEdit: false, canFinalize: true });
    expect(
      screen.getByRole("button", { name: "Finalize Deck List" }),
    ).toBeTruthy();
  });

  it("hides candidate and scoring actions on locked lists", () => {
    renderOverview({ cycle: cycle() });
    expect(
      screen.queryByRole("button", { name: /Add Deck Candidates/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Score Deck Assessments/ }),
    ).toBeNull();
  });

  it("renders empty cycles without false completion or invalid progress", () => {
    renderOverview({
      cycle: cycle([], { status: "Draft" }),
      progress: { rankedCount: 0, allocatedCount: 0, onboardedCount: 0 },
    });
    expect(
      screen.getByRole("heading", { name: "Enroll CTV-ready cadets" }),
    ).toBeTruthy();
    screen
      .getAllByRole("progressbar")
      .forEach((bar) => expect(bar.getAttribute("aria-valuenow")).toBe("0"));
  });

  it("previews five cadets in rank order without mutating the list", () => {
    const allocations = [6, 4, 2, 5, 1, 3].map((rank) =>
      allocation({
        id: `cadet-${rank}`,
        current_rank: rank,
        name_as_in_indos_cert: `Cadet ${rank}`,
      }),
    );
    renderOverview({ cycle: cycle(allocations) });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    expect(within(table).getAllByRole("row")[1].textContent).toContain(
      "Cadet 1",
    );
    expect(within(table).queryByText("Cadet 6")).toBeNull();
    expect(allocations[0].current_rank).toBe(6);
  });
});
