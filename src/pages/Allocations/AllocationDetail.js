import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../hooks/usePermission";
import React, { lazy, useState, useCallback, useEffect } from "react";
import api from "../../lib/utils/apiConfig";
import { toast } from "sonner";
import PageLoader from "../../components/common/PageLoader";
import { getCycleProgress } from "./allocationUtils";
import PageHeader from "../../components/common/PageHeader";
import { Anchor, ArrowLeft } from "lucide-react";
import WorkflowStepper from "./components/WorkflowStepper";
import DisabledAllocationNotice from "./components/DisabledAllocationNotice";
// import OverviewTab from "./tabs/OverviewTab";
import RankList from "./components/RankList";
import JoiningPlans from "./components/JoiningPlans";

import CommunicationModal from "./components/CommunicationModal";

import DeferredDialog from "./components/DeferredDialog";

const CandidatePicker = lazy(() => import("./components/CandidatePicker"));
const VesselModal = lazy(() => import("./components/VesselModal"));
const JoiningPlanModal = lazy(() => import("./components/JoiningPlanModal"));

const AllocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { hasPermission: hasEditPermission } = usePermission(
    "allocations",
    "edit",
  );
  const { hasPermission: hasFinalizePermission } = usePermission(
    "allocations",
    "finalize",
  );
  const {
    hasPermission: hasCommunicationPermission,
    loading: permissionsLoading,
  } = usePermission("allocations", "communicate");
  // const { hasPermission: canViewOnboarding } = usePermission(
  //   "onboarding",
  //   "view",
  // );
  const [cycle, setCycle] = useState(null);
  const disabled = Boolean(cycle?.deleted_at);
  const canEditAllocations = hasEditPermission && !disabled;
  const canFinalizeAllocations = hasFinalizePermission && !disabled;
  const canCommunicate = hasCommunicationPermission && !disabled;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(null);
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
    if (permissionsLoading) return;
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
        api.get("/allocations/vessels", { params: { limit: 200 } }),
        api.get("/allocations/joining-plans", { params: { cycle_id: id } }),
        hasCommunicationPermission
          ? api.get("/allocations/admins")
          : Promise.resolve({ data: { data: [] } }),
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
  }, [id, hasCommunicationPermission, permissionsLoading]);
  useEffect(() => {
    setCycle(null);
    setTab(null);
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
      const draftList = cycle.rank_lists.find(
        (item) => item.status === "Draft",
      );
      if (draftList) setCandidateList(draftList);
      setSearchParams({}, { replace: true });
    }
  }, [canEditAllocations, cycle, id, searchParams, setSearchParams]);

  if (loading && !cycle) return <PageLoader />;
  if (!cycle)
    return <div className="p-8 text-center">Allocation cycle not found.</div>;
  const department = cycle.department || cycle.rank_lists[0]?.department;
  const activeTab = tab || cycle.rank_lists[0]?.department || "Joining Plan";
  const currentList = cycle.rank_lists.find(
    (item) => item.department === activeTab,
  );
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
      <DisabledAllocationNotice cycle={cycle} />
      <WorkflowStepper steps={progress.steps} />
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-white p-2">
        {[
          // ["Dashboard", "Overview"],
          ...cycle.rank_lists.map((list) => [
            list.department,
            `${list.department} Workflow`,
          ]),
          ["Joining Plan", "Joining & Intimation"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === value ? "bg-[#3a5f9e] text-white" : "text-slate-600 hover:bg-[#3a5f9e]/10 hover:text-[#3a5f9e]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* {tab === "Dashboard" && (
        <OverviewTab
          cycle={cycle}
          progress={progress}
          joiningPlans={joiningPlans}
          vessels={vessels}
          openCandidates={setCandidateList}
          setTab={setTab}
          canEdit={canEditAllocations}
          canFinalize={canFinalizeAllocations}
          canViewOnboarding={canViewOnboarding}
          openOnboarding={() =>
            navigate(
              `/onboarding?allocation=${encodeURIComponent(cycle.allocation_number)}`,
            )
          }
        />
      )} */}
      {currentList && (
        <RankList
          key={currentList.id}
          list={currentList}
          assessmentTypes={assessmentTypes}
          reload={load}
          openCandidates={() => setCandidateList(currentList)}
          openVessel={setVesselAllocation}
          isSuperAdmin={user?.role === "SuperAdmin" && !disabled}
          canEdit={canEditAllocations}
          canFinalizePermission={canFinalizeAllocations}
        />
      )}
      {activeTab === "Joining Plan" && (
        <JoiningPlans
          cycle={cycle}
          plans={joiningPlans}
          openJoiningPlan={setJoiningPlanCandidate}
          openCommunication={setCommunicationPlan}
          canEdit={canEditAllocations}
          canCommunicate={canCommunicate}
        />
      )}
      {candidateList && canEditAllocations && (
        <DeferredDialog onClose={() => setCandidateList(null)}>
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
        </DeferredDialog>
      )}
      {vesselAllocation && canEditAllocations && (
        <DeferredDialog onClose={() => setVesselAllocation(null)}>
          <VesselModal
            allocation={vesselAllocation.allocation}
            role={vesselAllocation.role}
            readOnly={vesselAllocation.readOnly}
            canCommunicate={canCommunicate}
            canManageJoiningPlans={
              canEditAllocations &&
              vesselAllocation.allocation.onboarding_status !== "Onboarded"
            }
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
                refreshJoiningPlan: Boolean(
                  joiningPlans.find(
                    (plan) =>
                      plan.allocation_id === allocation.id &&
                      plan.vessel_role === role,
                  )?.requires_refresh,
                ),
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
        </DeferredDialog>
      )}
      {joiningPlanCandidate && canEditAllocations && (
        <DeferredDialog onClose={() => setJoiningPlanCandidate(null)}>
          <JoiningPlanModal
            candidate={joiningPlanCandidate}
            vessels={vessels}
            canCommunicate={canCommunicate}
            onClose={() => setJoiningPlanCandidate(null)}
            onCreated={(plan) => {
              setJoiningPlanCandidate(null);
              if (canCommunicate) setCommunicationPlan(plan);
              load();
            }}
          />
        </DeferredDialog>
      )}
      {communicationPlan && canCommunicate && (
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

export default AllocationDetail;

export { default as CommunicationModal } from "./components/CommunicationModal";
