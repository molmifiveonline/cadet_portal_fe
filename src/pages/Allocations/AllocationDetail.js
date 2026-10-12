import React, { lazy, useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../hooks/usePermission";
import api from "../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Anchor, ArrowLeft } from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import PageHeader from "../../components/common/PageHeader";
import DisableAllocationButton from "./components/DisableAllocationButton";
import DisabledAllocationNotice from "./components/DisabledAllocationNotice";
import RankList from "./components/RankList";
import JoiningPlans from "./components/JoiningPlans";
import DeferredDialog from "./components/DeferredDialog";
// Overview remains hidden at the user's request.
// import OverviewTab from './tabs/OverviewTab';
const CandidatePicker = lazy(() => import("./components/CandidatePicker"));
const VesselModal = lazy(() => import("./components/VesselModal"));

export default function AllocationDetail() {
  const { id } = useParams(),
    navigate = useNavigate(),
    [searchParams, setSearchParams] = useSearchParams(),
    { user } = useAuth();
  const { hasPermission: hasEdit } = usePermission("allocations", "edit");
  const { hasPermission: hasFinalize } = usePermission("allocations", "finalize");
  const [cycle, setCycle] = useState(null),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState(null);
  const [types, setTypes] = useState([]),
    [courses, setCourses] = useState([]);
  const [candidateList, setCandidateList] = useState(null),
    [vessel, setVessel] = useState(null);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, t, s] = await Promise.all([
        api.get(`/allocations/${id}`),
        api.get("/allocations/masters/vessel-types", { params: { status: "Active" } }),
        api.get("/allocations/masters/courses", { params: { status: "Active" } }),
      ]);
      setCycle(c.data.data);
      setTypes(t.data.data || []);
      setCourses(s.data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load allocation");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    setCycle(null);
    setTab(null);
    setCandidateList(null);
    setVessel(null);
    load();
  }, [load]);
  const canEdit = hasEdit && !cycle?.deleted_at,
    canFinalize = hasFinalize && !cycle?.deleted_at;
  useEffect(() => {
    if (cycle?.id === id && canEdit && searchParams.get("action") === "add-candidates") {
      const list = cycle.rank_lists.find((l) => l.status === "Draft");
      if (list) setCandidateList(list);
      setSearchParams({}, { replace: true });
    }
  }, [cycle, id, canEdit, searchParams, setSearchParams]);
  if (loading && !cycle) return <PageLoader />;
  if (!cycle) return <p className="p-8 text-center">Allocation cycle not found.</p>;
  const activeTab = tab || cycle.rank_lists[0]?.department || "Joining Plan",
    currentList = cycle.rank_lists.find((l) => l.department === activeTab);
  return (
    <div className="py-6">
      <PageHeader
        title={cycle.allocation_number}
        subtitle={`${cycle.department || cycle.rank_lists[0]?.department} vessel allocation · ${cycle.allocation_year}`}
        icon={Anchor}
        backButton={
          <button
            aria-label="Back to allocations"
            onClick={() => navigate("/allocations")}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ArrowLeft />
          </button>
        }
      >
        {canEdit && <DisableAllocationButton key={cycle.id} cycle={cycle} onDisabled={load} />}
      </PageHeader>
      <DisabledAllocationNotice cycle={cycle} />
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-white p-2">
        {[
          ...cycle.rank_lists.map((l) => [l.department, `${l.department} Workflow`]),
          ["Joining Plan", "Joining & Intimation"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === value ? "bg-[#3a5f9e] text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {currentList && (
        <RankList
          key={currentList.id}
          list={currentList}
          assessmentTypes={courses}
          reload={load}
          openCandidates={() => setCandidateList(currentList)}
          openVessel={setVessel}
          isSuperAdmin={user?.role === "SuperAdmin" && !cycle.deleted_at}
          canEdit={canEdit}
          canFinalizePermission={canFinalize}
        />
      )}
      {activeTab === "Joining Plan" && <JoiningPlans cycle={cycle} onChanged={load} />}
      {candidateList && canEdit && (
        <DeferredDialog onClose={() => setCandidateList(null)}>
          <CandidatePicker
            list={candidateList}
            assessmentTypes={courses}
            vesselTypes={types}
            onClose={() => setCandidateList(null)}
            onSaved={() => {
              setCandidateList(null);
              load();
            }}
          />
        </DeferredDialog>
      )}
      {vessel && canEdit && (
        <DeferredDialog onClose={() => setVessel(null)}>
          <VesselModal
            allocation={vessel.allocation}
            role={vessel.role}
            onClose={() => setVessel(null)}
            onSaved={load}
          />
        </DeferredDialog>
      )}
    </div>
  );
}
export { default as CommunicationModal } from "./components/CommunicationModal";
