import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  Anchor,
  ChevronLeft,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileCheck,
  GraduationCap,
  HeartPulse,
  Plus,
  Rocket,
  Stethoscope,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import PageHeader from "../../components/common/PageHeader";
import Permission from "../../components/common/Permission";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Draft: {
    dot: "bg-yellow-400",
    badge: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  },
  Requested: {
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  Received: {
    dot: "bg-cyan-400",
    badge: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  Submitted: {
    dot: "bg-indigo-400",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  Shortlisted: {
    dot: "bg-purple-400",
    badge: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  "Assessment Completed": {
    dot: "bg-teal-400",
    badge: "bg-teal-50 text-teal-700 ring-teal-200",
  },
  "Interview Completed": {
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  "Medical Completed": {
    dot: "bg-lime-500",
    badge: "bg-lime-50 text-lime-700 ring-lime-200",
  },
  Closed: {
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  Cancelled: {
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 ring-red-200",
  },
};
const DEFAULT_STATUS = {
  dot: "bg-slate-400",
  badge: "bg-slate-100 text-slate-600 ring-slate-200",
};
const getStatusCfg = (s) => STATUS_CONFIG[s] || DEFAULT_STATUS;

const COURSE_CFG = {
  Deck: { badge: "bg-sky-50 text-sky-700 ring-sky-200", icon: Anchor },
  Engine: {
    badge: "bg-orange-50 text-orange-700 ring-orange-200",
    icon: GraduationCap,
  },
};
const getCourseCfg = (t) =>
  COURSE_CFG[t] || {
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    icon: GraduationCap,
  };

// ─── Pipeline stages config ──────────────────────────────────────────────────
const getPipelineStages = (drive) => [
  {
    label: "Uploaded",
    value: drive.total_uploaded || 0,
    icon: Upload,
    color: "text-indigo-600",
    bg: "bg-indigo-50/50",
  },
  {
    label: "Shortlisted",
    value: drive.shortlisted_count || 0,
    icon: UserCheck,
    color: "text-purple-600",
    bg: "bg-purple-50/50",
  },
  {
    label: "Assessment",
    value: drive.assessment_passed || 0,
    icon: ClipboardList,
    color: "text-cyan-600",
    bg: "bg-cyan-50/50",
  },
  {
    label: "Interview",
    value: drive.interview_selected || 0,
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50/50",
  },
  {
    label: "Medical",
    value: drive.medical_queue_count || 0,
    icon: Stethoscope,
    color: "text-lime-700",
    bg: "bg-lime-50/50",
  },
  {
    label: "Documents",
    value: drive.document_count || 0,
    icon: FileCheck,
    color: "text-slate-600",
    bg: "bg-slate-50/50",
  },
];

const calculateProgress = (drive) => {
  const totalUploaded = Number(drive.total_uploaded || 0);
  const shortlisted = Number(drive.shortlisted_count || 0);
  const assessmentPassed = Number(drive.assessment_passed || 0);
  const interviewSelected = Number(drive.interview_selected || 0);
  const medical = Number(drive.medical_queue_count || 0);
  const documentCount = Number(drive.document_count || 0);
  const ctvAssigned = Number(drive.ctv_assigned || 0);
  const onboarded = Number(drive.onboarded || 0);
  const status = drive.status || "";

  if (
    status === "Closed" ||
    documentCount > 0 ||
    ctvAssigned > 0 ||
    onboarded > 0
  )
    return 100;
  if (status === "Medical Completed" || medical > 0) return 85;
  if (status === "Interview Completed" || interviewSelected > 0) return 70;
  if (status === "Assessment Completed" || assessmentPassed > 0) return 55;
  if (status === "Shortlisted" || shortlisted > 0) return 40;
  if (status === "Submitted" || totalUploaded > 0) return 20;
  if (status === "Received") return 10;
  if (status === "Requested") return 5;
  return 0;
};

const RecruitmentDrives = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institutes, setInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [filters, setFilters] = useState({
    status: "all",
    course_type: "all",
    institute_id: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    driveId: null,
    driveName: "",
  });

  const fetchDrives = useCallback(
    async (
      page = pagination.current_page,
      limit = pagination.per_page,
      search = searchTerm,
      filterStatus = filters.status,
      filterCourseType = filters.course_type,
      filterInstituteId = filters.institute_id,
    ) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page,
          limit,
          search,
          ...(filterStatus !== "all" && { status: filterStatus }),
          ...(filterCourseType !== "all" && { course_type: filterCourseType }),
          ...(filterInstituteId && { institute_id: filterInstituteId }),
        });

        const response = await api.get(
          `/recruitment-drives?${params.toString()}`,
        );
        setDrives(response.data?.data || []);
        setPagination({
          current_page: response.data.page,
          per_page: response.data.limit,
          total: response.data.total,
          last_page: Math.max(
            1,
            Math.ceil(response.data.total / response.data.limit),
          ),
        });
      } catch (error) {
        console.error("Error fetching recruitment drives:", error);
        toast.error("Failed to fetch recruitment drives");
      } finally {
        setLoading(false);
      }
    },
    [
      filters.course_type,
      filters.institute_id,
      filters.status,
      pagination.current_page,
      pagination.per_page,
      searchTerm,
    ],
  );

  useEffect(() => {
    fetchDrives();
    if (user?.role !== "Institute") {
      (async () => {
        try {
          const response = await api.get("/institutes?limit=1000");
          setInstitutes(response.data?.data || []);
        } catch (error) {
          console.error("Error fetching institutes:", error);
        }
      })();
    }
  }, [fetchDrives, user]);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    fetchDrives(1, pagination.per_page, value);
  };

  const handleFilterChange = (filterType, value) => {
    const nextFilters = { ...filters, [filterType]: value };
    setFilters(nextFilters);
    fetchDrives(
      1,
      pagination.per_page,
      searchTerm,
      nextFilters.status,
      nextFilters.course_type,
      nextFilters.institute_id,
    );
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/recruitment-drives/${deleteModal.driveId}`);
      toast.success("Recruitment drive deleted successfully");
      setDeleteModal({ isOpen: false, driveId: null, driveName: "" });

      const targetPage =
        drives.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      fetchDrives(
        targetPage,
        pagination.per_page,
        searchTerm,
        filters.status,
        filters.course_type,
        filters.institute_id,
      );
    } catch (error) {
      console.error("Error deleting recruitment drive:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete recruitment drive",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Drives"
        subtitle="Manage and track drive-level cadet workflow from upload to medical completion"
        icon={Rocket}
      >
        <Permission module="recruitment_drives" action="create">
          <Button
            onClick={() => navigate("/drives/new")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Drive
          </Button>
        </Permission>
      </PageHeader>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search drives..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.status}
            onChange={(event) =>
              handleFilterChange("status", event.target.value)
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Requested">Requested</option>
            <option value="Received">Received</option>
            <option value="Submitted">Submitted</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Assessment Completed">Assessment Completed</option>
            <option value="Interview Completed">Interview Completed</option>
            <option value="Medical Completed">Medical Completed</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={filters.course_type}
            onChange={(event) =>
              handleFilterChange("course_type", event.target.value)
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            <option value="Deck">Deck</option>
            <option value="Engine">Engine</option>
          </select>

          {user?.role !== "Institute" ? (
            <select
              value={filters.institute_id}
              onChange={(event) =>
                handleFilterChange("institute_id", event.target.value)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Institutes</option>
              {institutes.map((institute) => (
                <option key={institute.id} value={institute.id}>
                  {institute.institute_name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {drives.map((drive) => {
          const progress = calculateProgress(drive);
          const statusCfg = getStatusCfg(drive.status);
          const courseCfg = getCourseCfg(drive.course_type);
          const CourseIcon = courseCfg.icon;
          const stages = getPipelineStages(drive);
          const hasPendingCadetDataRequest =
            Number(drive.cadet_data_submit_request_pending || 0) === 1 ||
            drive.cadet_data_request_status === "pending_submission";

          return (
            <div
              key={drive.id}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-200"
              onClick={() => navigate(`/drives/${drive.id}`)}
            >
              <div className="p-5">
                {/* ── Header row ─────────────────────────────────────────── */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="truncate text-base font-bold text-slate-800 leading-tight">
                    {drive.drive_name}
                  </h3>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {/* Circular Progress Ring */}
                    <div className="relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center">
                      <svg className="h-full w-full -rotate-90 transform">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="40%"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="transparent"
                          className="text-slate-100"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="40%"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray="100 100"
                          strokeDashoffset={100 - progress}
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ease-out ${
                            progress >= 80
                              ? "text-emerald-500"
                              : progress >= 50
                                ? "text-amber-500"
                                : "text-blue-500"
                          }`}
                          pathLength="100"
                        />
                      </svg>
                      <span className="absolute text-[9px] sm:text-[11px] font-black text-slate-800">
                        {progress}%
                      </span>
                    </div>

                    {/* Status badge with dot */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusCfg.badge}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                      />
                      {drive.status}
                    </span>

                    {user?.role !== "Institute" ? (
                      <Permission module="recruitment_drives" action="delete">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteModal({
                              isOpen: true,
                              driveId: drive.id,
                              driveName: drive.drive_name,
                            });
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400
                                     transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete drive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Permission>
                    ) : null}
                  </div>
                </div>

                {/* ── Pending alert ───────────────────────────────────────── */}
                {hasPendingCadetDataRequest ? (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-amber-800">
                        {drive.cadet_data_request_message ||
                          "Cadet data submit request is pending"}
                      </p>
                      {user?.role === "Institute" ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/drives/${drive.id}?tab=upload`);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900"
                        >
                          <Upload className="h-3 w-3" />
                          Upload cadet data
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* ── Meta-data Icons Row ─────────────────────────────────── */}
                <div className="mb-5 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 text-[11px] sm:text-[12px] text-slate-500">
                  <div className="flex items-center gap-1.5 min-w-0 max-w-[150px] sm:max-w-none">
                    <Building2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">
                      {drive.institute_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CourseIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{drive.course_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{drive.year}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <HeartPulse className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700">
                      {drive.intake_capacity || 0}
                    </span>
                  </div>
                </div>

                {/* ── Metric Grid (The "Pucks") ────────────────────────────── */}
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stages.map((stage) => (
                    <div
                      key={stage.label}
                      className={`flex flex-col items-center rounded-xl border border-slate-100 ${stage.bg} py-2.5 transition-all hover:border-slate-200 hover:shadow-sm`}
                    >
                      <stage.icon
                        className={`mb-1 h-3.5 w-3.5 ${stage.color} opacity-80`}
                      />
                      <span className={`text-sm font-black ${stage.color}`}>
                        {stage.value}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">
                        {stage.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Drive Details
                  </span>
                  <div className="flex items-center gap-2 text-blue-600 transition-all duration-300 group-hover:translate-x-1">
                    <span className="text-[11px] font-bold opacity-0 group-hover:opacity-100">
                      Manage
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {drives.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">
            No recruitment drives
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Create a new drive to start managing recruitment workflow.
          </p>
          <div className="mt-6">
            <Permission module="recruitment_drives" action="create">
              <Button onClick={() => navigate("/drives/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Drive
              </Button>
            </Permission>
          </div>
        </div>
      ) : null}

      {pagination.last_page > 1 ? (
        <div className="mt-6 flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
          <div className="hidden sm:block">
            <p className="text-sm text-slate-700">
              Showing page{" "}
              <span className="font-medium">{pagination.current_page}</span> of{" "}
              <span className="font-medium">{pagination.last_page}</span>
            </p>
          </div>
          <nav
            className="inline-flex items-center gap-2"
            aria-label="Pagination"
          >
            <Button
              variant="outline"
              className="h-9 px-2"
              onClick={() =>
                fetchDrives(
                  pagination.current_page - 1,
                  pagination.per_page,
                  searchTerm,
                  filters.status,
                  filters.course_type,
                  filters.institute_id,
                )
              }
              disabled={pagination.current_page === 1}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 items-center border-y border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900">
              {pagination.current_page} / {pagination.last_page}
            </div>
            <Button
              variant="outline"
              className="h-9 px-2"
              onClick={() =>
                fetchDrives(
                  pagination.current_page + 1,
                  pagination.per_page,
                  searchTerm,
                  filters.status,
                  filters.course_type,
                  filters.institute_id,
                )
              }
              disabled={pagination.current_page === pagination.last_page}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      ) : null}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, driveId: null, driveName: "" })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Recruitment Drive"
        message={`Are you sure you want to delete "${deleteModal.driveName}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default RecruitmentDrives;
