import React from "react";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
    scores: [
      { course_id: "course-1", course_name_snapshot: "Navigation", score: 85 },
    ],
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
  };
  vessels = ["Primary Vessel", "Secondary Vessel"].map((name, index) => ({
    id: `vessel-${index + 1}`,
    name,
    status: "Active",
    department: "Deck",
    vessel_type_id: "type-1",
    vessel_type: "Tanker",
    total_seats: 6,
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
  api.get.mockImplementation(async (url) => {
    const data = {
      "/allocations/cycle-1": cycle,
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
  fireEvent.click(
    (await screen.findAllByRole("button", { name: "Deck Workflow" }))[0],
  );
};

const expectReload = async () =>
  waitFor(() => {
    expect(
      api.get.mock.calls.filter(([url]) => url === "/allocations/cycle-1"),
    ).toHaveLength(2);
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
    expect(
      screen.getByText(/Disabled allocation.*view only/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reason: Replacement drive created/),
    ).toBeInTheDocument();
    expect(screen.getByText(/10:00:00.*IST/)).toBeInTheDocument();
    expect(screen.getByText("Example Cadet")).toBeInTheDocument();
    expect(screen.getByText("Primary Vessel")).toBeInTheDocument();
    expect(screen.getByText("Secondary Vessel")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Add Candidates|Edit Assessment|Change Primary|Change Secondary|Finalize|Unlock|Remove|Reset Ranks|Move Up|Move Down/,
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Joining & Intimation" }),
    );
    expect(
      screen.queryByRole("button", {
        name: /Create Plan|Record Communication|Record Confirmation|Add Contact|Restore/,
      }),
    ).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
  },
);

it("loads the existing page data and keeps candidate selection, save payload, and reload connected", async () => {
  await openWorkflow();
  expect(api.get).toHaveBeenCalledTimes(6);
  fireEvent.click(screen.getByRole("button", { name: "Add Candidates" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Select Deck Candidates",
  });
  fireEvent.click(
    await within(dialog).findByRole("checkbox", { name: "Select New Cadet" }),
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Add 1 to Deck" }),
  );
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      "/allocations/rank-lists/list-1/candidates",
      {
        candidates: [{ cadet_id: "cadet-2", scores: [], vessel_type_id: null }],
      },
    ),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
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
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("Candidate already allocated"),
  );
  expect(checkbox).toBeChecked();
  expect(
    screen.getByRole("dialog", { name: "Select Deck Candidates" }),
  ).toBeInTheDocument();
});

it("validates assessment scores before saving and reloads after the lazy dialog succeeds", async () => {
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Edit Assessment" }));
  const score = await screen.findByRole("spinbutton");
  fireEvent.change(score, { target: { value: "101" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Assessment" }));
  expect(
    screen.getByText("Score must be between 0 and 100."),
  ).toBeInTheDocument();
  expect(api.put).not.toHaveBeenCalled();
  fireEvent.change(score, { target: { value: "90" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Assessment" }));
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith(
      "/allocations/candidate-allocations/allocation-1/scores",
      { scores: [{ course_id: "course-1", score: 90 }] },
    ),
  );
  await expectReload();
});

it.each(["Primary", "Secondary"])(
  "preserves the %s vessel selection and both assignment fields when saving",
  async (role) => {
    allocation.primary_joining_plan_id = null;
    allocation.secondary_joining_plan_id = null;
    await openWorkflow();
    const changeButton = screen.getByRole("button", { name: `Change ${role}` });
    expect(changeButton.parentElement.textContent.endsWith("0")).toBe(false);
    expect(
      screen.queryByRole("button", { name: /Joining Plan/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(changeButton);
    const dialog = await screen.findByRole("dialog", {
      name: `${role} Vessel Allocation — Example Cadet`,
    });
    fireEvent.change(within(dialog).getByLabelText("Admin remarks"), {
      target: { value: "Updated remarks" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: `Save ${role} Allocation` }),
    );
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        "/allocations/candidate-allocations/allocation-1/vessel",
        {
          vessel_type_id: "type-1",
          vessel_id: "vessel-1",
          allocation_status: "Allocated",
          secondary_vessel_type_id: "type-1",
          secondary_vessel_id: "vessel-2",
          secondary_allocation_status: "Allocated",
          admin_remarks: "Updated remarks",
        },
      ),
    );
    await expectReload();
  },
);

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
  fireEvent.click(
    screen.getByRole("button", { name: "Finalize", exact: true }),
  );
  expect(
    screen.getAllByRole("button", { name: "Finalize", exact: true }).at(-1),
  ).toBeDisabled();
  expect(screen.getByText(/Final Score incomplete/)).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

it("keeps editing unavailable with read-only permissions", async () => {
  allocation.primary_joining_plan_id = null;
  allocation.secondary_joining_plan_id = null;
  usePermission.mockReturnValue({ hasPermission: false });
  await openWorkflow();
  expect(api.get).not.toHaveBeenCalledWith("/allocations/admins");
  expect(
    screen.queryByRole("button", { name: "Edit Assessment" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Add Candidates" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Change Primary" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Change Secondary|View Details/ }),
  ).not.toBeInTheDocument();
});

it.each([
  [false, false],
  [true, false],
  [false, true],
  [true, true],
])(
  "respects separate joining plan edit (%s) and communication (%s) permissions",
  async (canEdit, canCommunicate) => {
    cycle.rank_lists[0].status = "Finalized";
    allocation.secondary_joining_plan_id = null;
    joiningPlans = [
      {
        ...allocation,
        id: "plan-1",
        allocation_id: allocation.id,
        vessel_role: "Primary",
        status: "Draft",
        requires_refresh: 0,
      },
    ];
    usePermission.mockImplementation((module, action) => ({
      hasPermission:
        action === "edit"
          ? canEdit
          : action === "communicate"
            ? canCommunicate
            : false,
    }));
    await openWorkflow();
    fireEvent.click(
      screen.getByRole("button", { name: "Joining & Intimation" }),
    );
    expect(Boolean(screen.queryByRole("button", { name: "Create Plan" }))).toBe(
      canEdit,
    );
    expect(
      Boolean(screen.queryByRole("button", { name: "Record Communication" })),
    ).toBe(canCommunicate);
    expect(
      api.get.mock.calls.some(([url]) => url === "/allocations/admins"),
    ).toBe(canCommunicate);
  },
);

it("allows a joining plan editor to save without opening communication", async () => {
  cycle.rank_lists[0].status = "Finalized";
  allocation.primary_joining_plan_id = null;
  Object.assign(vessels[0], {
    joining_date: "2027-01-10",
    reporting_port: "Mumbai",
    contact_person_name: "Port Agent",
  });
  usePermission.mockImplementation((module, action) => ({
    hasPermission: action === "edit",
  }));
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Joining & Intimation" }));
  fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Create Primary Joining Plan",
  });
  expect(
    within(dialog).queryByRole("button", { name: /Record Communication/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Create Plan" }));
  await waitFor(() => expect(api.post).toHaveBeenCalled());
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
});

it.each(["Primary", "Secondary"])(
  "locks only %s after its joining plan exists and allows changing the other vessel",
  async (role) => {
    allocation.primary_joining_plan_id = role === "Primary" ? "plan-1" : null;
    allocation.secondary_joining_plan_id =
      role === "Secondary" ? "plan-2" : null;
    const editableRole = role === "Primary" ? "Secondary" : "Primary";
    vessels.push({
      ...vessels[0],
      id: "vessel-3",
      name: "Replacement Vessel",
      total_seats: 0,
      available_seats: 0,
    });
    cycle.rank_lists[0].status = "Finalized";
    await openWorkflow();
    expect(
      screen.queryByRole("button", { name: `Change ${role}` }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /View Details|Joining Plan/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: `Change ${editableRole}` }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /Vessel Allocation/,
    });
    expect(
      within(dialog).queryByRole("checkbox", { name: "Available seats only" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("radio", { name: "Select Replacement Vessel" }),
    ).toBeEnabled();
    fireEvent.click(
      within(dialog).getByRole("radio", { name: "Select Replacement Vessel" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: `Save ${editableRole} Allocation`,
      }),
    );
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        "/allocations/candidate-allocations/allocation-1/vessel",
        {
          vessel_type_id: "type-1",
          vessel_id: role === "Primary" ? "vessel-1" : "vessel-3",
          allocation_status: "Allocated",
          secondary_vessel_type_id: "type-1",
          secondary_vessel_id: role === "Secondary" ? "vessel-2" : "vessel-3",
          secondary_allocation_status: "Allocated",
          admin_remarks: "Existing vessel remarks",
        },
      ),
    );
    await expectReload();
  },
);

it("hides vessel actions when both plans exist, even when a plan requires review", async () => {
  allocation.secondary_joining_plan_requires_refresh = 1;
  await openWorkflow();
  expect(
    screen.queryByRole("button", {
      name: /Change Primary|Change Secondary|View Details|Joining Plan/,
    }),
  ).not.toBeInTheDocument();
});

it("allows allocating an unassigned secondary vessel after a primary plan exists", async () => {
  allocation.secondary_joining_plan_id = null;
  allocation.secondary_vessel_id = null;
  allocation.secondary_vessel_name = null;
  allocation.secondary_allocation_status = "Pending";
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Allocate Secondary" }));
  const dialog = await screen.findByRole("dialog", {
    name: /Secondary Vessel Allocation/,
  });
  expect(
    within(dialog).getByRole("radio", { name: "Select Secondary Vessel" }),
  ).toBeEnabled();
});

it("keeps vessel editing unavailable after onboarding", async () => {
  allocation.primary_joining_plan_id = null;
  allocation.secondary_joining_plan_id = null;
  allocation.onboarding_status = "Onboarded";
  await openWorkflow();
  expect(
    screen.queryByRole("button", {
      name: /Change Primary|Change Secondary|View Details/,
    }),
  ).not.toBeInTheDocument();
});

it("validates the joining plan, preserves its payload, and opens communication after creation", async () => {
  cycle.rank_lists[0].status = "Finalized";
  allocation.primary_joining_plan_id = null;
  await openWorkflow();
  fireEvent.click(screen.getByRole("button", { name: "Joining & Intimation" }));
  fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Create Primary Joining Plan",
  });
  const create = within(dialog).getByRole("button", {
    name: "Create & Record Communication",
  });
  fireEvent.click(create);
  expect(
    screen.getByText("Select the candidate joining date."),
  ).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.change(within(dialog).getByLabelText(/Joining Date/), {
    target: { value: "2027-01-10" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Reporting Port/), {
    target: { value: "Mumbai" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Contact Person/), {
    target: { value: "Port Agent" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Required Documents/), {
    target: { value: "Passport, Medical\nCDC" },
  });
  fireEvent.click(create);
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      "/allocations/candidate-allocations/allocation-1/joining-plan",
      {
        joining_date: "2027-01-10",
        location: "",
        voyage_ref: "",
        reporting_port: "Mumbai",
        contact_person_name: "Port Agent",
        contact_person_email: "",
        contact_person_phone: "",
        vessel_role: "Primary",
        required_documents: ["Passport", "Medical", "CDC"],
      },
    ),
  );
  expect(
    await screen.findByRole("dialog", {
      name: "Record Communication — Example Cadet",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Email", pressed: true }),
  ).toBeInTheDocument();
  await expectReload();
});
