import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Anchor,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Eye,
  ListOrdered,
  Lock,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Ship,
  Trash2,
  Unlock,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/utils/apiConfig";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";
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
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../hooks/usePermission";

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
    Boolean(allocation.vessel_id) && allocation.allocation_status === "Allocated",
  ) +
  Number(
    Boolean(allocation.secondary_vessel_id) &&
      allocation.secondary_allocation_status === "Allocated",
  );

const isDepartmentCompatible = (resourceDepartment, candidateDepartment) => {
  const resource = String(resourceDepartment || "Both").trim().toLowerCase();
  const candidate = String(candidateDepartment || "").trim().toLowerCase();
  return resource === "both" || resource === candidate;
};

const isPlanIntimated = (plan) =>
  !Number(plan.requires_refresh) &&
  (Number(plan.successful_communication_count || 0) > 0 ||
    plan.last_mode === "Phone" ||
    plan.last_mode === "WhatsApp" ||
    (plan.last_mode === "Email" && plan.email_delivery_status === "Sent"));

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
  const joiningPlanCount = joiningPlans.filter((plan) => !Number(plan.requires_refresh)).length;
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

const AllocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { hasPermission: canEditAllocations } = usePermission(
    "allocations",
    "edit",
  );
  const { hasPermission: canFinalizeAllocations } = usePermission(
    "allocations",
    "finalize",
  );
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Dashboard");
  const [vesselTypes, setVesselTypes] = useState([]);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [joiningPlans, setJoiningPlans] = useState([]);
  const [candidateList, setCandidateList] = useState(null);
  const [vesselAllocation, setVesselAllocation] = useState(null);
  const [joiningPlanCandidate, setJoiningPlanCandidate] = useState(null);
  const [communicationPlan, setCommunicationPlan] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [
        cycleResponse,
        typeResponse,
        courseResponse,
        vesselResponse,
        planResponse,
        adminResponse,
      ] = await Promise.all([
        api.get(`/allocations/${id}`),
        api.get("/allocations/masters/vessel-types", {
          params: { status: "Active" },
        }),
        api.get("/allocations/masters/courses", {
          params: { status: "Active" },
        }),
        api.get("/vessels", { params: { limit: 200 } }),
        api.get("/allocations/joining-plans", { params: { cycle_id: id } }),
        api.get("/allocations/admins"),
      ]);
      setCycle(cycleResponse.data.data);
      setVesselTypes(typeResponse.data.data || []);
      setAssessmentTypes(courseResponse.data.data || []);
      setVessels(vesselResponse.data.data || []);
      setJoiningPlans(planResponse.data.data || []);
      setAdmins(adminResponse.data.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load allocation cycle",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    setCycle(null);
    setTab("Dashboard");
    setCandidateList(null);
    setVesselAllocation(null);
    setJoiningPlanCandidate(null);
    setCommunicationPlan(null);
    load();
  }, [load]);
  useEffect(() => {
    if (
      cycle &&
      cycle.id === id &&
      canEditAllocations &&
      searchParams.get("action") === "add-candidates"
    ) {
      const draftList = cycle.rank_lists.find((item) => item.status === "Draft");
      if (draftList) setCandidateList(draftList);
      setSearchParams({}, { replace: true });
    }
  }, [canEditAllocations, cycle, id, searchParams, setSearchParams]);

  if (loading && !cycle) return <PageLoader />;
  if (!cycle)
    return <div className="p-8 text-center">Allocation cycle not found.</div>;
  const department = cycle.department || cycle.rank_lists[0]?.department;
  const currentList = cycle.rank_lists.find((item) => item.department === tab);
  const progress = getCycleProgress(cycle, joiningPlans);

  return (
    <div className="py-6">
      <PageHeader
        title={cycle.allocation_number}
        subtitle={`${department} vessel allocation · ${cycle.allocation_year}`}
        icon={Anchor}
        backButton={
          <button
            onClick={() => navigate("/allocations")}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ArrowLeft />
          </button>
        }
      />
      <WorkflowStepper steps={progress.steps} />
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-white p-2">
        {[
          ["Dashboard", "Overview"],
          ...cycle.rank_lists.map((list) => [list.department, `${list.department} Workflow`]),
          ["Joining Plan", "Joining & Intimation"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === value ? "bg-[#3a5f9e] text-white" : "text-slate-600 hover:bg-[#3a5f9e]/10 hover:text-[#3a5f9e]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "Dashboard" && (
        <Dashboard
          cycle={cycle}
          progress={progress}
          openCandidates={setCandidateList}
          setTab={setTab}
          canEdit={canEditAllocations}
          openOnboarding={() =>
            navigate(
              `/onboarding?allocation=${encodeURIComponent(cycle.allocation_number)}`,
            )
          }
        />
      )}
      {currentList && (
        <RankList
          key={currentList.id}
          list={currentList}
          assessmentTypes={assessmentTypes}
          reload={load}
          openCandidates={() => setCandidateList(currentList)}
          openVessel={setVesselAllocation}
          openJoiningPlan={setJoiningPlanCandidate}
          isSuperAdmin={user?.role === "SuperAdmin"}
          canEdit={canEditAllocations}
          canFinalizePermission={canFinalizeAllocations}
        />
      )}
      {tab === "Joining Plan" && (
        <JoiningPlans
          cycle={cycle}
          plans={joiningPlans}
          openJoiningPlan={setJoiningPlanCandidate}
          openCommunication={setCommunicationPlan}
        />
      )}
      {candidateList && (
        <CandidatePicker
          list={candidateList}
          assessmentTypes={assessmentTypes}
          vesselTypes={vesselTypes}
          onClose={() => setCandidateList(null)}
          onSaved={() => {
            setCandidateList(null);
            load();
          }}
        />
      )}
      {vesselAllocation && (
        <VesselModal
          allocation={vesselAllocation.allocation}
          role={vesselAllocation.role}
          readOnly={vesselAllocation.readOnly}
          canManageJoiningPlans={canEditAllocations && vesselAllocation.allocation.onboarding_status !== "Onboarded"}
          list={cycle.rank_lists.find(
            (item) => item.id === vesselAllocation.allocation.rank_list_id,
          )}
          types={vesselTypes}
          vessels={vessels}
          joiningPlan={joiningPlans.find(
            (plan) =>
              plan.allocation_id === vesselAllocation.allocation.id &&
              plan.vessel_role === vesselAllocation.role,
          )}
          onCreateJoiningPlan={() => {
            const { allocation, role } = vesselAllocation;
            const rankList = cycle.rank_lists.find(
              (item) => item.id === allocation.rank_list_id,
            );
            setVesselAllocation(null);
            setJoiningPlanCandidate({
              ...allocation,
              vesselRole: role,
              department: rankList?.department,
              refreshJoiningPlan: Boolean(joiningPlans.find((plan) => plan.allocation_id === allocation.id && plan.vessel_role === role)?.requires_refresh),
            });
          }}
          onCommunicate={(plan) => {
            setVesselAllocation(null);
            setCommunicationPlan(plan);
          }}
          onClose={() => setVesselAllocation(null)}
          onSaved={() => {
            setVesselAllocation(null);
            load();
          }}
        />
      )}
      {joiningPlanCandidate && (
        <JoiningPlanModal
          candidate={joiningPlanCandidate}
          vessels={vessels}
          onClose={() => setJoiningPlanCandidate(null)}
          onCreated={(plan) => {
            setJoiningPlanCandidate(null);
            setCommunicationPlan(plan);
            load();
          }}
        />
      )}
      {communicationPlan && (
        <CommunicationModal
          plan={communicationPlan}
          admins={admins}
          currentUser={user}
          onClose={() => {
            setCommunicationPlan(null);
            load();
          }}
          onSaved={() => {
            setCommunicationPlan(null);
            load();
          }}
        />
      )}
    </div>
  );
};

const WorkflowStepper = ({ steps }) => {
  const currentIndex = steps.findIndex((step) => !step.complete);
  return (
    <section
      aria-label="CTV allocation workflow"
      className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex min-w-[680px] items-start">
        {steps.map((step, index) => {
          const complete = step.complete;
          const current = index === currentIndex;
          return (
            <React.Fragment key={step.key}>
              <div className="w-24 shrink-0 text-center">
                <div
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 ${complete ? "border-emerald-500 bg-emerald-500 text-white" : current ? "border-[#3a5f9e] bg-[#3a5f9e]/10 text-[#3a5f9e]" : "border-slate-200 bg-white text-slate-400"}`}
                >
                  {complete ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <p
                  className={`mt-2 text-xs font-bold ${current ? "text-[#3a5f9e]" : complete ? "text-slate-800" : "text-slate-400"}`}
                >
                  {step.label}
                </p>
                <p
                  className="mt-0.5 truncate text-[10px] text-slate-500"
                  title={step.detail}
                >
                  {step.detail}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mt-4 h-0.5 min-w-4 flex-1 ${complete ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};

const Dashboard = ({
  cycle,
  progress,
  openCandidates,
  setTab,
  openOnboarding,
  canEdit,
}) => {
  const department = cycle.department || cycle.rank_lists[0]?.department;
  const nextAction = (() => {
    if (!canEdit)
      return {
        title: "Review this allocation cycle",
        description:
          `You have read-only access. Open the ${department} list to review candidates and progress.`,
        label: `View ${department} List`,
        action: () => setTab(department),
        icon: Eye,
      };
    if (!progress.candidateCount)
      return {
        title: "Add CTV-ready candidates",
        description:
          `Choose verified ${department} candidates to start scoring.`,
        label: "Add Candidates",
        action: () => openCandidates(cycle.rank_lists[0]),
        icon: UserCheck,
      };
    if (progress.scoredCount < progress.candidateCount) {
      const list = cycle.rank_lists.find((item) =>
        (item.allocations || []).some(
          (allocation) => allocation.final_score === null,
        ),
      );
      return {
        title: "Complete assessment scores",
        description: `${progress.candidateCount - progress.scoredCount} candidate(s) still need assessment scores.`,
        label: `Open ${list?.department || "Rank"} List`,
        action: () => setTab(list?.department || department),
        icon: Pencil,
      };
    }
    if (progress.rankedCount < progress.candidateCount)
      return {
        title: "Complete the rank list",
        description:
          "Ranks are generated after every candidate has a final score.",
        label: `Review ${department} Rank List`,
        action: () => setTab(department),
        icon: ListOrdered,
      };
    if (progress.finalizedCount < progress.activeListCount) {
      const list = cycle.rank_lists.find(
        (item) =>
          (item.allocations || []).length && item.status !== "Finalized",
      );
      return {
        title: "Finalize the rank list",
        description:
          "Review and lock scores and ranks. Vessel assignments remain editable.",
        label: `Finalize ${list?.department || ""} List`,
        action: () => setTab(list?.department || department),
        icon: Lock,
      };
    }
    if (progress.allocatedCount < progress.candidateCount) {
      const list = cycle.rank_lists.find((item) =>
        (item.allocations || []).some(
          (allocation) => !isVesselAllocated(allocation),
        ),
      );
      return {
        title: "Allocate vessels",
        description: `${progress.candidateCount - progress.allocatedCount} candidate(s) need a compatible vessel.`,
        label: `Open ${list?.department || "Rank"} List`,
        action: () => setTab(list?.department || department),
        icon: Ship,
      };
    }
    if (progress.joiningPlanCount < progress.allocatedSlots)
      return {
        title: "Create joining plans",
        description: `${progress.allocatedSlots - progress.joiningPlanCount} allocated vessel assignment(s) need joining details.`,
        label: "Open Joining Plans",
        action: () => setTab("Joining Plan"),
        icon: ClipboardCheck,
      };
    if (progress.intimatedCount < progress.joiningPlanCount)
      return {
        title: "Send joining intimations",
        description: `${progress.joiningPlanCount - progress.intimatedCount} plan(s) still need a successful Email, Phone, or WhatsApp record.`,
        label: "Open Intimation Queue",
        action: () => setTab("Joining Plan"),
        icon: Mail,
      };
    if (progress.onboardedCount < progress.candidateCount)
      return {
        title: "Complete onboarding",
        description: `${progress.candidateCount - progress.onboardedCount} informed candidate(s) need checklist clearance.`,
        label: "Open Onboarding",
        action: openOnboarding,
        icon: ClipboardCheck,
      };
    return {
      title: "Allocation cycle complete",
      description: "Every candidate in this cycle has been onboarded.",
      label: "View Onboarding",
      action: openOnboarding,
      icon: CheckCircle2,
    };
  })();
  const NextIcon = nextAction.icon;
  const cards = [
    ["Candidates", progress.candidateCount, UserCheck],
    [
      "Scored & Ranked",
      `${progress.scoredCount}/${progress.candidateCount}`,
      ListOrdered,
    ],
    [
      "Vessel Allocated",
      `${progress.allocatedCount}/${progress.candidateCount}`,
      Ship,
    ],
    [
      "Onboarded",
      `${progress.onboardedCount}/${progress.candidateCount}`,
      CheckCircle2,
    ],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#3a5f9e]/20 bg-gradient-to-r from-[#3a5f9e]/10 to-[#3a5f9e]/5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#3a5f9e] p-2.5 text-white">
              <NextIcon size={21} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#3a5f9e]">
                Recommended next action
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {nextAction.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {nextAction.description}
              </p>
            </div>
          </div>
          <Button onClick={nextAction.action} className="shrink-0">
            {nextAction.label}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} className="text-[#3a5f9e]" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className={`grid gap-4 ${cycle.rank_lists.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {cycle.rank_lists.map((list) => {
          const allocations = list.allocations || [];
          const scored = allocations.filter(
            (item) => item.final_score !== null,
          ).length;
          const allocated = allocations.filter(isVesselAllocated).length;
          return (
            <article
              key={list.id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    {list.department} Workflow
                  </h2>
                  <p className="text-sm text-slate-500">
                    Assessment scoring · {list.ranking_mode} ranking
                  </p>
                </div>
                <Status status={list.status} />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <Metric label="Candidates" value={allocations.length} />
                <Metric
                  label="Scored"
                  value={`${scored}/${allocations.length}`}
                />
                <Metric
                  label="Allocated"
                  value={`${allocated}/${allocations.length}`}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {canEdit && list.status === "Draft" && (
                  <Button
                    variant="outline"
                    onClick={() => openCandidates(list)}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Candidates
                  </Button>
                )}
                <Button onClick={() => setTab(list.department)}>
                  Continue {list.department}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-slate-500">{label}</p>
    <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
  </div>
);

const ReadinessItem = ({ label, complete, value }) => (
  <div
    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}
  >
    <span className="flex items-center gap-2">
      {complete ? (
        <CheckCircle2 size={15} />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
      )}
      {label}
    </span>
    <strong>{value}</strong>
  </div>
);

const formatAcademicScore = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "—";
};

const AcademicScoreCell = ({ allocation, onView }) => (
  <div className="min-w-36">
    <p className="font-bold text-slate-900">
      {formatAcademicScore(allocation.academic_score)}
    </p>
    <p className="text-[10px] text-slate-500">Profile snapshot used</p>
    <button
      type="button"
      onClick={onView}
      className="mt-1 text-xs font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
    >
      View academic scores
    </button>
  </div>
);

const AcademicScoresModal = ({ allocation, onClose }) => {
  const semesterScores = Array.from({ length: 8 }, (_, index) => ({
    label: `IMU Semester ${index + 1}`,
    value: allocation[`imu_sem_${index + 1}_percentage`],
  }));
  return (
    <Modal
      title={`Previous Academic Scores — ${allocation.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3a5f9e]">
            Academic score used in this allocation
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {formatAcademicScore(allocation.academic_score)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Read-only snapshot taken from the candidate profile when the
            candidate was added to this allocation.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="10th Average"
            value={formatAcademicScore(allocation.tenth_avg_percentage)}
          />
          <Metric
            label="12th PCM Average"
            value={formatAcademicScore(allocation.twelfth_pcm_avg_percentage)}
          />
          <Metric
            label="Current IMU Average"
            value={formatAcademicScore(allocation.profile_academic_score)}
          />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            IMU semester history
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {semesterScores.map((score) => (
              <div
                key={score.label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs text-slate-500">{score.label}</p>
                <p className="mt-1 font-bold text-slate-900">
                  {formatAcademicScore(score.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const RankList = ({
  list,
  assessmentTypes,
  reload,
  openCandidates,
  openVessel,
  openJoiningPlan,
  isSuperAdmin,
  canEdit,
  canFinalizePermission,
}) => {
  const locked = list.status === "Finalized";
  const editable = !locked && canEdit;
  const candidateCount = list.allocations.length;
  const scoredCount = list.allocations.filter(
    (item) => item.final_score !== null,
  ).length;
  const rankedCount = list.allocations.filter(
    (item) => item.current_rank !== null,
  ).length;
  const allocatedCount = list.allocations.filter(isVesselAllocated).length;
  const finalizationIssues = list.allocations
    .map((allocation) => {
      const issues = [];
      if (allocation.final_score === null) issues.push("Final Score incomplete");
      if (!allocation.current_rank) issues.push("Rank unavailable");
      return {
        id: allocation.id,
        candidate: allocation.name_as_in_indos_cert,
        candidateId: allocation.cadet_unique_id,
        issues,
      };
    })
    .filter((item) => item.issues.length);
  const readyToFinalize = candidateCount > 0 && !finalizationIssues.length;
  const formulaLabel =
    list.formula_snapshot?.scoring_method === "AcademicAssessmentAverage"
      ? "Final = (IMU Academic % + Assessment Average %) ÷ 2"
      : `${list.formula_name || "Configured formula"} v${list.formula_version || 1}`;
  const [confirmation, setConfirmation] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rankHistoryAllocation, setRankHistoryAllocation] = useState(null);
  const [assessmentAllocation, setAssessmentAllocation] = useState(null);
  const [academicAllocation, setAcademicAllocation] = useState(null);
  const act = async (action, message, body = {}) => {
    try {
      await api.post(`/allocations/rank-lists/${list.id}/${action}`, body);
      toast.success(message);
      reload();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
      return false;
    }
  };
  const openConfirmation = (config) => {
    setRemarks("");
    setTargetRank(
      config.defaultTargetRank ? String(config.defaultTargetRank) : "",
    );
    setConfirmation(config);
  };
  const closeConfirmation = () => {
    if (!actionLoading) {
      setConfirmation(null);
      setRemarks("");
      setTargetRank("");
    }
  };
  const confirmAction = async () => {
    if (!confirmation || (confirmation.remarksRequired && !remarks.trim()))
      return;
    try {
      setActionLoading(true);
      const completed = await confirmation.action(
        remarks.trim(),
        targetRank ? Number(targetRank) : null,
      );
      if (completed !== false) {
        setConfirmation(null);
        setRemarks("");
        setTargetRank("");
      }
    } finally {
      setActionLoading(false);
    }
  };
  const finalize = () =>
    openConfirmation({
      title: `Finalize ${list.department} Rank List`,
      message: readyToFinalize
        ? "Review scores and ranks before finalizing. Vessel assignments can still be added or changed afterward."
        : "Resolve every blocking item before this Rank List can be finalized.",
      confirmText: "Finalize",
      showFinalizeSummary: true,
      finalizeBlocked: !readyToFinalize,
      showRemarks: true,
      remarksLabel: "Remarks (optional)",
      action: (value) =>
        act("finalize", `${list.department} list finalized`, {
          remarks: value,
        }),
    });
  const unlock = () =>
    openConfirmation({
      title: `Unlock ${list.department} Rank List`,
      message:
        "Unlocking allows allocation changes again and marks sent Joining Plans for review.",
      confirmText: "Unlock",
      showRemarks: true,
      remarksRequired: true,
      remarksLabel: "Reason for unlocking",
      action: (value) =>
        act("unlock", `${list.department} list unlocked`, { remarks: value }),
    });
  const reset = () =>
    openConfirmation({
      title: "Reset Rank Order",
      message: "Ranks will return to automatic Final Score order.",
      confirmText: "Reset Ranks",
      showRemarks: true,
      remarksRequired: true,
      remarksLabel: "Reason for resetting ranks",
      action: (value) => act("reset-ranks", "Ranks reset", { remarks: value }),
    });

  const move = (allocation, direction) => {
    const movingUp = direction === "up";
    const currentRank = Number(allocation.current_rank);
    const rankOptions = list.allocations
      .filter((item) => item.current_rank)
      .map((item) => Number(item.current_rank))
      .filter((rank) => (movingUp ? rank < currentRank : rank > currentRank))
      .sort((left, right) => left - right);
    if (!rankOptions.length) return;
    openConfirmation({
      title: `${movingUp ? "Move Up" : "Move Down"} — ${allocation.name_as_in_indos_cert}`,
      message: `${allocation.name_as_in_indos_cert} is currently ranked #${currentRank}. Select any ${movingUp ? "higher" : "lower"} position; candidates between the two ranks will shift automatically.`,
      confirmText: movingUp ? "Move Up" : "Move Down",
      showRankSelection: true,
      rankDirection: direction,
      rankOptions,
      currentRank,
      defaultTargetRank: movingUp ? currentRank - 1 : currentRank + 1,
      showRemarks: true,
      remarksRequired: true,
      remarksLabel: "Reason for changing rank",
      action: async (value, newRank) => {
        try {
           await api.post(
             `/allocations/candidate-allocations/${allocation.id}/move-rank`,
            { direction, target_rank: newRank, remarks: value },
          );
          toast.success(
            `Rank changed from ${allocation.current_rank} to ${newRank}`,
          );
          reload();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to move rank");
          return false;
        }
      },
    });
  };
  const remove = (allocation) => {
    openConfirmation({
      title: "Remove Candidate",
      message: `Remove ${allocation.name_as_in_indos_cert} from this allocation?`,
      confirmText: "Remove",
      confirmButtonClass: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
      action: async () => {
        try {
          await api.delete(
            `/allocations/candidate-allocations/${allocation.id}`,
          );
          toast.success("Candidate removed");
          reload();
          return true;
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to remove candidate",
          );
          return false;
        }
      },
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{list.department} Rank List</h2>
          <p className="text-sm text-slate-500">
            {formulaLabel} ·{" "}
            <span className="font-semibold">{list.ranking_mode}</span> ranking
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" onClick={openCandidates}>
              <Plus size={16} className="mr-2" />
              Add Candidates
            </Button>
          )}
          {editable && list.ranking_mode === "Manual" && (
            <Button variant="outline" onClick={reset}>
              <RotateCcw size={16} className="mr-2" />
              Reset Score Order
            </Button>
          )}
          {!locked && canFinalizePermission && (
            <Button
              onClick={finalize}
              disabled={!candidateCount}
              title={
                !candidateCount
                  ? "Add candidates before finalizing"
                  : "Review readiness and finalize this rank list"
              }
            >
              <Lock size={16} className="mr-2" />
              Finalize
            </Button>
          )}
          {locked && isSuperAdmin && (
            <Button variant="outline" onClick={unlock}>
              <Unlock size={16} className="mr-2" />
              Unlock
            </Button>
          )}
          <Status status={list.status} />
        </div>
      </div>
      <div
        className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${!editable ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#3a5f9e]/25 bg-[#3a5f9e]/5 text-[#2b4b80]"}`}
      >
        <div
          className={`mt-0.5 rounded-full p-1 ${!editable ? "bg-amber-200" : "bg-[#3a5f9e]/15"}`}
        >
          {!editable ? <Lock size={14} /> : <Pencil size={14} />}
        </div>
        <div>
          <p className="font-semibold">
            {locked ? "Ranks and assessment scores are locked." : `Assessment scores are ${editable ? "editable" : "read-only"}.`}
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            {locked
              ? `This ${list.department} Rank List is Finalized. ${canEdit ? "You can allocate or change vessels until onboarding is complete. " : ""}A Super Admin can unlock ranks and scores with a reason.`
              : canEdit
                ? "This Rank List is Draft. Saving assessment scores recalculates the Final Score and automatic rank immediately."
                : "You have view-only access to this Draft Rank List."}
          </p>
        </div>
      </div>
      {!locked && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4">
          <ReadinessItem
            label="Candidates"
            complete={candidateCount > 0}
            value={candidateCount}
          />
          <ReadinessItem
            label="Scores complete"
            complete={candidateCount > 0 && scoredCount === candidateCount}
            value={`${scoredCount}/${candidateCount}`}
          />
          <ReadinessItem
            label="Ranks ready"
            complete={candidateCount > 0 && rankedCount === candidateCount}
            value={`${rankedCount}/${candidateCount}`}
          />
          <ReadinessItem
            label="Vessels allocated"
            complete={candidateCount > 0 && allocatedCount === candidateCount}
            value={`${allocatedCount}/${candidateCount}`}
          />
        </div>
      )}
      <div className="max-h-[65vh] overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[1900px] w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              <Th>Rank</Th>
              <Th>Candidate</Th>
              <Th>Institute</Th>
              <Th>Academic Score</Th>
              <Th>Assessment</Th>
              <Th>
                Final Score
                <span className="block text-[10px] font-normal">
                  Out of 100
                </span>
              </Th>
              <Th>Vessel Type Allocation</Th>
              <Th>CTV Vessel Allocation</Th>
              <Th>Secondary Vessel Allocation</Th>
              <Th>Rank Change Remarks</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {list.allocations.map((allocation) => (
              <tr key={allocation.id} className="border-t align-top hover:bg-[#3a5f9e]/[0.025]">
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="min-w-7 rounded bg-[#3a5f9e]/10 px-2 py-1 text-center font-bold text-[#3a5f9e]">
                      {allocation.current_rank || "—"}
                    </span>
                    {editable && allocation.current_rank && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${allocation.name_as_in_indos_cert} up`}
                          title={
                            Number(allocation.current_rank) <= 1
                              ? "This candidate is already first"
                              : "Move to any higher rank"
                          }
                          disabled={Number(allocation.current_rank) <= 1}
                          onClick={() => move(allocation, "up")}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a5f9e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronUp size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${allocation.name_as_in_indos_cert} down`}
                          title={
                            Number(allocation.current_rank) >= rankedCount
                              ? "This candidate is already last"
                              : "Move to any lower rank"
                          }
                          disabled={Number(allocation.current_rank) >= rankedCount}
                          onClick={() => move(allocation, "down")}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a5f9e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronDown size={16} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </Td>
                <Td>
                  <p className="font-semibold text-slate-900">
                    {allocation.name_as_in_indos_cert}
                  </p>
                  <p className="text-xs text-slate-500">
                    {allocation.cadet_unique_id}
                  </p>
                </Td>
                <Td>{allocation.institute_name || "—"}</Td>
                <Td>
                  <AcademicScoreCell
                    allocation={allocation}
                    onView={() => setAcademicAllocation(allocation)}
                  />
                </Td>
                <Td>
                  <AssessmentCell
                    allocation={allocation}
                    locked={!editable}
                    lockReason={locked ? "Finalized" : "Read-only access"}
                    onEdit={() => setAssessmentAllocation(allocation)}
                  />
                </Td>
                <Td>
                  <span
                    className={`rounded-full px-2.5 py-1 font-bold ${allocation.final_score === null ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {allocation.final_score === null
                      ? "Incomplete"
                      : Number(allocation.final_score).toFixed(2)}
                  </span>
                </Td>
                <Td>
                  <div className="min-w-40 space-y-1">
                    <p>
                      <span className="text-xs text-slate-500">Primary:</span>{" "}
                      <strong>
                        {allocation.vessel_type_name || "Not selected"}
                      </strong>
                    </p>
                    <p>
                      <span className="text-xs text-slate-500">Secondary:</span>{" "}
                      <strong>
                        {allocation.secondary_vessel_type_name ||
                          "Not selected"}
                      </strong>
                    </p>
                  </div>
                </Td>
                <Td>
                  <VesselAssignmentCell
                    allocation={allocation}
                    role="Primary"
                    department={list.department}
                    locked={!canEdit || allocation.onboarding_status === "Onboarded"}
                    canCreateJoiningPlan={locked && canEdit && allocation.onboarding_status !== "Onboarded"}
                    openVessel={openVessel}
                    openJoiningPlan={openJoiningPlan}
                  />
                </Td>
                <Td>
                  <VesselAssignmentCell
                    allocation={allocation}
                    role="Secondary"
                    department={list.department}
                    locked={!canEdit || allocation.onboarding_status === "Onboarded"}
                    canCreateJoiningPlan={locked && canEdit && allocation.onboarding_status !== "Onboarded"}
                    openVessel={openVessel}
                    openJoiningPlan={openJoiningPlan}
                  />
                </Td>
                <Td>
                  <RankHistorySummary
                    allocation={allocation}
                    onView={() => setRankHistoryAllocation(allocation)}
                  />
                </Td>
                <Td>
                  <Status status={list.status} />
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <button
                      className="rounded p-1.5 text-[#3a5f9e] hover:bg-[#3a5f9e]/10"
                      title="View candidate"
                      onClick={() =>
                        window.open(
                          `/cadets/view/${allocation.cadet_id}`,
                          "_blank",
                        )
                      }
                    >
                      <Eye size={16} />
                    </button>
                    {editable && (
                      <button
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        title="Remove candidate"
                        onClick={() => remove(allocation)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
            {!list.allocations.length && (
              <tr>
                <td colSpan={12} className="p-10 text-center text-slate-500">
                  No candidates added to this list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AdminRemarksHistory list={list} />
      <ConfirmationModal
        isOpen={Boolean(confirmation)}
        onClose={closeConfirmation}
        onConfirm={confirmAction}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmText={confirmation?.confirmText}
        confirmButtonClass={confirmation?.confirmButtonClass}
        isLoading={actionLoading}
        maxWidthClass={
          confirmation?.showFinalizeSummary ? "max-w-2xl" : "max-w-md"
        }
        confirmDisabled={
          (confirmation?.remarksRequired && !remarks.trim()) ||
          confirmation?.finalizeBlocked ||
          (confirmation?.showRankSelection &&
            (!targetRank || Number(targetRank) === confirmation.currentRank))
        }
      >
        {confirmation?.showFinalizeSummary && (
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Scores", scoredCount, candidateCount],
                ["Ranks", rankedCount, candidateCount],
              ].map(([label, complete, total]) => {
                const ready = total > 0 && complete === total;
                return (
                  <div
                    key={label}
                    className={`rounded-lg border p-3 text-center ${ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                  >
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p
                      className={`mt-1 font-bold ${ready ? "text-emerald-700" : "text-amber-700"}`}
                    >
                      {complete}/{total}
                    </p>
                  </div>
                );
              })}
            </div>
            {finalizationIssues.length ? (
              <div className="max-h-44 overflow-auto rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">
                  Blocking items ({finalizationIssues.length})
                </p>
                <ul className="mt-2 space-y-2 text-xs text-amber-900">
                  {finalizationIssues.map((item) => (
                    <li key={item.id}>
                      <strong>{item.candidate}</strong> ({item.candidateId}):{" "}
                      {item.issues.join(" · ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> All candidates are ready. Finalizing
                locks scores, ranks and candidate membership. Vessel assignments remain editable.
              </div>
            )}
            <p className="text-xs text-slate-500">
              Vessels can be allocated before or after finalizing. Vessel compatibility
              and seat availability are checked whenever an assignment is saved.
            </p>
          </div>
        )}
        {confirmation?.showRankSelection && (
          <label className="mb-4 block text-sm font-medium text-slate-700">
            {confirmation.rankDirection === "up"
              ? "Move up to rank"
              : confirmation.rankDirection === "down"
                ? "Move down to rank"
                : "Move to rank"}
            <Select
              value={targetRank || "no-target-rank"}
              onValueChange={(value) =>
                setTargetRank(value === "no-target-rank" ? "" : value)
              }
            >
              <SelectTrigger
                className={`${brandedSelectTriggerClass} mt-1`}
                aria-label="Move candidate to rank"
              >
                <SelectValue />
              </SelectTrigger>
              <BrandedSelectContent>
                <BrandedSelectItem value="no-target-rank">
                  Select target rank
                </BrandedSelectItem>
              {confirmation.rankOptions
                ?.filter((rank) => rank !== confirmation.currentRank)
                .map((rank) => (
                  <BrandedSelectItem key={rank} value={String(rank)}>
                    Rank {rank}
                  </BrandedSelectItem>
                ))}
              </BrandedSelectContent>
            </Select>
            {targetRank &&
              Number(targetRank) !== confirmation.currentRank && (
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 px-3 py-2 text-xs text-[#2b4b80]">
                  <strong>Rank {confirmation.currentRank}</strong>
                  <ArrowRight size={14} />
                  <strong>Rank {targetRank}</strong>
                  <span>
                    · {Math.abs(confirmation.currentRank - Number(targetRank))}{" "}
                    other candidate(s) will shift
                  </span>
                </span>
              )}
          </label>
        )}
        {confirmation?.showRemarks && (
          <label className="block text-sm font-medium text-slate-700">
            {confirmation.remarksLabel}
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-[#3a5f9e] focus:ring-2 focus:ring-[#3a5f9e]/20"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder={
                confirmation.remarksRequired ? "Required" : "Optional"
              }
            />
          </label>
        )}
      </ConfirmationModal>
      {rankHistoryAllocation && (
        <RankHistoryModal
          allocation={rankHistoryAllocation}
          onClose={() => setRankHistoryAllocation(null)}
        />
      )}
      {academicAllocation && (
        <AcademicScoresModal
          allocation={academicAllocation}
          onClose={() => setAcademicAllocation(null)}
        />
      )}
      {assessmentAllocation && (
        <AssessmentScoreModal
          allocation={assessmentAllocation}
          assessmentTypes={assessmentTypes}
          onClose={() => setAssessmentAllocation(null)}
          onSaved={() => {
            setAssessmentAllocation(null);
            reload();
          }}
        />
      )}
    </div>
  );
};

const AssessmentCell = ({ allocation, locked, lockReason, onEdit }) => {
  const scores = (allocation.scores || []).filter(
    (item) => item.score !== null && item.score !== "",
  );

  return (
    <div className="min-w-56 space-y-2">
      {scores.length ? (
        <div className="space-y-1.5">
          {scores.map((item) => (
            <div
              key={item.id || item.course_id}
              className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-2.5 py-1.5"
            >
              <span className="text-xs font-medium text-slate-700">
                {item.course_name_snapshot}
              </span>
              <span className="whitespace-nowrap text-xs font-bold text-[#3a5f9e]">
                {Number(item.score).toFixed(2)} / 100
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">No assessment selected</p>
      )}
      {!locked && (
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          {scores.length ? (
            <Pencil size={14} className="mr-1.5" />
          ) : (
            <Plus size={14} className="mr-1.5" />
          )}
          {scores.length ? "Edit Assessment" : "Add Assessment"}
        </Button>
      )}
      {locked && (
        <p className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
          <Lock size={11} />
          Read-only · {lockReason || "Locked"}
        </p>
      )}
    </div>
  );
};

const AssessmentScoreModal = ({
  allocation,
  assessmentTypes,
  onClose,
  onSaved,
}) => {
  const existingScores = (allocation.scores || []).filter(
    (item) => item.score !== null && item.score !== "",
  );
  const [rows, setRows] = useState(
    existingScores.length
      ? existingScores.map((item) => ({
          course_id: item.course_id,
          score: String(item.score),
        }))
      : [{ course_id: "", score: "" }],
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const choices = [...assessmentTypes];
  existingScores.forEach((score) => {
    if (!choices.some((item) => item.id === score.course_id)) {
      choices.push({
        id: score.course_id,
        name: score.course_name_snapshot,
        status: "Inactive",
      });
    }
  });

  const selectedIds = new Set(rows.map((row) => row.course_id).filter(Boolean));
  const hasUnusedAssessment =
    rows.every((row) => row.course_id) &&
    choices.some((choice) => !selectedIds.has(choice.id));
  const validScoreValues = rows
    .filter((row) => row.course_id && row.score !== "")
    .map((row) => Number(row.score))
    .filter((score) => Number.isFinite(score) && score >= 0 && score <= 100);
  const hasCompletePreview =
    rows.length > 0 && validScoreValues.length === rows.length;
  const assessmentAverage = hasCompletePreview
    ? validScoreValues.reduce((total, score) => total + score, 0) /
      validScoreValues.length
    : null;
  const academicScore = Number(allocation.academic_score);
  const finalScorePreview =
    assessmentAverage !== null && Number.isFinite(academicScore)
      ? (academicScore + assessmentAverage) / 2
      : null;

  const updateRow = (index, field, value) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setErrors((current) => ({
      ...current,
      form: "",
      [`${index}.${field}`]: "",
    }));
  };

  const addRow = () => {
    setRows((current) => [...current, { course_id: "", score: "" }]);
    setErrors((current) => ({ ...current, form: "" }));
  };

  const removeRow = (index) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setErrors({});
  };

  const save = async () => {
    const nextErrors = {};
    if (!rows.length)
      nextErrors.form = "Add at least one Assessment Type for this cadet.";

    const usedCourses = new Set();
    rows.forEach((row, index) => {
      if (!row.course_id) {
        nextErrors[`${index}.course_id`] = "Select an Assessment Type.";
      } else if (usedCourses.has(row.course_id)) {
        nextErrors[`${index}.course_id`] =
          "This Assessment Type is already selected.";
      } else {
        usedCourses.add(row.course_id);
      }

      const score = row.score === "" ? null : Number(row.score);
      if (score === null) {
        nextErrors[`${index}.score`] = "Enter the score.";
      } else if (!Number.isFinite(score) || score < 0 || score > 100) {
        nextErrors[`${index}.score`] = "Score must be between 0 and 100.";
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      await api.put(
        `/allocations/candidate-allocations/${allocation.id}/scores`,
        {
          scores: rows.map((row) => ({
            course_id: row.course_id,
            score: Number(row.score),
          })),
        },
      );
      toast.success("Cadet assessment saved");
      onSaved();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save cadet assessment",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen
      onClose={onClose}
      onConfirm={save}
      title={`Assessment — ${allocation.name_as_in_indos_cert}`}
      message="Select only the Assessment Types required for this cadet. Every score is out of 100."
      confirmText="Save Assessment"
      isLoading={saving}
      confirmDisabled={!rows.length}
      maxWidthClass="max-w-2xl"
    >
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 px-3 py-2 text-xs text-[#2b4b80]">
        <Pencil size={14} />
        <strong>Rank List Status: Draft</strong>
        <span>
          · Assessment scores are editable and saving recalculates the final
          score.
        </span>
      </div>
      <div className="mb-4 rounded-xl border border-[#3a5f9e]/15 bg-[#3a5f9e]/5 p-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Academic Score
            </p>
            <p className="mt-1 font-bold text-slate-900">
              {Number.isFinite(academicScore) ? academicScore.toFixed(2) : "—"}%
            </p>
          </div>
          <div className="border-x border-[#3a5f9e]/15 px-2">
            <p className="text-[11px] font-medium text-slate-500">
              Assessment Average
            </p>
            <p className="mt-1 font-bold text-[#3a5f9e]">
              {assessmentAverage === null ? "—" : assessmentAverage.toFixed(2)}{" "}
              / 100
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Final Score
            </p>
            <p className="mt-1 font-bold text-emerald-700">
              {finalScorePreview === null ? "—" : finalScorePreview.toFixed(2)}{" "}
              / 100
            </p>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Formula: Final Score = (Profile IMU Academic % + Assessment
          Average %) ÷ 2
        </p>
      </div>
      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {rows.map((row, index) => {
          const rowChoices = choices.filter(
            (choice) =>
              choice.id === row.course_id || !selectedIds.has(choice.id),
          );
          return (
            <div
              key={`${row.course_id || "new"}-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_40px] sm:items-start">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Assessment Type
                  </label>
                  <Select
                    value={row.course_id}
                    onValueChange={(value) =>
                      updateRow(index, "course_id", value)
                    }
                  >
                    <SelectTrigger
                      className="mt-1 bg-white"
                      invalid={Boolean(errors[`${index}.course_id`])}
                    >
                      <SelectValue placeholder="Select Assessment Type" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-white">
                      {rowChoices.map((choice) => (
                        <SelectItem key={choice.id} value={choice.id}>
                          {choice.name}
                          {choice.status === "Inactive" ? " (Inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[`${index}.course_id`] && (
                    <FieldError>{errors[`${index}.course_id`]}</FieldError>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Score (Out of 100)
                  </label>
                  <Input
                    className="mt-1 bg-white"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={row.score}
                    invalid={Boolean(errors[`${index}.score`])}
                    onChange={(event) =>
                      updateRow(index, "score", event.target.value)
                    }
                    placeholder="0-100"
                  />
                  {errors[`${index}.score`] && (
                    <FieldError>{errors[`${index}.score`]}</FieldError>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-5 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeRow(index)}
                  title="Remove Assessment Type"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          );
        })}
        {!rows.length && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
            No Assessment Type selected.
          </div>
        )}
      </div>
      {errors.form && <FieldError>{errors.form}</FieldError>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={addRow}
        disabled={!hasUnusedAssessment}
      >
        <Plus size={14} className="mr-1.5" />
        Add Another Assessment
      </Button>
      {!choices.length && (
        <p className="mt-2 text-xs text-red-600">
          No active Assessment Types are available. Add one in Assessment Type
          Master first.
        </p>
      )}
    </ConfirmationModal>
  );
};

const VesselAssignmentCell = ({
  allocation,
  role,
  department,
  locked,
  canCreateJoiningPlan,
  openVessel,
  openJoiningPlan,
}) => {
  const secondary = role === "Secondary";
  const vesselName = secondary
    ? allocation.secondary_vessel_name
    : allocation.vessel_name;
  const status = secondary
    ? allocation.secondary_allocation_status
    : allocation.allocation_status;
  const planId = secondary
    ? allocation.secondary_joining_plan_id
    : allocation.primary_joining_plan_id;
  const planStatus = secondary
    ? allocation.secondary_joining_plan_status
    : allocation.primary_joining_plan_status;
  const planRequiresRefresh = Number(secondary
    ? allocation.secondary_joining_plan_requires_refresh
    : allocation.primary_joining_plan_requires_refresh);
  const colorClass =
    "border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10";

  return (
    <div className="min-w-48 space-y-2">
      <div>
        <p className="font-semibold text-slate-900">
          {vesselName || "No vessel selected"}
        </p>
        <Status status={status} />
      </div>
      <button
        type="button"
        onClick={() => openVessel({ allocation, role, readOnly: locked })}
        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${colorClass}`}
      >
        <Anchor size={14} />
        {locked
          ? "View Details"
          : vesselName
            ? `Change ${role}`
            : `Allocate ${role}`}
      </button>
      {canCreateJoiningPlan && status === "Allocated" && (!planId || planRequiresRefresh) && (
        <button
          type="button"
          onClick={() =>
            openJoiningPlan({ ...allocation, vesselRole: role, department, refreshJoiningPlan: Boolean(planRequiresRefresh) })
          }
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${colorClass}`}
        >
          <Mail size={14} />
          {planRequiresRefresh ? "Update Joining Plan" : "Create Joining Plan"}
        </button>
      )}
      {planId && (
        <div className="text-xs text-slate-500">
          Joining Plan: <Status status={planStatus || "Draft"} />
        </div>
      )}
    </div>
  );
};

const AdminRemarksHistory = ({ list }) => {
  const history = list.admin_remarks_history || [];
  const actions = {
    Finalize: { label: "Finalized", icon: Lock, color: "bg-emerald-100 text-emerald-700" },
    Unlock: { label: "Unlocked", icon: Unlock, color: "bg-amber-100 text-amber-700" },
    Reset: { label: "Ranks reset", icon: RotateCcw, color: "bg-slate-100 text-slate-700" },
  };

  return (
    <section aria-label={`${list.department} admin remarks`} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="font-semibold text-slate-900">Admin Remarks</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {list.department} rank list finalize, unlock and reset history. Latest first.
        </p>
      </div>
      {history.length ? (
        <ol className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
          {history.map((event) => {
            const action = actions[event.action];
            const Icon = action?.icon || MessageCircle;
            return (
              <li key={event.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${action?.color || "bg-slate-100 text-slate-700"}`}>
                    <Icon size={12} aria-hidden="true" />
                    {action?.label || event.action}
                  </span>
                  <span className="break-words text-xs font-medium text-slate-700">
                    {getRankHistoryAdmin(event)}
                  </span>
                  <time className="text-xs text-slate-500" dateTime={event.created_at || undefined}>
                    {formatRankHistoryDate(event.created_at)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {event.remarks || "No remarks added."}
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="px-4 py-3 text-sm text-slate-500">
          Remarks will appear here when this rank list is finalized, unlocked or reset.
        </p>
      )}
    </section>
  );
};

const RankHistorySummary = ({ allocation, onView }) => {
  const history = allocation.rank_history || [];
  const latest = history[0];
  if (!latest) return <span className="text-slate-400">—</span>;

  return (
    <div className="w-64 space-y-1.5">
      <p className="truncate font-medium text-slate-800" title={latest.remarks}>
        {latest.remarks}
      </p>
      <p
        className="truncate text-xs text-slate-500"
        title={getRankHistoryAdmin(latest)}
      >
        {getRankHistoryAdmin(latest)} ·{" "}
        {formatRankHistoryDate(latest.created_at)}
      </p>
      <button
        type="button"
        onClick={onView}
        className="text-xs font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
      >
        View all ({history.length})
      </button>
    </div>
  );
};

const RankHistoryModal = ({ allocation, onClose }) => {
  const history = allocation.rank_history || [];
  return (
    <Modal
      title={`Rank Change History — ${allocation.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">
          {allocation.cadet_unique_id}
        </span>{" "}
        · {history.length} rank change{history.length === 1 ? "" : "s"}
      </div>
      <ol className="space-y-3">
        {history.map((event) => {
          const movedUp = event.action === "MoveUp";
          return (
            <li
              key={event.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${movedUp ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {movedUp ? "Move Up" : "Move Down"}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Rank {event.from_rank} → Rank {event.to_rank}
                  </span>
                </div>
                <time
                  className="text-xs text-slate-500"
                  dateTime={event.created_at || undefined}
                >
                  {formatRankHistoryDate(event.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">
                {event.remarks}
              </p>
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Changed by:
                </span>{" "}
                {getRankHistoryAdmin(event)}
                {event.changed_by_name && event.changed_by_email ? (
                  <span> · {event.changed_by_email}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
};

const candidatePageSize = 20;
const brandedSelectTriggerClass =
  "h-9 border-slate-300 bg-white text-slate-700 focus:border-[#3a5f9e] focus:ring-[#3a5f9e]/20";
const BrandedSelectContent = ({ children }) => (
  <SelectContent className="z-[100] border-[#3a5f9e]/20 bg-white shadow-xl">
    {children}
  </SelectContent>
);
const BrandedSelectItem = ({ value, children }) => (
  <SelectItem
    value={value}
    className="focus:bg-[#3a5f9e]/10 focus:text-[#3a5f9e] data-[state=checked]:font-semibold data-[state=checked]:text-[#3a5f9e]"
  >
    {children}
  </SelectItem>
);

const CandidatePicker = ({
  list: activeList,
  assessmentTypes,
  vesselTypes,
  onClose,
  onSaved,
}) => {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [candidateById, setCandidateById] = useState({});
  const [scoresByCandidate, setScoresByCandidate] = useState({});
  const [vesselTypeByCandidate, setVesselTypeByCandidate] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [institute, setInstitute] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    total: 0,
    total_pages: 1,
    batches: [],
    institutes: [],
  });
  const [quickView, setQuickView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await api.get(
        `/allocations/rank-lists/${activeList.id}/eligible-candidates`,
        {
          params: {
            search: debouncedSearch || undefined,
            batch_year: batch || undefined,
            institute_id: institute || undefined,
            eligibility: "eligible",
            page,
            limit: candidatePageSize,
          },
        },
      );
      const candidates = response.data.data || [];
      setRows(candidates);
      setCandidateById((current) => ({
        ...current,
        ...Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate])),
      }));
      const responseMeta = response.data.meta || {};
      setMeta((current) => ({ ...current, ...responseMeta }));
      if (responseMeta.page && responseMeta.page !== page) {
        setPage(responseMeta.page);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load candidates";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [activeList.id, batch, debouncedSearch, institute, page]);

  useEffect(() => {
    load();
  }, [load]);

  const compatibleTypes = vesselTypes.filter(
    (item) =>
      item.status === "Active" &&
      isDepartmentCompatible(item.department, activeList.department),
  );
  const selectedSet = new Set(selected);

  const toggleCandidate = (row, checked) => {
    setSelected((current) =>
      checked
        ? [...new Set([...current, row.id])]
        : current.filter((candidateId) => candidateId !== row.id),
    );
  };

  const updateCandidateScore = (candidateId, scoreIndex, field, value) => {
    setScoresByCandidate((current) => ({
      ...current,
      [candidateId]: (current[candidateId] || []).map((score, index) =>
        index === scoreIndex ? { ...score, [field]: value } : score,
      ),
    }));
  };

  const addCandidateScore = (candidateId) => {
    setScoresByCandidate((current) => ({
      ...current,
      [candidateId]: [
        ...(current[candidateId] || []),
        { course_id: "", score: "" },
      ],
    }));
  };

  const removeCandidateScore = (candidateId, scoreIndex) => {
    setScoresByCandidate((current) => ({
      ...current,
      [candidateId]: (current[candidateId] || []).filter(
        (_, index) => index !== scoreIndex,
      ),
    }));
  };

  const getPreviewScore = (candidate) => {
    const scores = scoresByCandidate[candidate.id] || [];
    if (
      !scores.length ||
      scores.some((item) => item.score === "" || !item.course_id)
    ) {
      return null;
    }
    const values = scores.map((item) => Number(item.score));
    if (
      values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)
    ) {
      return null;
    }
    const assessmentPercentage =
      values.reduce((total, value) => total + value, 0) / values.length;
    return (Number(candidate.academic_score) + assessmentPercentage) / 2;
  };

  const provisionalRanks = (() => {
    const rankedCandidates = [
      ...(activeList.allocations || [])
        .filter((allocation) => allocation.final_score !== null)
        .map((allocation) => ({
          key: `existing-${allocation.id}`,
          candidateId: allocation.cadet_unique_id,
          finalScore: Number(allocation.final_score),
          academicScore: Number(allocation.academic_score),
        })),
      ...selected
        .map((candidateId) => candidateById[candidateId])
        .filter(Boolean)
        .map((candidate) => ({
          key: `candidate-${candidate.id}`,
          candidateId: candidate.cadet_unique_id,
          finalScore: getPreviewScore(candidate),
          academicScore: Number(candidate.academic_score),
        }))
        .filter((candidate) => candidate.finalScore !== null),
    ].sort(
      (left, right) =>
        right.finalScore - left.finalScore ||
        right.academicScore - left.academicScore ||
        String(left.candidateId).localeCompare(String(right.candidateId)),
    );
    return new Map(
      rankedCandidates.map((candidate, index) => [candidate.key, index + 1]),
    );
  })();

  const hasInvalidScores = selected.some((candidateId) => {
    const scores = scoresByCandidate[candidateId] || [];
    const courseIds = scores.map((score) => score.course_id);
    return (
      scores.some(
        (score) =>
          !score.course_id ||
          score.score === "" ||
          !Number.isFinite(Number(score.score)) ||
          Number(score.score) < 0 ||
          Number(score.score) > 100,
      ) || new Set(courseIds).size !== courseIds.length
    );
  });

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setBatch("");
    setInstitute("");
    setPage(1);
  };

  const add = async () => {
    try {
      setSaving(true);
      await api.post(`/allocations/rank-lists/${activeList.id}/candidates`, {
        candidates: selected.map((cadetId) => ({
          cadet_id: cadetId,
          scores: scoresByCandidate[cadetId] || [],
          vessel_type_id: vesselTypeByCandidate[cadetId] || null,
        })),
      });
      toast.success(
        `${selected.length} candidate${selected.length === 1 ? "" : "s"} added to ${activeList.department}. Continue to Score Entry when ready.`,
      );
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add candidates");
    } finally {
      setSaving(false);
    }
  };

  const firstResult = meta.total ? (meta.page - 1) * candidatePageSize + 1 : 0;
  const lastResult = Math.min(meta.page * candidatePageSize, meta.total);

  return (
    <>
      <Modal
        title={`Select ${activeList.department} Candidates`}
        onClose={() => {
          if (!saving) onClose();
        }}
        width="h-[92vh] max-w-[96vw]"
        bodyClassName="flex min-h-0 flex-col overflow-auto xl:overflow-hidden"
      >
        <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#3a5f9e]">
              Step 1 of 5 · Candidate selection
            </p>
            <p className="mt-1 text-sm text-[#2b4b80]">
              Choose document-approved cadets. Scores can be entered now or later.
              Set Vessel Type on each cadet row.
            </p>
            {hasInvalidScores && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                Complete or remove every started course-score row before adding.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-lg border border-[#3a5f9e]/20 bg-white px-4 py-2 text-sm font-bold text-[#3a5f9e]">
              {activeList.department} candidates
            </span>
            {selected.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
                disabled={saving}
                onClick={() => {
                  setSelected([]);
                  setScoresByCandidate({});
                  setVesselTypeByCandidate({});
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 flex shrink-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-3">
            <Field label="Search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClass} w-full pl-9`}
                  placeholder="Candidate ID or name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </Field>
            <Field label="Batch / Year">
              <Select
                value={batch || "all-batches"}
                onValueChange={(value) => {
                  setBatch(value === "all-batches" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className={brandedSelectTriggerClass}
                  aria-label="Filter by batch or year"
                >
                  <SelectValue />
                </SelectTrigger>
                <BrandedSelectContent>
                  <BrandedSelectItem value="all-batches">
                    All batches/years
                  </BrandedSelectItem>
                {(meta.batches || []).map((value) => (
                  <BrandedSelectItem key={value} value={String(value)}>
                    {value}
                  </BrandedSelectItem>
                ))}
                </BrandedSelectContent>
              </Select>
            </Field>
            <Field label="Institute">
              <Select
                value={institute || "all-institutes"}
                onValueChange={(value) => {
                  setInstitute(value === "all-institutes" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className={brandedSelectTriggerClass}
                  aria-label="Filter by institute"
                >
                  <SelectValue />
                </SelectTrigger>
                <BrandedSelectContent>
                  <BrandedSelectItem value="all-institutes">
                    All institutes
                  </BrandedSelectItem>
                {(meta.institutes || []).map((item) => (
                  <BrandedSelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </BrandedSelectItem>
                ))}
                </BrandedSelectContent>
              </Select>
            </Field>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>

        <div className="min-h-[340px] shrink-0 flex-1 overflow-auto rounded-xl border border-slate-200 xl:min-h-0 xl:shrink [&_tbody_td]:!py-2">
          <table className="w-full min-w-[1730px] table-fixed text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr>
                <Th className="w-12">
                  <span className="sr-only">Select candidate</span>
                </Th>
                <Th className="w-[135px]">Candidate ID</Th>
                <Th className="w-[190px]">Name</Th>
                <Th className="w-[170px]">Institute</Th>
                <Th className="w-[130px]">
                  Academic Score
                  <span className="block text-[10px] font-normal">
                    Read-only · /100
                  </span>
                </Th>
                <Th className="w-[360px]">Assessment Score per Course</Th>
                <Th className="w-[115px]">
                  Final Score
                  <span className="block text-[10px] font-normal">Auto</span>
                </Th>
                <Th className="w-[120px]">
                  Current Rank
                  <span className="block text-[10px] font-normal">Auto</span>
                </Th>
                <Th className="w-[190px]">Vessel Type</Th>
                <Th className="w-[145px]">Allocation Status</Th>
                <Th className="w-[130px]">Action</Th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="border-t">
                    <td colSpan={11} className="px-4 py-3">
                      <div className="h-8 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}
              {!loading &&
                rows.map((row) => {
                  const isSelected = selectedSet.has(row.id);
                  const draftScores = scoresByCandidate[row.id] || [];
                  const previewScore = getPreviewScore(row);
                  const previewRank = provisionalRanks.get(
                    `candidate-${row.id}`,
                  );
                  return (
                    <tr
                      key={row.id}
                      className={`group border-t align-top ${isSelected ? "bg-[#3a5f9e]/5" : "hover:bg-[#3a5f9e]/[0.03]"}`}
                    >
                      <Td className="w-12">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.name_as_in_indos_cert}`}
                          disabled={!row.eligible || saving}
                          checked={isSelected}
                          onChange={(event) =>
                            toggleCandidate(row, event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#3a5f9e] focus:ring-[#3a5f9e]/30"
                        />
                      </Td>
                      <Td className="break-words font-mono text-xs">
                        {row.cadet_unique_id}
                      </Td>
                      <Td>
                        <p className="font-semibold text-slate-900">
                          {row.name_as_in_indos_cert}
                        </p>
                        {!row.eligible && (
                          <p className="mt-1 text-xs font-medium text-amber-800">
                            {row.ineligible_reasons.join(" · ")}
                          </p>
                        )}
                      </Td>
                      <Td>{row.institute_name || "—"}</Td>
                      <Td>
                        <span className="font-bold text-slate-900">
                          {formatAcademicScore(row.academic_score)}
                        </span>
                      </Td>
                      <Td>
                        <div className="min-w-[330px] space-y-2">
                          {isSelected ? (
                            <>
                              {draftScores.map((score, scoreIndex) => {
                                const usedCourseIds = new Set(
                                  draftScores
                                    .filter((_, index) => index !== scoreIndex)
                                    .map((item) => item.course_id),
                                );
                                const invalidScore =
                                  score.score !== "" &&
                                  (!Number.isFinite(Number(score.score)) ||
                                    Number(score.score) < 0 ||
                                    Number(score.score) > 100);
                                return (
                                  <div
                                    key={scoreIndex}
                                    className="grid grid-cols-[minmax(170px,1fr)_90px_30px] gap-1.5"
                                  >
                                    <Select
                                      disabled={saving}
                                      value={score.course_id || "no-course"}
                                      onValueChange={(value) =>
                                        updateCandidateScore(
                                          row.id,
                                          scoreIndex,
                                          "course_id",
                                          value === "no-course" ? "" : value,
                                        )
                                      }
                                    >
                                      <SelectTrigger
                                        aria-label={`Assessment course ${scoreIndex + 1} for ${row.name_as_in_indos_cert}`}
                                        invalid={!score.course_id}
                                        className={`${brandedSelectTriggerClass} w-full`}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <BrandedSelectContent>
                                        <BrandedSelectItem value="no-course">
                                          Select course
                                        </BrandedSelectItem>
                                      {assessmentTypes
                                        .filter(
                                          (course) =>
                                            course.status === "Active" &&
                                            !usedCourseIds.has(course.id),
                                        )
                                        .map((course) => (
                                          <BrandedSelectItem
                                            key={course.id}
                                            value={String(course.id)}
                                          >
                                            {course.name}
                                          </BrandedSelectItem>
                                        ))}
                                      </BrandedSelectContent>
                                    </Select>
                                    <input
                                      aria-label={`Assessment score ${scoreIndex + 1} for ${row.name_as_in_indos_cert}`}
                                      className={`${inputClass} w-full ${invalidScore ? "border-red-500" : ""}`}
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      placeholder="0–100"
                                      disabled={saving}
                                      value={score.score}
                                      onChange={(event) =>
                                        updateCandidateScore(
                                          row.id,
                                          scoreIndex,
                                          "score",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      aria-label={`Remove assessment course ${scoreIndex + 1}`}
                                      className="rounded text-red-600 hover:bg-red-50"
                                      disabled={saving}
                                      onClick={() =>
                                        removeCandidateScore(row.id, scoreIndex)
                                      }
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                disabled={
                                  saving ||
                                  draftScores.length >=
                                    assessmentTypes.filter(
                                      (course) => course.status === "Active",
                                    ).length
                                }
                                className="text-xs font-bold text-[#3a5f9e] hover:text-[#325186] hover:underline disabled:text-slate-400"
                                onClick={() => addCandidateScore(row.id)}
                              >
                                + Add course score
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Select candidate to enter course scores
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {previewScore === null ? (
                          <span className="text-xs font-semibold text-slate-400">
                            Not scored
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-700">
                            {previewScore.toFixed(2)}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <span
                          className={`font-bold ${previewRank ? "text-[#3a5f9e]" : "text-slate-400"}`}
                        >
                          {previewRank ? `#${previewRank}` : "Not ranked"}
                        </span>
                      </Td>
                      <Td>
                        <Select
                          disabled={!isSelected || saving}
                          value={
                            vesselTypeByCandidate[row.id] || "choose-later"
                          }
                          onValueChange={(value) =>
                            setVesselTypeByCandidate((current) => ({
                              ...current,
                              [row.id]: value === "choose-later" ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger
                            aria-label={`Vessel type for ${row.name_as_in_indos_cert}`}
                          className={`${brandedSelectTriggerClass} min-w-0`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <BrandedSelectContent>
                            <BrandedSelectItem value="choose-later">
                              Choose later
                            </BrandedSelectItem>
                          {compatibleTypes.map((item) => (
                            <BrandedSelectItem
                              key={item.id}
                              value={String(item.id)}
                            >
                              {item.name}
                            </BrandedSelectItem>
                          ))}
                          </BrandedSelectContent>
                        </Select>
                      </Td>
                      <Td>
                        <Status status="Pending" />
                        <p className="mt-1 text-[10px] text-slate-400">
                          Until vessel assignment
                        </p>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-[#3a5f9e] hover:text-[#325186] hover:underline"
                          onClick={() => setQuickView(row)}
                        >
                          <Eye size={15} /> View Candidate
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={11} className="p-10 text-center">
                    {loadError ? (
                      <div>
                        <p className="font-semibold text-red-700">{loadError}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={load}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-700">
                          No eligible {activeList.department} candidates match these
                          filters.
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-sm font-bold text-[#3a5f9e] hover:text-[#325186] hover:underline"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid shrink-0 grid-cols-1 items-center gap-2 text-sm text-slate-500 lg:grid-cols-[1fr_auto_1fr]">
          <p className="hidden justify-self-start lg:block">
            Showing {firstResult}–{lastResult} of {meta.total || 0}
          </p>
          <div className="flex items-center justify-self-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
              disabled={loading || meta.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={15} className="mr-1" /> Previous
            </Button>
            <span className="min-w-24 text-center text-xs font-bold text-slate-600">
              Page {meta.page || 1} of {meta.total_pages || 1}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
              disabled={loading || meta.page >= meta.total_pages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
          <div className="flex items-center justify-self-center gap-2 lg:justify-self-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selected.length || hasInvalidScores || saving}
              onClick={add}
            >
              {saving
                ? "Adding…"
                : `Add ${selected.length || ""} to ${activeList.department}`}
            </Button>
          </div>
        </div>
      </Modal>
      {quickView && (
        <CandidateQuickView
          candidate={quickView}
          department={activeList.department}
          onClose={() => setQuickView(null)}
        />
      )}
    </>
  );
};

const CandidateQuickView = ({ candidate, department, onClose }) => (
  <div
    className="fixed inset-0 z-[60] flex justify-end bg-black/40"
    onMouseDown={onClose}
  >
    <aside
      role="dialog"
      aria-modal="true"
      aria-label={`Candidate details for ${candidate.name_as_in_indos_cert}`}
      className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#3a5f9e]">
            Candidate quick view
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {candidate.name_as_in_indos_cert}
          </h2>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {candidate.cadet_unique_id}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close candidate quick view"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#3a5f9e]/20 bg-[#3a5f9e]/10 text-[#3a5f9e] shadow-sm transition hover:border-[#3a5f9e] hover:bg-[#3a5f9e] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3a5f9e]/30 focus:ring-offset-2"
          onClick={onClose}
        >
          <X size={25} strokeWidth={2.5} />
        </button>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <QuickViewValue label="Department" value={department} />
          <QuickViewValue label="Batch / Year" value={candidate.batch_year || "—"} />
          <QuickViewValue
            label="IMU Academic Score"
            value={formatAcademicScore(candidate.academic_score)}
          />
          <QuickViewValue
            label="Documents"
            value={candidate.document_verification_status || "—"}
          />
        </div>
        <QuickViewValue
          label="Institute"
          value={candidate.institute_name || "—"}
        />
        <div
          className={`rounded-xl border p-4 ${candidate.eligible ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
        >
          <p
            className={`flex items-center gap-2 font-bold ${candidate.eligible ? "text-emerald-800" : "text-amber-900"}`}
          >
            {candidate.eligible ? (
              <CheckCircle2 size={17} />
            ) : (
              <AlertTriangle size={17} />
            )}
            {candidate.eligible ? "Eligible for allocation" : "Needs attention"}
          </p>
          {!candidate.eligible && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {candidate.ineligible_reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => window.open(`/cadets/view/${candidate.id}`, "_blank")}
          >
            Open Full Profile <ArrowRight size={15} className="ml-2" />
          </Button>
        </div>
      </div>
    </aside>
  </div>
);

const QuickViewValue = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 font-semibold text-slate-900">{value}</p>
  </div>
);

const VesselModal = ({
  allocation,
  role,
  readOnly,
  canManageJoiningPlans,
  list,
  types,
  vessels,
  joiningPlan,
  onCreateJoiningPlan,
  onCommunicate,
  onClose,
  onSaved,
}) => {
  const compatibleTypes = types.filter((item) =>
    isDepartmentCompatible(item.department, list.department),
  );
  const secondary = role === "Secondary";
  const typeField = secondary ? "secondary_vessel_type_id" : "vessel_type_id";
  const vesselField = secondary ? "secondary_vessel_id" : "vessel_id";
  const statusField = secondary
    ? "secondary_allocation_status"
    : "allocation_status";
  const otherVesselId = secondary
    ? allocation.vessel_id
    : allocation.secondary_vessel_id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vessel_type_id: allocation.vessel_type_id || "",
    vessel_id: allocation.vessel_id || "",
    allocation_status: allocation.allocation_status || "Pending",
    secondary_vessel_type_id: allocation.secondary_vessel_type_id || "",
    secondary_vessel_id: allocation.secondary_vessel_id || "",
    secondary_allocation_status:
      allocation.secondary_allocation_status || "Pending",
    admin_remarks: allocation.admin_remarks || "",
  });
  const vesselRequired =
    ["Allocated", "Hold"].includes(form[statusField]) && !form[vesselField];
  const save = async () => {
    if (vesselRequired) return;
    try {
      setSaving(true);
      await api.put(
        `/allocations/candidate-allocations/${allocation.id}/vessel`,
        form,
      );
      toast.success(`${role} vessel allocation saved`);
      onSaved();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save vessel allocation",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      title={`${role} Vessel Allocation — ${allocation.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-[96vw]"
    >
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Candidate</p>
            <p className="font-semibold text-slate-900">
              {allocation.name_as_in_indos_cert}
            </p>
            <p className="text-xs text-slate-500">{allocation.cadet_unique_id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Department</p>
            <p className="font-semibold text-slate-900">{list.department}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Rank</p>
            <p className="font-semibold text-[#3a5f9e]">
              {allocation.current_rank ? `#${allocation.current_rank}` : "Not ranked"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Final Score</p>
            <p className="font-semibold text-slate-900">
              {allocation.final_score === null
                ? "Incomplete"
                : Number(allocation.final_score).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 text-sm text-[#2b4b80]">
          <p>
            The department filter is automatic. Allocated and Hold statuses
            reserve one seat.
          </p>
          <span className="rounded-full bg-[#3a5f9e] px-3 py-1 text-xs font-bold text-white">
            Showing {list.department} + Both-compatible vessels
          </span>
        </div>
        <VesselSlot
          role={role}
          typeField={typeField}
          vesselField={vesselField}
          statusField={statusField}
          form={form}
          setForm={setForm}
          types={compatibleTypes}
          vessels={vessels}
          department={list.department}
          otherVesselId={otherVesselId}
          readOnly={readOnly}
        />
        <Field label="Admin remarks">
          <textarea
            disabled={readOnly}
            className="min-h-20 w-full rounded-md border p-2 text-sm disabled:bg-slate-50"
            value={form.admin_remarks}
            onChange={(e) =>
              setForm({ ...form, admin_remarks: e.target.value })
            }
          />
        </Field>
        {vesselRequired && (
          <p className="text-sm font-semibold text-red-600">
            Select an actual vessel before using {form[statusField]} status.
          </p>
        )}
        {readOnly && joiningPlan && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 text-sm">
            <span className="font-semibold text-slate-700">Joining Plan:</span>
            <Status status={joiningPlan.status || "Draft"} />
            <span className="font-semibold text-slate-700">Email:</span>
            <Status status={joiningPlan.email_delivery_status || "Not Sent"} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {readOnly && canManageJoiningPlans && list.status === "Finalized" &&
            form[statusField] === "Allocated" &&
            form[vesselField] &&
            (joiningPlan && !Number(joiningPlan.requires_refresh) ? (
              <Button onClick={() => onCommunicate(joiningPlan)}>
                <Mail size={16} className="mr-2" />
                {joiningPlan.email_delivery_status === "Failed"
                  ? "Retry Joining Intimation"
                  : "Send / Record Intimation"}
              </Button>
            ) : (
              <Button onClick={onCreateJoiningPlan}>
                <Mail size={16} className="mr-2" />
                {joiningPlan ? "Update Joining Plan" : "Create Joining Plan"}
              </Button>
            ))}
          {!readOnly && (
            <Button disabled={saving || vesselRequired} onClick={save}>
              {saving ? "Saving…" : `Save ${role} Allocation`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const VesselSlot = ({
  role,
  typeField,
  vesselField,
  statusField,
  form,
  setForm,
  types,
  vessels,
  department,
  otherVesselId,
  readOnly,
}) => {
  const [locationFilter, setLocationFilter] = useState("all-locations");
  const [availableOnly, setAvailableOnly] = useState(true);
  const selected = vessels.find((item) => item.id === form[vesselField]);
  const compatibleVessels = vessels.filter(
    (item) =>
      item.status === "Active" &&
      isDepartmentCompatible(item.department, department) &&
      item.id !== otherVesselId,
  );
  const locations = [
    ...new Set(
      compatibleVessels
        .map((item) => item.location || item.reporting_port)
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));
  const filteredVessels = compatibleVessels.filter((item) => {
    const matchesType =
      !form[typeField] ||
      String(item.vessel_type_id) === String(form[typeField]);
    const matchesLocation =
      locationFilter === "all-locations" ||
      item.location === locationFilter ||
      item.reporting_port === locationFilter;
    const hasSeat =
      Number(item.available_seats || 0) > 0 || item.id === form[vesselField];
    return matchesType && matchesLocation && (!availableOnly || hasSeat);
  });
  const displayedVessels = readOnly
    ? selected
      ? [selected]
      : []
    : filteredVessels;

  const selectVessel = (vessel) => {
    if (readOnly || Number(vessel.available_seats || 0) <= 0) return;
    setForm({
      ...form,
      [typeField]: vessel.vessel_type_id,
      [vesselField]: vessel.id,
      [statusField]: ["Allocated", "Hold"].includes(form[statusField])
        ? form[statusField]
        : "Allocated",
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#3a5f9e]/25 p-4">
      <div>
        <h3 className="font-bold text-slate-900">{role} Vessel</h3>
        <p className="text-xs text-slate-500">
          {role === "Primary"
            ? "Main CTV vessel assignment"
            : "Alternative or additional vessel assignment"}
        </p>
      </div>
      {!readOnly && (
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] md:items-end">
          <Field label="Vessel Type">
            <Select
              value={form[typeField] || "all-vessel-types"}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  [typeField]: value === "all-vessel-types" ? "" : value,
                  [vesselField]: "",
                  [statusField]: "Pending",
                })
              }
            >
              <SelectTrigger
                className={brandedSelectTriggerClass}
                aria-label={`${role} vessel type filter`}
              >
                <SelectValue />
              </SelectTrigger>
              <BrandedSelectContent>
                <BrandedSelectItem value="all-vessel-types">
                  All {department} + Both vessel types
                </BrandedSelectItem>
                {types.map((item) => (
                  <BrandedSelectItem key={item.id} value={String(item.id)}>
                    {item.name} ({item.department})
                  </BrandedSelectItem>
                ))}
              </BrandedSelectContent>
            </Select>
          </Field>
          <Field label="Location">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger
                className={brandedSelectTriggerClass}
                aria-label="Filter vessels by location"
              >
                <SelectValue />
              </SelectTrigger>
              <BrandedSelectContent>
                <BrandedSelectItem value="all-locations">
                  All locations
                </BrandedSelectItem>
                {locations.map((location) => (
                  <BrandedSelectItem key={location} value={location}>
                    {location}
                  </BrandedSelectItem>
                ))}
              </BrandedSelectContent>
            </Select>
          </Field>
          <label className="flex h-9 items-center gap-2 whitespace-nowrap rounded-md border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 px-3 text-sm font-medium text-[#2b4b80]">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#3a5f9e] focus:ring-[#3a5f9e]/30"
            />
            Available seats only
          </label>
        </div>
      )}

      <div className="max-h-[350px] overflow-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1040px] table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              <Th className="w-12"><span className="sr-only">Select</span></Th>
              <Th className="w-[150px]">Vessel Name</Th>
              <Th className="w-[135px]">Vessel Type</Th>
              <Th className="w-[130px]">Location</Th>
              <Th className="w-[115px]">Joining Date</Th>
              <Th className="w-[105px]">Seats</Th>
              <Th className="w-[120px]">Voyage Ref</Th>
              <Th className="w-[135px]">Reporting Port</Th>
            </tr>
          </thead>
          <tbody>
            {displayedVessels.map((vessel) => {
              const isSelected = vessel.id === form[vesselField];
              const hasSeat = Number(vessel.available_seats || 0) > 0 || isSelected;
              const vesselType =
                types.find(
                  (item) => String(item.id) === String(vessel.vessel_type_id),
                )?.name || vessel.vessel_type || "—";
              return (
                <tr
                  key={vessel.id}
                  className={`border-t ${isSelected ? "bg-[#3a5f9e]/10" : "hover:bg-[#3a5f9e]/[0.03]"} ${!readOnly && hasSeat ? "cursor-pointer" : ""}`}
                  onClick={() => selectVessel(vessel)}
                >
                  <Td>
                    <input
                      type="radio"
                      name={`${role.toLowerCase()}-vessel`}
                      aria-label={`Select ${vessel.name}`}
                      checked={isSelected}
                      disabled={readOnly || !hasSeat}
                      onChange={() => selectVessel(vessel)}
                      className="h-4 w-4 border-slate-300 text-[#3a5f9e] focus:ring-[#3a5f9e]/30"
                    />
                  </Td>
                  <Td className="font-semibold text-slate-900">{vessel.name}</Td>
                  <Td>{vesselType}</Td>
                  <Td>{vessel.location || "—"}</Td>
                  <Td>{vessel.joining_date || "TBD"}</Td>
                  <Td>
                    <span className={hasSeat ? "text-emerald-700" : "text-red-600"}>
                      {vessel.available_seats ?? 0}/{vessel.total_seats ?? 0}
                    </span>
                  </Td>
                  <Td>{vessel.voyage_ref || "—"}</Td>
                  <Td>{vessel.reporting_port || "—"}</Td>
                </tr>
              );
            })}
            {!displayedVessels.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-slate-500">
                  {readOnly
                    ? "No vessel is assigned."
                    : `No active ${department} or Both-compatible vessels match these filters.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(240px,360px)_auto] sm:items-end">
        <Field label={`${role} allocation status`}>
          <Select
            disabled={readOnly}
            value={form[statusField]}
            onValueChange={(value) =>
              setForm({ ...form, [statusField]: value })
            }
          >
            <SelectTrigger
              className={brandedSelectTriggerClass}
              aria-label={`${role} allocation status`}
            >
              <SelectValue />
            </SelectTrigger>
            <BrandedSelectContent>
              {["Pending", "Allocated", "Hold", "Cancelled"].map((value) => (
                <BrandedSelectItem key={value} value={value}>
                  {value}
                </BrandedSelectItem>
              ))}
            </BrandedSelectContent>
          </Select>
        </Field>
        {!readOnly && selected && (
          <Button
            type="button"
            variant="ghost"
            className="w-fit text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
            onClick={() =>
              setForm({
                ...form,
                [vesselField]: "",
                [statusField]: "Pending",
              })
            }
          >
            Clear selected vessel
          </Button>
        )}
      </div>
    </div>
  );
};

const JoiningPlanModal = ({ candidate, vessels, onClose, onCreated }) => {
  const secondary = candidate.vesselRole === "Secondary";
  const vesselId = secondary
    ? candidate.secondary_vessel_id
    : candidate.vessel_id;
  const vessel = vessels.find((item) => item.id === vesselId) || {};
  const vesselType = secondary
    ? candidate.secondary_vessel_type_name
    : candidate.vessel_type_name;
  const [form, setForm] = useState({
    joining_date:
      vessel.joining_date ||
      (secondary ? candidate.secondary_joining_date : candidate.joining_date) ||
      "",
    location: vessel.location || "",
    voyage_ref: vessel.voyage_ref || "",
    reporting_port: vessel.reporting_port || "",
    contact_person_name: vessel.contact_person_name || "",
    contact_person_email: vessel.contact_person_email || "",
    contact_person_phone: vessel.contact_person_phone || "",
    communication_details: "",
    required_documents: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };
  const validate = () => {
    const next = {};
    if (!form.joining_date)
      next.joining_date = "Select the candidate joining date.";
    if (!form.reporting_port.trim())
      next.reporting_port = "Enter the reporting port or location.";
    if (!form.contact_person_name.trim())
      next.contact_person_name =
        "Enter the contact person for the joining intimation.";
    if (
      form.contact_person_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_person_email)
    )
      next.contact_person_email = "Enter a valid contact email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const create = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        vessel_role: candidate.vesselRole,
        required_documents: form.required_documents
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const response = await api.post(
        `/allocations/candidate-allocations/${candidate.id}/joining-plan`,
        payload,
      );
      toast.success(`${candidate.vesselRole} Joining Plan ${candidate.refreshJoiningPlan ? "updated" : "created"}`);
      onCreated({
        ...response.data.data,
        name_as_in_indos_cert: candidate.name_as_in_indos_cert,
        cadet_unique_id: candidate.cadet_unique_id,
        email_id: candidate.email_id,
        department: candidate.department,
        current_rank: candidate.current_rank,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create Joining Plan",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${candidate.refreshJoiningPlan ? "Update" : "Create"} ${candidate.vesselRole} Joining Plan`}
      onClose={onClose}
      width="max-w-4xl"
    >
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Candidate</p>
            <p className="font-semibold">{candidate.name_as_in_indos_cert}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Vessel Name</p>
            <p className="font-semibold">
              {vessel.name ||
                (secondary
                  ? candidate.secondary_vessel_name
                  : candidate.vessel_name)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Vessel Type</p>
            <p className="font-semibold">
              {vesselType || vessel.vessel_type || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Available / Total Seats</p>
            <p className="font-semibold">
              {vessel.available_seats ?? 0} / {vessel.total_seats ?? 0}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Joining Date *">
            <input
              type="date"
              min={today}
              className={`${inputClass} w-full`}
              value={form.joining_date}
              onChange={(event) => setField("joining_date", event.target.value)}
            />
            {errors.joining_date && (
              <FieldError>{errors.joining_date}</FieldError>
            )}
          </Field>
          <Field label="Location">
            <input
              className={`${inputClass} w-full`}
              value={form.location}
              onChange={(event) => setField("location", event.target.value)}
              placeholder="Current vessel location"
            />
          </Field>
          <Field label="Voyage Reference">
            <input
              className={`${inputClass} w-full`}
              value={form.voyage_ref}
              onChange={(event) => setField("voyage_ref", event.target.value)}
              placeholder="Voyage reference"
            />
          </Field>
          <Field label="Reporting Port *">
            <input
              className={`${inputClass} w-full`}
              value={form.reporting_port}
              onChange={(event) =>
                setField("reporting_port", event.target.value)
              }
              placeholder="Candidate reporting port"
            />
            {errors.reporting_port && (
              <FieldError>{errors.reporting_port}</FieldError>
            )}
          </Field>
          <Field label="Contact Person *">
            <input
              className={`${inputClass} w-full`}
              value={form.contact_person_name}
              onChange={(event) =>
                setField("contact_person_name", event.target.value)
              }
              placeholder="Contact person name"
            />
            {errors.contact_person_name && (
              <FieldError>{errors.contact_person_name}</FieldError>
            )}
          </Field>
          <Field label="Contact Phone">
            <input
              className={`${inputClass} w-full`}
              value={form.contact_person_phone}
              onChange={(event) =>
                setField("contact_person_phone", event.target.value)
              }
              placeholder="Phone / WhatsApp"
            />
          </Field>
          <Field label="Contact Email">
            <input
              type="email"
              className={`${inputClass} w-full`}
              value={form.contact_person_email}
              onChange={(event) =>
                setField("contact_person_email", event.target.value)
              }
              placeholder="Contact email"
            />
            {errors.contact_person_email && (
              <FieldError>{errors.contact_person_email}</FieldError>
            )}
          </Field>
          <Field label="Required Documents (optional)">
            <textarea
              className="min-h-20 w-full rounded-md border p-2 text-sm"
              value={form.required_documents}
              onChange={(event) =>
                setField("required_documents", event.target.value)
              }
              placeholder="One document per line"
            />
          </Field>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <button
            type="button"
            onClick={() => setShowCommunication((value) => !value)}
            className="text-sm font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
          >
            {showCommunication ? "Hide" : "Add / View"} communication details
          </button>
          {showCommunication && (
            <textarea
              className="mt-3 min-h-24 w-full rounded-md border p-2 text-sm"
              value={form.communication_details}
              onChange={(event) =>
                setField("communication_details", event.target.value)
              }
              placeholder="Reporting instructions or communication details"
            />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={create}>
            <Mail size={16} className="mr-2" />
            {saving ? "Saving…" : `${candidate.refreshJoiningPlan ? "Update" : "Create"} & Continue to Intimation`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const JoiningPlans = ({ cycle, plans, openJoiningPlan, openCommunication }) => {
  const currentPlans = plans.filter((plan) => !Number(plan.requires_refresh));
  const eligibleWithoutPlan = cycle.rank_lists
    .filter((list) => list.status === "Finalized")
    .flatMap((list) =>
      list.allocations.flatMap((item) => {
        const slots = [];
        if (
          item.allocation_status === "Allocated" &&
          (!item.primary_joining_plan_id || Number(item.primary_joining_plan_requires_refresh))
        )
          slots.push({
            ...item,
            department: list.department,
            vesselRole: "Primary",
            refreshJoiningPlan: Boolean(Number(item.primary_joining_plan_requires_refresh)),
          });
        if (
          item.secondary_allocation_status === "Allocated" &&
          (!item.secondary_joining_plan_id || Number(item.secondary_joining_plan_requires_refresh))
        )
          slots.push({
            ...item,
            department: list.department,
            vesselRole: "Secondary",
            refreshJoiningPlan: Boolean(Number(item.secondary_joining_plan_requires_refresh)),
          });
        return slots;
      }),
    );
  const pendingRows = eligibleWithoutPlan.map((item) => {
    const secondary = item.vesselRole === "Secondary";
    return {
      queueKey: `pending-${item.id}-${item.vesselRole}`,
      needsPlan: true,
      sourceAllocation: item,
      name_as_in_indos_cert: item.name_as_in_indos_cert,
      cadet_unique_id: item.cadet_unique_id,
      department: item.department,
      current_rank: item.current_rank,
      vessel_role: item.vesselRole,
      vessel_name: secondary ? item.secondary_vessel_name : item.vessel_name,
      vessel_type: secondary
        ? item.secondary_vessel_type_name
        : item.vessel_type_name,
      joining_date: secondary ? item.secondary_joining_date : item.joining_date,
      voyage_ref: secondary ? item.secondary_voyage_ref : item.voyage_ref,
      reporting_port: secondary
        ? item.secondary_reporting_port
        : item.reporting_port,
      location: secondary ? item.secondary_location : item.location,
    };
  });
  const queueRows = [
    ...pendingRows,
    ...currentPlans.map((plan) => ({
      ...plan,
      queueKey: `plan-${plan.id}`,
      needsPlan: false,
    })),
  ].sort(
    (left, right) =>
      String(left.department).localeCompare(String(right.department)) ||
      Number(left.current_rank || Number.MAX_SAFE_INTEGER) -
        Number(right.current_rank || Number.MAX_SAFE_INTEGER) ||
      String(left.vessel_role).localeCompare(String(right.vessel_role)),
  );
  const needsIntimation = currentPlans.filter((plan) => !isPlanIntimated(plan)).length;
  const awaitingConfirmation = currentPlans.filter(
    (plan) => isPlanIntimated(plan) && !plan.confirmation_received,
  ).length;
  const confirmed = currentPlans.filter((plan) => plan.confirmation_received).length;

  const getNextActionLabel = (row) => {
    if (row.needsPlan) return row.sourceAllocation.refreshJoiningPlan ? "Update Plan" : "Create Plan";
    if (row.email_delivery_status === "Failed") return "Retry Intimation";
    if (!isPlanIntimated(row)) return "Send Intimation";
    if (!row.confirmation_received) return "Record Confirmation";
    return "Add Contact";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[#3a5f9e]/20 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Joining & Intimation Queue
          </h2>
          <p className="text-sm text-slate-500">
            Work from top to bottom. Each vessel assignment shows one next action.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Plan needed", pendingRows.length, "text-amber-700"],
            ["To inform", needsIntimation, "text-[#3a5f9e]"],
            ["Awaiting reply", awaitingConfirmation, "text-sky-700"],
            ["Confirmed", confirmed, "text-emerald-700"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="min-w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center"
            >
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-h-[68vh] overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              <Th className="w-[190px]">Candidate</Th>
              <Th className="w-[175px]">Vessel</Th>
              <Th className="w-[190px]">Joining Details</Th>
              <Th className="w-[235px]">Progress</Th>
              <Th className="w-[175px]">Last Contact</Th>
              <Th className="sticky right-0 z-20 w-[170px] bg-slate-50">
                Next Action
              </Th>
            </tr>
          </thead>
          <tbody>
            {queueRows.map((row) => {
              const informed = !row.needsPlan && isPlanIntimated(row);
              const rowConfirmed =
                !row.needsPlan && Boolean(row.confirmation_received);
              return (
                <tr
                  key={row.queueKey}
                  className="group border-t align-top hover:bg-[#3a5f9e]/[0.025]"
                >
                  <Td>
                    <p className="font-semibold text-slate-900">
                      {row.name_as_in_indos_cert}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.cadet_unique_id}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#3a5f9e]">
                      {row.department} · Rank #{row.current_rank || "—"}
                    </p>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-900">
                      {row.vessel_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {row.vessel_role}
                      </span>{" "}
                      · {row.vessel_type || "Type unavailable"}
                    </p>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-800">
                      {formatJoiningDate(row.joining_date)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.reporting_port ||
                        row.location ||
                        "Reporting port to be added"}
                    </p>
                    {row.voyage_ref && (
                      <p className="text-xs text-slate-500">
                        Voyage: {row.voyage_ref}
                      </p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-nowrap items-center gap-1">
                      <QueueStep label="Plan" complete={!row.needsPlan} />
                      <ChevronRight
                        size={12}
                        className="shrink-0 text-slate-300"
                      />
                      <QueueStep label="Informed" complete={informed} />
                      <ChevronRight
                        size={12}
                        className="shrink-0 text-slate-300"
                      />
                      <QueueStep label="Confirmed" complete={rowConfirmed} />
                    </div>
                    {!row.needsPlan &&
                      row.email_delivery_status === "Failed" && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          Email failed
                          {row.last_failure_reason
                            ? `: ${row.last_failure_reason}`
                            : ""}
                        </p>
                      )}
                  </Td>
                  <Td>
                    {!row.needsPlan && row.last_mode ? (
                      <div>
                        <p className="font-semibold text-slate-800">
                          {row.last_mode}
                          {row.email_delivery_status && (
                            <span className="ml-2">
                              <Status status={row.email_delivery_status} />
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.last_informed_by || "Admin"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.last_informed_at
                            ? formatRankHistoryDate(row.last_informed_at)
                            : row.last_date_of_informing || ""}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.communication_count || 0} contact record(s)
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">No contact yet</span>
                    )}
                  </Td>
                  <Td className="sticky right-0 bg-white group-hover:bg-[#f8fafc]">
                    <Button
                      size="sm"
                      variant={rowConfirmed ? "outline" : "default"}
                      className={`w-full whitespace-nowrap px-2 text-xs ${
                        rowConfirmed
                          ? "border-[#3a5f9e]/30 text-[#3a5f9e]"
                          : ""
                      }`}
                      onClick={() =>
                        row.needsPlan
                          ? openJoiningPlan(row.sourceAllocation)
                          : openCommunication(row)
                      }
                    >
                      {row.needsPlan ? (
                        <ClipboardCheck size={15} className="mr-2" />
                      ) : (
                        <Mail size={15} className="mr-2" />
                      )}
                      {getNextActionLabel(row)}
                    </Button>
                  </Td>
                </tr>
              );
            })}
            {!queueRows.length && (
              <tr>
                <td colSpan="6" className="p-10 text-center text-slate-500">
                  No finalized vessel assignments are ready for Joining &
                  Intimation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const QueueStep = ({ label, complete }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[10px] font-bold leading-none ${
      complete
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-500"
    }`}
  >
    {complete && <Check size={10} strokeWidth={3} className="shrink-0" />}
    {label}
  </span>
);

const CommunicationModal = ({
  plan,
  admins,
  currentUser,
  onClose,
  onSaved,
}) => {
  const previouslyInformed = isPlanIntimated(plan);
  const defaultMode =
    plan.email_delivery_status === "Failed"
      ? "Email"
      : previouslyInformed
        ? plan.last_mode === "WhatsApp"
          ? "WhatsApp"
          : "Phone"
        : "Email";
  const [form, setForm] = useState({
    mode: defaultMode,
    informed_by: currentUser?.id || "",
    date_of_informing: today,
    confirmation_received: Boolean(plan.confirmation_received),
    candidate_remarks: "",
    admin_remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [attemptError, setAttemptError] = useState("");
  const requiredDocuments = Array.isArray(plan.required_documents)
    ? plan.required_documents
    : (() => {
        try {
          return JSON.parse(plan.required_documents || "[]");
        } catch (_) {
          return [];
        }
      })();
  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };
  const submit = async () => {
    const nextErrors = {};
    if (!form.informed_by)
      nextErrors.informed_by = "Select the Admin who informed the candidate.";
    if (!form.date_of_informing)
      nextErrors.date_of_informing = "Select the informing date.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      setSaving(true);
      setAttemptError("");
      await api.post(
        `/allocations/joining-plans/${plan.id}/communications`,
        form,
      );
      toast.success(
        form.mode === "Email"
          ? "Joining intimation sent"
          : "Communication recorded",
      );
      onSaved();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to record communication";
      setAttemptError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  const ModeIcon =
    form.mode === "Email"
      ? Mail
      : form.mode === "Phone"
        ? Phone
        : MessageCircle;
  return (
    <Modal
      title={`Contact Candidate — ${plan.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-4xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <QueueStep label="Plan Ready" complete />
          <ChevronRight size={14} className="text-slate-300" />
          <QueueStep label="Candidate Informed" complete={previouslyInformed} />
          <ChevronRight size={14} className="text-slate-300" />
          <QueueStep
            label="Confirmation Received"
            complete={Boolean(plan.confirmation_received)}
          />
        </div>
        <div className="grid gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Vessel Name</p>
            <p className="font-semibold">{plan.vessel_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Vessel Type</p>
            <p className="font-semibold">
              {plan.vessel_type || "—"} · {plan.vessel_role}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Joining Date</p>
            <p className="font-semibold">{plan.joining_date || "TBD"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Reporting Port</p>
            <p className="font-semibold">
              {plan.reporting_port || plan.location || "—"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          className="text-sm font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
        >
          {showDetails ? "Hide" : "View"} vessel and communication details
        </button>
        {showDetails && (
          <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm md:grid-cols-2">
            <p>
              Location: <strong>{plan.location || "—"}</strong>
            </p>
            <p>
              Voyage Ref: <strong>{plan.voyage_ref || "—"}</strong>
            </p>
            <p>
              Total Seats: <strong>{plan.total_seats ?? "—"}</strong>
            </p>
            <p>
              Contact:{" "}
              <strong>
                {plan.contact_person_name || "—"}{" "}
                {plan.contact_person_phone || ""}
              </strong>
            </p>
            <p className="md:col-span-2">
              Contact Email: <strong>{plan.contact_person_email || "—"}</strong>
            </p>
            <p className="md:col-span-2 whitespace-pre-wrap">
              Communication Details:{" "}
              <strong>{plan.communication_details || "—"}</strong>
            </p>
            <div className="md:col-span-2">
              <p className="font-medium">Required Documents</p>
              {requiredDocuments.length ? (
                <ul className="mt-1 list-disc pl-5">
                  {requiredDocuments.map((document) => (
                    <li key={document}>{document}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No specific documents added.</p>
              )}
            </div>
          </div>
        )}
        {plan.email_delivery_status && (
          <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
            <span>Previous Email Status:</span>
            <Status status={plan.email_delivery_status} />
            {plan.last_failure_reason && (
              <span className="text-red-600">{plan.last_failure_reason}</span>
            )}
          </div>
        )}
        {attemptError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {attemptError} The failed attempt was saved; you can retry now.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Communication Mode">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Email", Mail],
                ["Phone", Phone],
                ["WhatsApp", MessageCircle],
              ].map(([value, Icon]) => {
                const active = form.mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setField("mode", value)}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition ${
                      active
                        ? "border-[#3a5f9e] bg-[#3a5f9e] text-white"
                        : "border-[#3a5f9e]/20 bg-white text-slate-600 hover:bg-[#3a5f9e]/10 hover:text-[#3a5f9e]"
                    }`}
                  >
                    <Icon size={14} /> {value}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Informed By *">
            <Select
              value={form.informed_by || "no-admin"}
              onValueChange={(value) =>
                setField("informed_by", value === "no-admin" ? "" : value)
              }
            >
              <SelectTrigger
                className={brandedSelectTriggerClass}
                aria-label="Informed by administrator"
                invalid={Boolean(errors.informed_by)}
              >
                <SelectValue />
              </SelectTrigger>
              <BrandedSelectContent>
                <BrandedSelectItem value="no-admin">
                  Select Admin
                </BrandedSelectItem>
              {admins.map((item) => (
                <BrandedSelectItem key={item.id} value={String(item.id)}>
                  {[item.first_name, item.last_name]
                    .filter(Boolean)
                    .join(" ") || item.email}{" "}
                  ({item.role})
                </BrandedSelectItem>
              ))}
              </BrandedSelectContent>
            </Select>
            {errors.informed_by && (
              <FieldError>{errors.informed_by}</FieldError>
            )}
          </Field>
          <Field label="Date of Informing *">
            <input
              className={`${inputClass} w-full`}
              type="date"
              max={today}
              value={form.date_of_informing}
              onChange={(event) =>
                setField("date_of_informing", event.target.value)
              }
            />
            {errors.date_of_informing && (
              <FieldError>{errors.date_of_informing}</FieldError>
            )}
          </Field>
          <Field label="Confirmation Received">
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map((value) => {
                const active = form.confirmation_received === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setField("confirmation_received", value)}
                    className={`h-9 rounded-md border text-sm font-semibold transition ${
                      active
                        ? "border-[#3a5f9e] bg-[#3a5f9e] text-white"
                        : "border-[#3a5f9e]/20 bg-white text-slate-600 hover:bg-[#3a5f9e]/10 hover:text-[#3a5f9e]"
                    }`}
                  >
                    {value ? "Yes" : "No"}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <button
            type="button"
            onClick={() => setShowRemarks((value) => !value)}
            className="text-sm font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
          >
            {showRemarks ? "Hide optional remarks" : "Add optional remarks"}
          </button>
          {showRemarks && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="Candidate Remarks">
                <textarea
                  className="min-h-20 w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-[#3a5f9e] focus:ring-2 focus:ring-[#3a5f9e]/20"
                  value={form.candidate_remarks}
                  onChange={(event) =>
                    setField("candidate_remarks", event.target.value)
                  }
                />
              </Field>
              <Field label="Admin Remarks">
                <textarea
                  className="min-h-20 w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-[#3a5f9e] focus:ring-2 focus:ring-[#3a5f9e]/20"
                  value={form.admin_remarks}
                  onChange={(event) =>
                    setField("admin_remarks", event.target.value)
                  }
                />
              </Field>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Communication timestamp is recorded automatically when this action is
          submitted.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || (form.mode === "Email" && !plan.email_id)}
            onClick={submit}
          >
            <ModeIcon size={16} className="mr-2" />
            {saving
              ? "Saving…"
              : form.mode === "Email"
                ? plan.email_delivery_status === "Failed" || attemptError
                  ? "Retry Joining Intimation"
                  : previouslyInformed
                    ? "Send Another Email"
                    : "Send Joining Intimation"
                : form.confirmation_received
                  ? "Record Confirmation"
                  : "Record Communication"}
          </Button>
        </div>
        {form.mode === "Email" && !plan.email_id && (
          <p className="text-right text-xs text-red-600">
            Candidate email address is missing.
          </p>
        )}
      </div>
    </Modal>
  );
};

const Modal = ({
  title,
  onClose,
  children,
  width = "max-w-2xl",
  bodyClassName = "",
}) => (
  <div
    role="presentation"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onMouseDown={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-2xl`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button
          type="button"
          aria-label={`Close ${title}`}
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#3a5f9e]/20 bg-[#3a5f9e]/10 text-[#3a5f9e] shadow-sm transition hover:border-[#3a5f9e] hover:bg-[#3a5f9e] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3a5f9e]/30 focus:ring-offset-2"
        >
          <X size={25} strokeWidth={2.5} />
        </button>
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName || "overflow-auto"}`}>
        {children}
      </div>
    </div>
  </div>
);
const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    <div className="mt-1">{children}</div>
  </label>
);
const FieldError = ({ children }) => (
  <p className="mt-1 text-xs font-normal text-red-600">{children}</p>
);
const Th = ({ children, className = "" }) => (
  <th
    className={`whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 ${className}`}
  >
    {children}
  </th>
);
const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-3 text-slate-700 ${className}`}>{children}</td>
);
const Status = ({ status }) => {
  const good = [
    "Finalized",
    "Allocated",
    "Primary Allocated",
    "Secondary Allocated",
    "Both Allocated",
    "Verified",
    "Onboarded",
    "Sent",
    "Confirmed",
    "Informed",
  ].includes(status);
  const bad = ["Cancelled", "Failed", "Needs Review", "Not Allocated"].includes(
    status,
  );
  return (
    <span
      className={`inline-flex h-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${good ? "bg-emerald-100 text-emerald-700" : bad ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
    >
      {status || "Pending"}
    </span>
  );
};

export default AllocationDetail;
