import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Rocket,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import PageHeader from "../../components/common/PageHeader";
import Permission from "../../components/common/Permission";

const STATUS_COLORS = {
  Draft: "bg-yellow-100 text-yellow-800",
  Requested: "bg-blue-100 text-blue-800",
  Received: "bg-cyan-100 text-cyan-800",
  Submitted: "bg-indigo-100 text-indigo-800",
  Shortlisted: "bg-purple-100 text-purple-800",
  "Assessment Completed": "bg-teal-100 text-teal-800",
  "Interview Completed": "bg-emerald-100 text-emerald-800",
  "Medical Completed": "bg-lime-100 text-lime-800",
  Closed: "bg-slate-100 text-slate-800",
  Cancelled: "bg-red-100 text-red-800",
};

const getStatusColor = (status) => STATUS_COLORS[status] || "bg-slate-100 text-slate-800";

const getCourseTypeColor = (courseType) =>
  courseType === "Deck"
    ? "bg-blue-100 text-blue-800"
    : "bg-orange-100 text-orange-800";

const calculateProgress = (drive) => {
  const totalUploaded = Number(drive.total_uploaded || 0);
  if (!totalUploaded) return 0;

  const shortlisted = Number(drive.shortlisted_count || 0);
  const assessmentPassed = Number(drive.assessment_passed || 0);
  const interviewSelected = Number(drive.interview_selected || 0);
  const medical = Number(drive.medical_queue_count || 0);
  const documentCount = Number(drive.document_count || 0);

  const progress =
    10 +
    (shortlisted / totalUploaded) * 15 +
    (assessmentPassed / totalUploaded) * 20 +
    (interviewSelected / totalUploaded) * 20 +
    (medical / totalUploaded) * 20 +
    (documentCount / totalUploaded) * 15;

  return Math.max(0, Math.min(100, Math.round(progress)));
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

        const response = await api.get(`/recruitment-drives?${params.toString()}`);
        setDrives(response.data?.data || []);
        setPagination({
          current_page: response.data.page,
          per_page: response.data.limit,
          total: response.data.total,
          last_page: Math.max(1, Math.ceil(response.data.total / response.data.limit)),
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
          <Button onClick={() => navigate("/drives/new")} className="flex items-center gap-2">
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
            onChange={(event) => handleFilterChange("status", event.target.value)}
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
            onChange={(event) => handleFilterChange("course_type", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            <option value="Deck">Deck</option>
            <option value="Engine">Engine</option>
          </select>

          {user?.role !== "Institute" ? (
            <select
              value={filters.institute_id}
              onChange={(event) => handleFilterChange("institute_id", event.target.value)}
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {drives.map((drive) => {
          const progress = calculateProgress(drive);
          const hasPendingCadetDataRequest =
            Number(drive.cadet_data_submit_request_pending || 0) === 1 ||
            drive.cadet_data_request_status === "pending_submission";
          const progressBarColorClass =
            progress >= 80
              ? "bg-emerald-600"
              : progress >= 50
                ? "bg-amber-500"
                : progress > 0
                  ? "bg-blue-600"
                  : "bg-slate-300";

          return (
            <div
              key={drive.id}
              className="cursor-pointer rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate(`/drives/${drive.id}`)}
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="truncate text-lg font-semibold text-slate-900">
                    {drive.drive_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(drive.status)}`}
                    >
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                          title="Delete drive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Permission>
                    ) : null}
                  </div>
                </div>

                {hasPendingCadetDataRequest ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-900">
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
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload cadet data
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mb-4 space-y-2">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Institute:</span>{" "}
                    {drive.institute_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getCourseTypeColor(drive.course_type)}`}
                    >
                      {drive.course_type}
                    </span>
                    {drive.year ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {drive.year}
                      </span>
                    ) : null}
                    <span className="flex-1 text-right text-sm text-slate-600">
                      Capacity: {drive.intake_capacity || 0}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className={`${progressBarColorClass} h-2 rounded-full transition-all`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span>{drive.total_uploaded || 0} uploaded</span>
                    <span>{drive.shortlisted_count || 0} shortlisted</span>
                    <span>{drive.assessment_passed || 0} assessment passed</span>
                    <span>{drive.interview_selected || 0} interview selected</span>
                    <span>{drive.medical_queue_count || 0} medical</span>
                    <span>{drive.document_count || 0} document</span>
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
              Showing page <span className="font-medium">{pagination.current_page}</span> of{" "}
              <span className="font-medium">{pagination.last_page}</span>
            </p>
          </div>
          <nav className="inline-flex items-center gap-2" aria-label="Pagination">
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
