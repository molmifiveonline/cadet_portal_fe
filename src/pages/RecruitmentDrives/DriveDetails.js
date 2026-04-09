import React, { useEffect, useState, useCallback } from "react";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../lib/utils/apiConfig";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Edit,
  Users,
  ListChecks,
  FileText,
  CheckCircle,
  Clock,
  Mail,
  Rocket,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import Permission from "../../components/common/Permission";
import PageHeader from "../../components/common/PageHeader";
import AssessmentTab from "./AssessmentTab";
import InterviewTab from "./InterviewTab";
import MedicalTab from "./MedicalTab";
import CadetsTab from "./CadetsTab";
import ShortlistTab from "./ShortlistTab";
import DocumentsTab from "./DocumentsTab";
import SendEmailModal from "../institutes/SendEmailModal";

const DriveDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sendingShortlist, setSendingShortlist] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [shortlistRefreshTrigger, setShortlistRefreshTrigger] = useState(0);

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
      toast.error("Failed to fetch drive details");
      navigate("/drives");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDriveData();
  }, [fetchDriveData]);

  useEffect(() => {
    if (!stats) return;

    // Auto-select current progress stage when entering details.
    if ((stats.onboarded || 0) > 0) {
      setStatusFilter("Onboarded");
      return;
    }
    if ((stats.ctv_assigned || 0) > 0) {
      setStatusFilter("CTV Assigned");
      return;
    }
    if ((stats.medical_completed || 0) > 0) {
      setStatusFilter("Medical Completed");
      return;
    }
    if ((stats.medical_ready || 0) > 0) {
      setStatusFilter("Eligible for Medical");
      return;
    }
    if ((stats.interview_ready || 0) > 0) {
      setStatusFilter("Eligible for Interview");
      return;
    }
    if ((stats.uploaded || 0) > 0) {
      setStatusFilter("Eligible for Assessment");
      return;
    }
    setStatusFilter("all");
  }, [stats]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCourseTypeColor = (courseType) => {
    return courseType === "Deck"
      ? "bg-blue-100 text-blue-800"
      : "bg-orange-100 text-orange-800";
  };

  const handlePipelineClick = (status) => {
    setStatusFilter(status);
    setActiveTab("cadets");
  };

  const handleWorkflowAction = async (endpoint, successMessage) => {
    try {
      setLoading(true);
      await api.post(`/recruitment-drives/${id}/${endpoint}`);
      toast.success(successMessage);
      fetchDriveData();
    } catch (error) {
      console.error(`Error executing ${endpoint}:`, error);
      toast.error(error.response?.data?.message || `Failed to execute action`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendShortlistEmail = async (cadetIds) => {
    if (!drive || !drive.institute_id) {
      toast.error("Institute information missing");
      return;
    }

    try {
      setSendingShortlist(true);
      const response = await api.post("/institutes/send-shortlist-email", {
        instituteIds: [drive.institute_id],
        cadetIds: cadetIds || [],
      });

      const results = response.data.results || [];
      const success = results.filter((r) => r.status === "success");
      const skipped = results.filter((r) => r.status === "skipped");

      if (success.length > 0) {
        toast.success(
          `Shortlist email sent to ${success[0].email} (${success[0].cadetCount} cadets)`,
        );
        setShortlistRefreshTrigger((prev) => prev + 1);
        fetchDriveData();
      } else if (skipped.length > 0) {
        toast.warning(
          skipped[0].reason || "No shortlisted cadets for this institute",
        );
      } else {
        toast.error("Failed to send shortlist email");
      }
    } catch (error) {
      console.error("Error sending shortlist email:", error);
      toast.error(
        error.response?.data?.message || "Failed to send shortlist email",
      );
    } finally {
      setSendingShortlist(false);
    }
  };

  const isInstituteRevertedExcelSent = Boolean(
    Number(drive?.institute_reverted_excel),
  );
  
  const canSendShortlistEmail =
    isInstituteRevertedExcelSent && user?.role !== "Institute";

  const renderActionButtons = () => {
    if (user?.role === "Institute") return null;

    const hasExcel = Boolean(Number(drive?.institute_reverted_excel));
    const hasRequested = Boolean(Number(drive?.institute_email_sent));
    
    // Resolve effective status for legacy drives or unknown statuses
    let status = drive.status;
    
    // Legacy mapping (for OLD drives that might be marked 'Active')
    if (status === "Active" || !status) {
      if (hasExcel) {
        status = "Received";
      } else if (hasRequested) {
        status = "Requested";
      } else {
        status = "Draft";
      }
    }

    const getButton = () => {
      // 1. If we have excel, show "Submit" regardless of Draft/Requested status (if not yet submitted)
      if (hasExcel && (status === "Draft" || status === "Requested" || status === "Received" || status === "Active")) {
        return (
          <Permission module="recruitment_drives" action="edit">
            <Button
              onClick={() => handleWorkflowAction("submit-cadets", "Cadets imported and submitted successfully")}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Users className="h-4 w-4" />
              Submit Cadets to Drive
            </Button>
          </Permission>
        );
      }

      // 2. If no excel, and we are in early stages, show "Send Request Email"
      if (status === "Draft" || status === "Requested" || status === "Active" || !status) {
        return (
          <Permission module="institutes" action="view">
            <Button
              variant="outline"
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <Mail className="h-4 w-4" />
              Send Request Email
            </Button>
          </Permission>
        );
      }

      // 3. Fallback/Standard Workflow Switches for advanced stages
      switch (status) {
        case "Received": // Handle Received separately if Excel flag check somehow missed
          return (
            <Permission module="recruitment_drives" action="edit">
              <Button
                onClick={() => handleWorkflowAction("submit-cadets", "Cadets imported and submitted successfully")}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Users className="h-4 w-4" />
                Submit Cadets to Drive
              </Button>
            </Permission>
          );
        case "Requested":
          return (
            <Permission module="recruitment_drives" action="edit">
              <Button disabled variant="outline" className="flex items-center gap-2 opacity-70">
                <Clock className="h-4 w-4" />
                Awaiting Submission
              </Button>
            </Permission>
          );
        case "Submitted":
          return (
            <Permission module="recruitment_drives" action="edit">
              <Button
                onClick={() => handleWorkflowAction("finalize-shortlist", "Shortlist finalized")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <ListChecks className="h-4 w-4" />
                Finalize Shortlist
              </Button>
            </Permission>
          );
        case "Shortlisted":
          return (
            <Permission module="recruitment_drives" action="edit">
              <Button
                onClick={() => handleWorkflowAction("finalize-assessment", "Assessment stage finalized")}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Finalize Assessment
              </Button>
            </Permission>
          );
        case "Assessment Completed":
          return (
            <Permission module="recruitment_drives" action="edit">
              <Button
                onClick={() => handleWorkflowAction("finalize-interview", "Interview stage finalized")}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Clock className="h-4 w-4" />
                Finalize Interview
              </Button>
            </Permission>
          );
        case "Interview Completed":
          return (
            <Permission module="recruitment_drives" action="edit">
              <Button
                onClick={() => handleWorkflowAction("finalize-medical", "Medical stage finalized")}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Finalize Medical
              </Button>
            </Permission>
          );
        case "Medical Completed":
          return (
            <Permission module="recruitment_drives" action="edit">
              <Button
                onClick={() => handleWorkflowAction("close", "Recruitment Drive closed successfully")}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Close Drive
              </Button>
            </Permission>
          );
        default:
          return null;
      }
    };

    return getButton();
  };

  const baseTabs = [
    { id: "info", label: "Drive Info", icon: FileText },
    { id: "cadets", label: "Cadets", icon: Users },
    { id: "shortlist", label: "Shortlist", icon: ListChecks },
    { id: "assessment", label: "Assessment", icon: CheckCircle },
    { id: "interview", label: "Interview", icon: Clock },
  ];

  const medicalTab = { id: "medical", label: "Medical", icon: CheckCircle };
  
  const documentsTab = { id: "documents", label: "Documents", icon: FileText };

  const tabs = user?.role !== "Institute" 
    ? [...baseTabs, medicalTab, documentsTab] 
    : [...baseTabs, documentsTab];

  if (loading && !drive) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!drive && !loading) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Drive not found</h3>
        <Button onClick={() => navigate("/drives")} className="mt-4">
          Back to Drives
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(drive.status)}`}
          >
            {drive.status}
          </span>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getCourseTypeColor(drive.course_type)}`}
          >
            {drive.course_type}
          </span>
          
          {/* Dynamic Workflow Action Button */}
          {renderActionButtons()}

          {/* Edit Button */}
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
        </div>
      </PageHeader>

      {/* Progress Overview */}
      {stats && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            Pipeline Progress
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <button
              onClick={() => handlePipelineClick("all")}
              className={`text-center p-3 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${statusFilter === "all" && activeTab === "cadets" ? "bg-blue-50 border-blue-300 ring-4 ring-blue-100" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
            >
              <div className="text-xl sm:text-2xl font-black text-blue-600">
                {stats.total_cadets}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total</div>
            </button>
            <button
              onClick={() => handlePipelineClick("Eligible for Assessment")}
              className={`text-center p-3 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${statusFilter === "Eligible for Assessment" ? "bg-green-50 border-green-300 ring-4 ring-green-100" : "bg-white border-slate-200 hover:border-green-300 hover:bg-slate-50"}`}
            >
              <div className="text-xl sm:text-2xl font-black text-green-600">
                {stats.uploaded}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded</div>
            </button>
            <button
              onClick={() => handlePipelineClick("Eligible for Interview")}
              className={`text-center p-3 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${statusFilter === "Eligible for Interview" ? "bg-yellow-50 border-yellow-300 ring-4 ring-yellow-100" : "bg-white border-slate-200 hover:border-yellow-300 hover:bg-slate-50"}`}
            >
              <div className="text-xl sm:text-2xl font-black text-yellow-600">
                {stats.interview_ready}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Interview</div>
            </button>
            {user?.role !== "Institute" && (
              <>
                <button
                  onClick={() => handlePipelineClick("Eligible for Medical")}
                  className={`text-center p-3 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${statusFilter === "Eligible for Medical" ? "bg-purple-50 border-purple-300 ring-4 ring-purple-100" : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50"}`}
                >
                  <div className="text-xl sm:text-2xl font-black text-purple-600">
                    {stats.medical_ready}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Medical</div>
                </button>
                <button
                  onClick={() => handlePipelineClick("Medical Completed")}
                  className={`text-center p-3 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${statusFilter === "Medical Completed" ? "bg-indigo-50 border-indigo-300 ring-4 ring-indigo-100" : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}
                >
                  <div className="text-xl sm:text-2xl font-black text-indigo-600">
                    {stats.medical_completed}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Med Done</div>
                </button>
              </>
            )}
            <button
              onClick={() => handlePipelineClick("CTV Assigned")}
              className={`text-center p-3 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${statusFilter === "CTV Assigned" ? "bg-amber-50 border-amber-300 ring-4 ring-amber-100" : "bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50"}`}
            >
              <div className="text-xl sm:text-2xl font-black text-amber-600">
                {stats.ctv_assigned}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">CTV</div>
            </button>
            <button
              onClick={() => handlePipelineClick("Onboarded")}
              className={`text-center p-3 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${statusFilter === "Onboarded" ? "bg-emerald-50 border-emerald-300 ring-4 ring-emerald-100" : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50"}`}
            >
              <div className="text-xl sm:text-2xl font-black text-emerald-600">
                {stats.onboarded}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</div>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Drive Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Drive Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {drive.drive_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Institute
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {drive.institute_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Course Type
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {drive.course_type}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Intake Capacity
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {drive.intake_capacity}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{drive.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateForDisplay(drive.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {drive.eligibility_criteria && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eligibility Criteria
                  </label>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {drive.eligibility_criteria}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "cadets" && (
            <CadetsTab
              drive={drive}
              initialStatus={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          )}

          {activeTab === "shortlist" && (
            <ShortlistTab
              drive={drive}
              canSendShortlistEmail={canSendShortlistEmail}
              onSendShortlistEmail={handleSendShortlistEmail}
              sendingShortlist={sendingShortlist}
              refreshTrigger={shortlistRefreshTrigger}
            />
          )}

          {activeTab === "assessment" && <AssessmentTab drive={drive} />}

          {activeTab === "interview" && <InterviewTab drive={drive} />}

          {activeTab === "medical" && <MedicalTab drive={drive} />}

          {activeTab === "documents" && <DocumentsTab drive={drive} />}
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
      />
    </div>
  );
};

export default DriveDetails;
