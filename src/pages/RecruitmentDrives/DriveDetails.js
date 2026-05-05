import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  FileText,
  ListChecks,
  Mail,
  Rocket,
  Stethoscope,
  Users,
  Upload,
} from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import Permission from "../../components/common/Permission";
import PageHeader from "../../components/common/PageHeader";
import AssessmentTab from "./AssessmentTab";
import CadetsTab from "./CadetsTab";
import DocumentsTab from "./DocumentsTab";
import InterviewTab from "./InterviewTab";
import MedicalTab from "./MedicalTab";
import SendEmailModal from "../institutes/SendEmailModal";
import ShortlistTab from "./ShortlistTab";
import CadetPreviewModal from "../../components/common/CadetPreviewModal";
import SubmitExcel from "../institutes/SubmitExcel";

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

const getCourseTypeColor = (courseType) =>
  courseType === "Deck"
    ? "bg-blue-100 text-blue-800"
    : "bg-orange-100 text-orange-800";

const getStatusColor = (status) =>
  STATUS_COLORS[status] || "bg-slate-100 text-slate-800";

const INSTITUTE_UPLOAD_CLOSED_STATUSES = new Set([
  "Received",
  "Submitted",
  "Shortlisted",
  "Assessment Completed",
  "Interview Completed",
  "Medical Completed",
  "Closed",
]);

const DriveDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [drive, setDrive] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sendingShortlist, setSendingShortlist] = useState(false);
  const [shortlistRefreshTrigger, setShortlistRefreshTrigger] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewCadets, setPreviewCadets] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInstituteUser = user?.role === "Institute";

  const fetchDriveData = useCallback(async () => {
    try {
      setLoading(true);
      const [driveResponse, statsResponse] = await Promise.all([
        api.get(`/recruitment-drives/${id}`),
        api.get(`/recruitment-drives/${id}/stats`),
      ]);

      setDrive(driveResponse.data.data);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error("Error fetching drive data:", error);
      toast.error("Failed to fetch recruitment drive details");
      navigate("/drives");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDriveData();
  }, [fetchDriveData]);

  useEffect(() => {
    const requestedTab =
      location.state?.activeTab ||
      new URLSearchParams(location.search).get("tab");

    if (requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [location.search, location.state]);

  const handlePreviewSubmit = async () => {
    try {
      setPreviewLoading(true);
      const response = await api.get(`/recruitment-drives/${id}/preview-submit-cadets`);
      if (response.data.success) {
        setPreviewCadets(response.data.data);
        setIsPreviewModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
      toast.error(error.response?.data?.message || "Failed to fetch cadet preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmitCadets = async () => {
    try {
      setIsSubmitting(true);
      await api.post(`/recruitment-drives/${id}/submit-cadets`);
      toast.success("Cadets imported into the recruitment drive");
      setIsPreviewModalOpen(false);
      await fetchDriveData();
    } catch (error) {
      console.error("Error submitting cadets:", error);
      toast.error(error.response?.data?.message || "Failed to submit cadets");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendShortlistEmail = async (cadetIds) => {
    if (!drive?.institute_id) {
      toast.error("Institute information is missing for this drive");
      return;
    }

    if (!cadetIds.length) {
      toast.error("Select at least one shortlisted cadet");
      return;
    }

    try {
      setSendingShortlist(true);
      const response = await api.post("/institutes/send-shortlist-email", {
        instituteIds: [drive.institute_id],
        cadetIds,
      });

      const result = response.data?.results?.[0];
      if (result?.status === "success") {
        toast.success(
          `Shortlist email sent to ${result.email} for ${result.cadetCount} cadet(s)`,
        );
        setShortlistRefreshTrigger((prev) => prev + 1);
        await fetchDriveData();
        return;
      }

      toast.warning(result?.reason || "No shortlist email was sent");
    } catch (error) {
      console.error("Error sending shortlist email:", error);
      toast.error(
        error.response?.data?.message || "Failed to send shortlist email",
      );
    } finally {
      setSendingShortlist(false);
    }
  };

  const canSendRequestEmail =
    !isInstituteUser &&
    !Number(drive?.institute_email_sent) &&
    !Number(drive?.institute_reverted_excel);
  const canSubmitCadets =
    !isInstituteUser &&
    Number(drive?.institute_reverted_excel) &&
    Number(stats?.total_uploaded || 0) === 0;
  const canSendShortlistEmail =
    !isInstituteUser && Number(drive?.institute_reverted_excel);
  const hasPendingCadetDataRequest =
    Number(drive?.cadet_data_submit_request_pending || 0) === 1 ||
    drive?.cadet_data_request_status === "pending_submission";
  const isInstituteCadetDataSubmitted =
    Number(drive?.institute_reverted_excel || 0) === 1 ||
    drive?.cadet_data_request_status === "submitted" ||
    INSTITUTE_UPLOAD_CLOSED_STATUSES.has(drive?.status);
  const canInstituteUploadCadets =
    isInstituteUser &&
    hasPendingCadetDataRequest &&
    !isInstituteCadetDataSubmitted;
  const instituteUploadDisabledMessage = isInstituteCadetDataSubmitted
    ? "Cadet data has already been submitted for this drive. Further uploads are disabled."
    : "There is no active cadet data request for this drive.";

  const progressCards = useMemo(
    () => [
      {
        label: "Total Uploaded",
        value: stats?.total_uploaded || 0,
        tone: "text-blue-600",
        onClick: () => {
          setActiveTab("cadets");
          setStatusFilter("all");
        },
      },
      {
        label: "Shortlisted",
        value: stats?.shortlisted_count || 0,
        tone: "text-purple-600",
        onClick: () => {
          setActiveTab("shortlist");
          setStatusFilter("Shortlisted");
        },
      },
      {
        label: "Assessment Passed",
        value: stats?.assessment_passed || 0,
        tone: "text-teal-600",
        onClick: () => setActiveTab("assessment"),
      },
      {
        label: "Interview Selected",
        value: stats?.interview_selected || 0,
        tone: "text-emerald-600",
        onClick: () => setActiveTab("interview"),
      },
      {
        label: "Medical",
        value: stats?.medical_queue_count || 0,
        tone: "text-lime-600",
        onClick: () => setActiveTab("medical"),
      },
      // Phase 2: re-enable CTV Assigned and Onboarded progress cards.
      // {
      //   label: "CTV Assigned",
      //   value: stats?.ctv_assigned || 0,
      //   tone: "text-amber-600",
      //   onClick: () => {
      //     setActiveTab("cadets");
      //     setStatusFilter("CTV Assigned");
      //   },
      // },
      // {
      //   label: "Onboarded",
      //   value: stats?.onboarded || 0,
      //   tone: "text-lime-600",
      //   onClick: () => {
      //     setActiveTab("cadets");
      //     setStatusFilter("Onboarded");
      //   },
      // },
    ],
    [stats],
  );

  const tabs = isInstituteUser
    ? [
        { id: "info", label: "Drive Info", icon: FileText },
        {
          id: "upload",
          label: "Upload Cadets",
          icon: Upload,
          disabled: !canInstituteUploadCadets,
          disabledReason: instituteUploadDisabledMessage,
        },
        { id: "cadets", label: "Cadets", icon: Users },
        { id: "shortlist", label: "Shortlisted", icon: ListChecks },
        { id: "assessment", label: "Assessment", icon: ListChecks },
        { id: "interview", label: "Interview", icon: Users },
        { id: "documents", label: "Documents", icon: FileText },
      ]
    : [
        { id: "info", label: "Drive Info", icon: FileText },
        { id: "cadets", label: "Cadets", icon: Users },
        { id: "shortlist", label: "Shortlist", icon: ListChecks },
        { id: "assessment", label: "Assessment", icon: ListChecks },
        { id: "interview", label: "Interview", icon: Users },
        { id: "medical", label: "Medical", icon: Stethoscope },
        { id: "documents", label: "Documents", icon: FileText },
      ];

  if (loading && !drive) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-lg font-medium text-slate-900">Drive not found</h3>
        <Button onClick={() => navigate("/drives")} className="mt-4">
          Back to Drives
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={drive.drive_name}
        subtitle={drive.institute_name}
        icon={Rocket}
        backButton={
          <Button
            variant="ghost"
            onClick={() => navigate("/drives")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Drives
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(drive.status)}`}
          >
            {drive.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${getCourseTypeColor(drive.course_type)}`}
          >
            {drive.course_type}
          </span>

          {canSendRequestEmail ? (
            <Permission module="recruitment_drives" action="edit">
              <Button
                variant="outline"
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Mail className="h-4 w-4" />
                Request Cadet Details
              </Button>
            </Permission>
          ) : null}

          {canSubmitCadets ? (
            <Permission module="recruitment_drives" action="edit">
              <Button
                onClick={handlePreviewSubmit}
                loading={previewLoading}
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
              >
                <Users className="h-4 w-4" />
                Submit Cadets to Drive
              </Button>
            </Permission>
          ) : null}

          {!isInstituteUser ? (
            <Permission module="recruitment_drives" action="edit">
              <Button
                variant="outline"
                onClick={() => navigate(`/drives/edit/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Permission>
          ) : null}
        </div>
      </PageHeader>

      {hasPendingCadetDataRequest ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-amber-950">
                  {drive.cadet_data_request_message ||
                    "Cadet data submit request is pending"}
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  Upload the requested cadet data for this drive to move the
                  request forward.
                </p>
              </div>
            </div>
            {isInstituteUser ? (
              <Button
                onClick={() => setActiveTab("upload")}
                disabled={!canInstituteUploadCadets}
                className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700"
              >
                <Upload className="h-4 w-4" />
                Upload Cadet Data
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {stats ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
            <Rocket className="h-5 w-5 text-blue-600" />
            Pipeline Progress
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {progressCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-sm"
              >
                <div className={`text-xl sm:text-2xl font-black ${card.tone}`}>
                  {card.value}
                </div>
                <div className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
                  {card.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50/80">
          <nav
            className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar sm:px-6"
            aria-label="Drive tabs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (!tab.disabled) {
                    setActiveTab(tab.id);
                  }
                }}
                disabled={tab.disabled}
                title={tab.disabled ? tab.disabledReason : undefined}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/60"
                    : tab.disabled
                      ? "cursor-not-allowed border-transparent text-slate-400 opacity-60"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "info" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Drive Name
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {drive.drive_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Institute
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {drive.institute_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Course Type
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {drive.course_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Intake Capacity
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {drive.intake_capacity || 0}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Eligibility Criteria
                  </label>
                  <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
                    {drive.eligibility_criteria || "No criteria specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <p className="mt-1 text-sm text-slate-900">{drive.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Created
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDateForDisplay(drive.created_at)}
                  </p>
                </div>
              </div>

              {canSendRequestEmail ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-blue-900">
                        Request Cadet Details From Institute
                      </h3>
                      <p className="mt-1 text-sm text-blue-800">
                        This drive is created, but cadet details have not been
                        requested from the institute yet. Send the request email
                        to start the data collection flow.
                      </p>
                    </div>
                    <Permission module="recruitment_drives" action="edit">
                      <Button
                        onClick={() => setIsEmailModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Mail className="h-4 w-4" />
                        Request Cadet Details
                      </Button>
                    </Permission>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Uploaded
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats?.total_uploaded || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assessment Passed
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats?.assessment_passed || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Interview Selected
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats?.interview_selected || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rejected
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats?.rejected_count || 0}
                  </p>
                </div>
              </div>

            </div>
          ) : null}

          {activeTab === "upload" && isInstituteUser ? (
            <SubmitExcel 
              isEmbedded={true}
              driveContext={{
                driveId: drive.id,
                instituteId: drive.institute_id,
                batchYear: drive.year,
                courseType: drive.course_type
              }}
              disabled={!canInstituteUploadCadets}
              disabledMessage={instituteUploadDisabledMessage}
              onSuccess={() => {
                fetchDriveData();
              }}
            />
          ) : null}

          {activeTab === "cadets" ? (
            <CadetsTab
              drive={drive}
              initialStatus={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          ) : null}

          {activeTab === "shortlist" ? (
            <ShortlistTab
              drive={drive}
              canSendShortlistEmail={!isInstituteUser && canSendShortlistEmail}
              onSendShortlistEmail={!isInstituteUser ? handleSendShortlistEmail : undefined}
              sendingShortlist={!isInstituteUser ? sendingShortlist : false}
              refreshTrigger={shortlistRefreshTrigger}
              onRefresh={fetchDriveData}
              isInstituteUser={isInstituteUser}
            />
          ) : null}

          {activeTab === "assessment" ? (
            <AssessmentTab
              drive={drive}
              onRefresh={fetchDriveData}
              readOnly={isInstituteUser}
            />
          ) : null}

          {activeTab === "interview" ? (
            <InterviewTab
              drive={drive}
              onRefresh={fetchDriveData}
              readOnly={isInstituteUser}
            />
          ) : null}

          {activeTab === "medical" && !isInstituteUser ? (
            <MedicalTab drive={drive} onRefresh={fetchDriveData} />
          ) : null}

          {activeTab === "documents" ? <DocumentsTab drive={drive} /> : null}
        </div>
      </div>

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        selectedInstitutes={drive?.institute_id ? [drive.institute_id] : []}
        defaultBatchYear={drive?.year}
        defaultCourseType={drive?.course_type}
        lockBatchYear
        lockCourseType
        onSuccess={fetchDriveData}
      />

      <CadetPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        cadets={previewCadets}
        onConfirm={handleSubmitCadets}
        loading={isSubmitting}
      />
    </div>
  );
};

export default DriveDetails;
