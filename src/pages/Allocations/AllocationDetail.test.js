import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AllocationDetail from "./AllocationDetail";
import api from "../../lib/utils/apiConfig";
import { usePermission } from "../../hooks/usePermission";
import { toast } from "sonner";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
    useParams: () => ({ id: "cycle-1" }),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
  }),
  { virtual: true },
);
jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "admin-1", role: "SuperAdmin" } }),
}));
jest.mock("../../hooks/usePermission", () => ({ usePermission: jest.fn() }));
jest.mock("../../lib/utils/apiConfig", () => ({
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

let cycle;
let allocation;
let vessels;
let courses;
let eligibleCandidate;
let joiningPlans;
const mockPermission = usePermission;

beforeEach(() => {
  jest.clearAllMocks();
  joiningPlans = [];
  usePermission.mockReturnValue({ hasPermission: true });
  courses = [{ id: "course-1", name: "Navigation", status: "Active" }];
  allocation = {
    id: "allocation-1",
    rank_list_id: "list-1",
    cadet_id: "cadet-1",
    name_as_in_indos_cert: "Example Cadet",
    cadet_unique_id: "CTV-001",
    email_id: "cadet@example.test",
    institute_name: "Test Institute",
    current_rank: 1,
    final_score: 80,
    academic_score: 75,
    scores: [{ course_id: "course-1", course_name_snapshot: "Navigation", score: 85 }],
    vessel_type_id: "type-1",
    vessel_type_name: "Tanker",
    vessel_id: "vessel-1",
    vessel_name: "Primary Vessel",
    allocation_status: "Allocated",
    secondary_vessel_type_id: "type-1",
    secondary_vessel_type_name: "Tanker",
    secondary_vessel_id: "vessel-2",
    secondary_vessel_name: "Secondary Vessel",
    secondary_allocation_status: "Allocated",
    onboarding_status: "Pending",
    primary_joining_plan_id: "plan-1",
    primary_joining_plan_requires_refresh: 0,
    secondary_joining_plan_id: "plan-2",
    secondary_joining_plan_requires_refresh: 0,
    admin_remarks: "Existing vessel remarks",
    department: "Deck",
    primary_plan_version: 1,
    secondary_plan_version: 1,
  };
  vessels = ["Primary Vessel", "Secondary Vessel"].map((name, index) => ({
    id: `vessel-${index + 1}`,
    name,
    status: "Active",
    department: "Deck",
    vessel_type_id: "type-1",
    vessel_type: "Tanker",
    total_seats: 0,
    joining_date: "2026-11-12",
    reporting_port: "Mumbai",
    contact_person_name: "Port Agent",
  }));
  cycle = {
    id: "cycle-1",
    allocation_number: "ALLOC-001",
    allocation_year: 2026,
    department: "Deck",
    rank_lists: [
      {
        id: "list-1",
        department: "Deck",
        status: "Draft",
        ranking_mode: "Auto",
        allocations: [allocation],
      },
    ],
  };
  eligibleCandidate = {
    id: "cadet-2",
    name_as_in_indos_cert: "New Cadet",
    cadet_unique_id: "CTV-002",
    eligible: true,
    academic_score: 72,
    ineligible_reasons: [],
  };
  const workflowRow = () => ({
    ...allocation,
    plans: joiningPlans,
    abilities: {
      can_view: true,
      can_edit: !cycle.deleted_at && mockPermission("allocations", "edit").hasPermission,
      can_follow: !cycle.deleted_at && mockPermission("allocations", "communicate").hasPermission,
      can_send: false,
      can_assign: false,
      can_choose_informed_by: true,
    },
  });
  api.get.mockImplementation(async (url) => {
    const data = {
      "/allocations/cycle-1": cycle,
      "/allocations/follow-ups/allocation-1": workflowRow(),
      "/allocations/follow-ups/allocation-1/lookups": {
        vessels,
        types: [{ id: "type-1", name: "Tanker", department: "Deck", status: "Active" }],
      },
      "/allocations/follow-ups": { data: [workflowRow()], pagination: { totalPages: 1 } },
      "/allocations/follow-up-users": [{ id: "admin-1", name: "Test Admin", role: "SuperAdmin" }],
      "/allocations/masters/vessel-types": [
        { id: "type-1", name: "Tanker", department: "Deck", status: "Active" },
      ],
      "/allocations/masters/courses": courses,
      "/allocations/vessels": vessels,
      "/allocations/joining-plans": joiningPlans,
      "/allocations/admins": [{ id: "admin-1", name: "Test Admin" }],
      "/allocations/rank-lists/list-1/eligible-candidates": [eligibleCandidate],
    }[url];
    if (data === undefined) throw new Error(`Unexpected API request: ${url}`);
    return {
      data: {
        success: true,
        data,
        meta: { page: 1, total: 1, total_pages: 1 },
      },
    };
  });
  api.patch.mockResolvedValue({ data: { success: true } });
  api.put.mockResolvedValue({ data: { success: true } });
  api.post.mockResolvedValue({
    data: {
      success: true,
      data: {
        id: "new-plan",
        vessel_name: "Primary Vessel",
        vessel_role: "Primary",
      },
    },
  });
  api.delete.mockResolvedValue({ data: { success: true } });
});

const openWorkflow = async () => {
  render(<AllocationDetail />);
  fireEvent.click((await screen.findAllByRole("button", { name: "Deck Workflow" }))[0]);
};

const expectReload = async () =>
  waitFor(() => {
    expect(api.get.mock.calls.filter(([url]) => url === "/allocations/cycle-1")).toHaveLength(2);
  });

const allowDisable = () => {
  allocation.primary_joining_plan_id = null;
  allocation.secondary_joining_plan_id = null;
  allocation.onboarding_status = null;
};

it("requires a reason, disables the selected allocation once, and reloads it as read-only history", async () => {
  allowDisable();
  let finishDisable;
  api.delete.mockImplementationOnce(
    (url, { data }) =>
      new Promise((resolve) => {
        finishDisable = () => {
          cycle = {
            ...cycle,
            deleted_at: "2026-10-06T04:30:00Z",
            deleted_by_name: "Test Admin",
            delete_reason: data.reason,
          };
          resolve({ data: { success: true } });
        };
      }),
  );
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Disable Allocation", exact: true }));
  expect(screen.getByText(/Disable ALLOC-001\?/)).toBeInTheDocument();
  const reason = screen.getByRole("textbox", { name: /Reason for disabling/ });
  const confirm = screen.getByRole("button", { name: "Confirm Disable" });
  expect(confirm).toBeDisabled();
  fireEvent.change(reason, { target: { value: "   " } });
  expect(confirm).toBeDisabled();
  expect(api.delete).not.toHaveBeenCalled();
  fireEvent.change(reason, { target: { value: "  Replacement allocation  " } });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(api.delete).toHaveBeenCalledTimes(1);
  expect(api.delete).toHaveBeenCalledWith("/allocations/cycle-1", {
    data: { reason: "Replacement allocation" },
  });
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  finishDisable();
  await screen.findByText(/Disabled allocation.*view only/);
  expect(screen.getByText("Reason: Replacement allocation")).toBeInTheDocument();
  expect(screen.getByText("Example Cadet")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: /Disable Allocation|Add Candidates|Change Primary|Restore/,
    }),
  ).not.toBeInTheDocument();
  await expectReload();
});

it("keeps the reason when the server rejects disabling and allows cancellation without another request", async () => {
  allowDisable();
  api.delete.mockRejectedValueOnce({
    response: { data: { message: "A joining plan was created" } },
  });
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Disable Allocation", exact: true }));
  const reason = screen.getByRole("textbox", { name: /Reason for disabling/ });
  fireEvent.change(reason, { target: { value: "Wrong allocation" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm Disable" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("A joining plan was created"));
  expect(reason).toHaveValue("Wrong allocation");
  expect(screen.getByRole("button", { name: "Add Candidates" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("textbox", { name: /Reason for disabling/ })).not.toBeInTheDocument();
  expect(api.delete).toHaveBeenCalledTimes(1);
});

it.each([
  [
    "finalized ranks",
    () => {
      cycle.rank_lists[0].status = "Finalized";
    },
    /rank list is finalized/,
  ],
  [
    "joining plans on inactive cadets",
    () => {
      cycle.existing_joining_plan_count = 1;
    },
    /joining plans/,
  ],
  [
    "onboarding on inactive cadets",
    () => {
      cycle.existing_onboarding_count = 1;
    },
    /onboarding records/,
  ],
  [
    "loaded joining plans",
    () => {
      allocation.secondary_joining_plan_id = "plan";
    },
    /joining plans/,
  ],
])("blocks disabling with %s and explains why", async (label, protect, explanation) => {
  allowDisable();
  protect();
  await openWorkflow();
  const button = screen.getByRole("button", { name: "Disable Allocation", exact: true });
  expect(button).toBeDisabled();
  expect(button).toHaveAccessibleDescription(explanation);
  expect(
    screen.getByRole("button", { name: "Why disable allocation is unavailable" }),
  ).toBeInTheDocument();
  fireEvent.click(button);
  expect(screen.queryByRole("textbox", { name: /Reason for disabling/ })).not.toBeInTheDocument();
  expect(api.delete).not.toHaveBeenCalled();
});

it("hides the detail disable action without allocation edit permission", async () => {
  allowDisable();
  usePermission.mockReturnValue({ hasPermission: false });
  await openWorkflow();
  expect(
    screen.queryByRole("button", { name: "Disable Allocation", exact: true }),
  ).not.toBeInTheDocument();
  expect(api.delete).not.toHaveBeenCalled();
});

it.each(["Draft", "Finalized"])(
  "keeps disabled %s history read-only even for a SuperAdmin with every permission",
  async (status) => {
    Object.assign(cycle, {
      deleted_at: "2026-10-01T04:30:00.000Z",
      deleted_by_name: "Test Admin",
      delete_reason: "Replacement drive created",
    });
    cycle.rank_lists[0].status = status;
    allocation.primary_joining_plan_id = null;
    allocation.secondary_joining_plan_id = null;
    await openWorkflow();
    expect(screen.getByText(/Disabled allocation.*view only/)).toBeInTheDocument();
    expect(screen.getByText(/Reason: Replacement drive created/)).toBeInTheDocument();
    expect(screen.getByText(/10:00:00.*IST/)).toBeInTheDocument();
    expect(screen.getByText("Example Cadet")).toBeInTheDocument();
    expect(screen.getByText("Primary Vessel")).toBeInTheDocument();
    expect(screen.getByText("Secondary Vessel")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Add Candidates|Edit Assessment|Change Primary|Change Secondary|Finalize|Unlock|Remove|Reset Ranks|Move Up|Move Down|Disable Allocation/,
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Joining & Intimation" }));
    await screen.findByRole("button", { name: "View History" });
    expect(
      screen.queryByRole("button", {
        name: /Create Plan|Record Communication|Record Confirmation|Add Follow-up|Change Vessel|Assign User|Restore/,
      }),
    ).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
  },
);

it("loads the existing page data and keeps candidate selection, save payload, and reload connected", async () => {
  await openWorkflow();
  expect(api.get).toHaveBeenCalledTimes(3);
  fireEvent.click(screen.getByRole("button", { name: "Add Candidates" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Select Deck Candidates",
  });
  fireEvent.click(await within(dialog).findByRole("checkbox", { name: "Select New Cadet" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Add 1 to Deck" }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/allocations/rank-lists/list-1/candidates", {
      candidates: [{ cadet_id: "cadet-2", scores: [], vessel_type_id: null }],
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await expectReload();
});

it("keeps the candidate dialog and selection when saving fails", async () => {
  api.post.mockRejectedValueOnce({
    response: { data: { message: "Candidate already allocated" } },
  });
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Add Candidates" }));
  const checkbox = await screen.findByRole("checkbox", {
    name: "Select New Cadet",
  });
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole("button", { name: "Add 1 to Deck" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Candidate already allocated"));
  expect(checkbox).toBeChecked();
  expect(screen.getByRole("dialog", { name: "Select Deck Candidates" })).toBeInTheDocument();
});

it("validates assessment scores before saving and reloads after the lazy dialog succeeds", async () => {
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Edit Assessment" }));
  const score = await screen.findByRole("spinbutton");
  fireEvent.change(score, { target: { value: "101" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Assessment" }));
  expect(screen.getByText("Score must be between 0 and 100.")).toBeInTheDocument();
  expect(api.put).not.toHaveBeenCalled();
  fireEvent.change(score, { target: { value: "90" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Assessment" }));
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith("/allocations/candidate-allocations/allocation-1/scores", {
      scores: [{ course_id: "course-1", score: 90 }],
    }),
  );
  await expectReload();
});

it("requires rank-change remarks and retains the selected target rank in the request", async () => {
  cycle.rank_lists[0].allocations.push({
    ...allocation,
    id: "allocation-2",
    cadet_unique_id: "CTV-002",
    name_as_in_indos_cert: "Second Cadet",
    current_rank: 2,
  });
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Move Second Cadet up" }));
  const move = screen.getByRole("button", { name: "Move Up", exact: true });
  expect(move).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Reason for changing rank"), {
    target: { value: "  Reviewed priority  " },
  });
  fireEvent.click(move);
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      "/allocations/candidate-allocations/allocation-2/move-rank",
      { direction: "up", target_rank: 1, remarks: "Reviewed priority" },
    ),
  );
  await expectReload();
});

it("keeps incomplete lists blocked from finalization", async () => {
  allocation.final_score = null;
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Finalize", exact: true }));
  expect(screen.getAllByRole("button", { name: "Finalize", exact: true }).at(-1)).toBeDisabled();
  expect(screen.getByText(/Final Score incomplete/)).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

it("keeps editing unavailable with read-only permissions", async () => {
  allocation.primary_joining_plan_id = null;
  allocation.secondary_joining_plan_id = null;
  usePermission.mockReturnValue({ hasPermission: false });
  await openWorkflow();
  expect(api.get).not.toHaveBeenCalledWith("/allocations/admins");
  expect(screen.queryByRole("button", { name: "Edit Assessment" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add Candidates" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Change Primary" })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Change Secondary|View Details/ }),
  ).not.toBeInTheDocument();
});

it.each(["Draft", "Finalized"])(
  "allows vessel changes in %s lists after a joining plan exists",
  async (status) => {
    cycle.rank_lists[0].status = status;
    await openWorkflow();
    expect(screen.getByRole("button", { name: "Change Primary" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Change Secondary" })).toBeEnabled();
    if (status === "Finalized")
      expect(screen.queryByRole("button", { name: "Edit Assessment" })).not.toBeInTheDocument();
  },
);
it.each(["Primary", "Secondary"])(
  "saves only the %s revision and joining details without sending",
  async (role) => {
    await openWorkflow();
    const change = screen.getByRole("button", { name: "Change " + role });
    expect(change.parentElement.textContent.endsWith("0")).toBe(false);
    fireEvent.click(change);
    const location = await screen.findByLabelText("Location");
    fireEvent.change(location, { target: { value: "Cadet-specific location" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Allocation" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(
        "/allocations/candidate-allocations/allocation-1/vessel-plan",
        {
          vessel_role: role,
          expected_version: 1,
          vessel_id: role === "Primary" ? "vessel-1" : "vessel-2",
          allocation_status: "Allocated",
          change_reason: "",
          joining_details: expect.objectContaining({
            location: "Cadet-specific location",
            joining_date: "2026-11-12",
            required_documents: [],
          }),
        },
      ),
    );
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await expectReload();
  },
);
it("allows a zero-seat replacement and submits its change reason", async () => {
  vessels.push({ ...vessels[0], id: "vessel-3", name: "Replacement Vessel", available_seats: 0 });
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Change Primary" }));
  const select = await screen.findByRole("radio", { name: "Select Replacement Vessel" });
  expect(select).toBeEnabled();
  expect(screen.queryByRole("checkbox", { name: "Available seats only" })).not.toBeInTheDocument();
  fireEvent.click(select);
  fireEvent.change(screen.getByLabelText("Reason for Change"), {
    target: { value: "Cadet requested a later date" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Allocation" }));
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        vessel_id: "vessel-3",
        change_reason: "Cadet requested a later date",
      }),
    ),
  );
});
it("preserves unsaved details when the server rejects a stale revision", async () => {
  api.patch.mockRejectedValueOnce({
    response: { data: { message: "Allocation changed. Reload before saving." } },
  });
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Change Primary" }));
  fireEvent.change(await screen.findByLabelText("Location"), {
    target: { value: "Keep this draft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Allocation" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Reload before saving");
  expect(screen.getByLabelText("Location")).toHaveValue("Keep this draft");
});
it.each([
  ["Primary", "Allocated"],
  ["Primary", "Hold"],
  ["Primary", "Cancelled"],
  ["Secondary", "Allocated"],
  ["Secondary", "Hold"],
  ["Secondary", "Cancelled"],
])("shows only the follow-up person for a %s vessel with %s status", async (role, status) => {
  allocation.follow_up_user_id = "admin-1";
  allocation.owner = { id: "admin-1", name: "Test Admin", status: "active" };
  allocation[role === "Primary" ? "allocation_status" : "secondary_allocation_status"] = status;
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Change " + role }));
  const section = await screen.findByRole("region", { name: "Follow-up Details" });
  expect(
    within(section).getByRole("textbox", { name: "Follow-up Person (Informed By)" }),
  ).toHaveValue("Test Admin");
  expect(within(section).queryByRole("button")).not.toBeInTheDocument();
  expect(within(section).queryByText(/confirmation|Last contact/i)).not.toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});
it.each([
  [false, false],
  [true, false],
  [false, true],
  [true, true],
])("keeps edit %s and manual follow-up %s permissions separate", async (canEdit, canFollow) => {
  joiningPlans = [
    {
      id: "plan-1",
      vessel_id: "vessel-1",
      vessel_role: "Primary",
      revision: 1,
      vessel_name: "Primary Vessel",
    },
    {
      id: "plan-2",
      vessel_id: "vessel-2",
      vessel_role: "Secondary",
      revision: 1,
      vessel_name: "Secondary Vessel",
    },
  ];
  usePermission.mockImplementation((module, action) => ({
    hasPermission: action === "edit" ? canEdit : action === "communicate" ? canFollow : false,
  }));
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Joining & Intimation" }));
  await screen.findByRole("button", { name: "View History" });
  expect(screen.queryAllByRole("button", { name: "Change Vessel / Joining Details" })).toHaveLength(
    canEdit ? 2 : 0,
  );
  expect(screen.queryAllByRole("button", { name: "Add Follow-up" })).toHaveLength(
    canFollow ? 2 : 0,
  );
  expect(screen.queryByRole("button", { name: "Create Plan" })).not.toBeInTheDocument();
});
it("keeps vessel editing unavailable after onboarding", async () => {
  allocation.onboarding_status = "Onboarded";
  await openWorkflow();
  expect(
    screen.queryByRole("button", { name: /Change Primary|Change Secondary/ }),
  ).not.toBeInTheDocument();
});
