import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Send,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import StageInviteModal from "./StageInviteModal";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const getWorkflowStatusConfig = (cadet) => {
  if (cadet.workflow_phase === "selected") {
    return {
      label: "Moved to Documents",
      className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    };
  }
  if (cadet.workflow_result === "academic_data_collected") {
    return {
      label: "Academic Data Collected",
      className: "bg-blue-100 text-blue-800 border border-blue-200",
    };
  }
  if (cadet.workflow_result === "confirmed") {
    return {
      label: "Confirmed",
      className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    };
  }
  if (cadet.workflow_result === "medical_passed") {
    return {
      label: "Medical Passed",
      className: "bg-green-100 text-green-800 border border-green-200",
    };
  }
  if (cadet.workflow_result === "invited") {
    return {
      label: "Medical Invited",
      className: "bg-sky-100 text-sky-800 border border-sky-200",
    };
  }
  if (
    cadet.workflow_result === "failed" ||
    cadet.rejection_stage === "medical"
  ) {
    return {
      label: "Failed",
      className: "bg-red-100 text-red-800 border border-red-200",
    };
  }
  return {
    label: "Pending",
    className: "bg-slate-100 text-slate-800 border border-slate-200",
  };
};

const GROUP_CONFIGS = {
  pending_other: {
    label: "Pending / Other",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-800",
    badgeColor: "bg-slate-100 text-slate-700",
  },
  confirmed: {
    label: "Confirmed Cadets",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-800",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  collected_academic: {
    label: "Collected Academic Data",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  moved_to_document: {
    label: "Moved to Document Process",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-800",
    badgeColor: "bg-purple-100 text-purple-700",
  },
};

const formatPercentage = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)}%` : "-";
};

const INTERVIEW_DECISION_COLORS = {
  selected: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  waitlisted: "bg-amber-100 text-amber-700 border border-amber-200",
  pass: "bg-green-100 text-green-700 border border-green-200",
  fail: "bg-red-100 text-red-700 border border-red-200",
};

const MEDICAL_DECISION_COLORS = {
  pass: "bg-green-100 text-green-700 border border-green-200",
  fail: "bg-red-100 text-red-700 border border-red-200",
};

const FIT_STATUS_LABELS = {
  fit: "Fit for Sea Service",
  unfit: "Unfit",
  fit_with_rest: "Fit with Restrictions",
  pending: "Pending Investigation",
};

const FIT_STATUS_COLORS = {
  fit: "bg-green-100 text-green-700 border border-green-200",
  unfit: "bg-red-100 text-red-700 border border-red-200",
  fit_with_rest: "bg-amber-100 text-amber-700 border border-amber-200",
  pending: "bg-slate-100 text-slate-700 border border-slate-200",
};

const TEST_STATUS_COLORS = {
  pass: "bg-green-100 text-green-700 border border-green-200",
  fail: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-slate-100 text-slate-700 border border-slate-200",
};

const MedicalTab = ({ drive, onRefresh }) => {
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCadets, setSelectedCadets] = useState([]);

  // Collapsible state per group
  const [expandedGroups, setExpandedGroups] = useState({
    confirmed: false,
    collected_academic: false,
    moved_to_document: false,
    pending_other: false,
  });

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [academicModalData, setAcademicModalData] = useState(null);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    confirm: false,
    academic: false,
    documents: false,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  const fetchData = useCallback(async (isFreshLoad = false) => {
    try {
      setLoading(true);
      const [cadetResponse, centerResponse, reportsResponse] = await Promise.all([
        api.get(`/recruitment-drives/${drive.id}/cadets?queue=medical`),
        api.get("/medical-centers"),
        api.get("/medical-reports"),
      ]);

      const cadetsList = cadetResponse.data?.data || [];
      setCadets(cadetsList);
      setMedicalCenters(centerResponse.data?.data || []);
      setMedicalReports(reportsResponse.data?.data || []);

      if (isFreshLoad) {
        const groups = {
          confirmed: [],
          collected_academic: [],
          moved_to_document: [],
          pending_other: [],
        };

        cadetsList.forEach((cadet) => {
          if (cadet.workflow_phase === "selected") {
            groups.moved_to_document.push(cadet);
          } else if (cadet.workflow_result === "academic_data_collected") {
            groups.collected_academic.push(cadet);
          } else if (cadet.workflow_result === "confirmed") {
            groups.confirmed.push(cadet);
          } else {
            groups.pending_other.push(cadet);
          }
        });

        setExpandedGroups({
          confirmed: groups.confirmed.length > 0,
          collected_academic: groups.collected_academic.length > 0,
          moved_to_document: groups.moved_to_document.length > 0,
          pending_other: groups.pending_other.length > 0,
        });
      } else {
        // Just auto-collapse any group that became empty
        const groups = {
          confirmed: 0,
          collected_academic: 0,
          moved_to_document: 0,
          pending_other: 0,
        };

        cadetsList.forEach((cadet) => {
          if (cadet.workflow_phase === "selected") {
            groups.moved_to_document++;
          } else if (cadet.workflow_result === "academic_data_collected") {
            groups.collected_academic++;
          } else if (cadet.workflow_result === "confirmed") {
            groups.confirmed++;
          } else {
            groups.pending_other++;
          }
        });

        setExpandedGroups((prev) => {
          const nextState = { ...prev };
          let changed = false;
          Object.keys(groups).forEach((key) => {
            if (groups[key] === 0 && prev[key]) {
              nextState[key] = false;
              changed = true;
            }
          });
          return changed ? nextState : prev;
        });
      }
    } catch (error) {
      console.error("Error fetching medical queue:", error);
      toast.error("Failed to load medical queue");
    } finally {
      setLoading(false);
    }
  }, [drive.id]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);



  const filteredCadets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return cadets.filter((cadet) => {
      if (!normalizedSearch) return true;

      return (
        cadet.name_as_in_indos_cert?.toLowerCase().includes(normalizedSearch) ||
        cadet.cadet_unique_id?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [cadets, searchTerm]);

  const groupedCadets = useMemo(() => {
    const groups = {
      confirmed: [],
      collected_academic: [],
      moved_to_document: [],
      pending_other: [],
    };

    filteredCadets.forEach((cadet) => {
      if (cadet.workflow_phase === "selected") {
        groups.moved_to_document.push(cadet);
      } else if (
        cadet.workflow_result === "academic_data_collected"
      ) {
        groups.collected_academic.push(cadet);
      } else if (cadet.workflow_result === "confirmed") {
        groups.confirmed.push(cadet);
      } else {
        groups.pending_other.push(cadet);
      }
    });

    return groups;
  }, [filteredCadets]);

  // const getPaginatedGroup = useCallback((key) => {
  //   const list = groupedCadets[key] || [];
  //   const page = currentPages[key] || 1;
  //   const limit = perPages[key] || 10;
  //   const start = (page - 1) * limit;
  //   return list.slice(start, start + limit);
  // }, [groupedCadets, currentPages, perPages]);

  const selectedRows = useMemo(
    () => cadets.filter((cadet) => selectedCadets.includes(cadet.id)),
    [cadets, selectedCadets],
  );



  const hasSelection = selectedRows.length > 0;

  const handleSendInvites = async (formData, submissions) => {
    try {
      setSendingInvites(true);
      const cadetPayload = submissions.map((entry) => {
        const center = medicalCenters.find(
          (item) => item.id === entry.medical_center_id,
        );

        return {
          ...entry,
          medical_center_name: center?.center_name || "",
          medical_location: center?.center_name || "",
        };
      });

      await api.post(`/recruitment-drives/${drive.id}/send-medical-invites`, {
        cadets: cadetPayload,
      });
      toast.success("Medical invites sent successfully");
      setIsInviteOpen(false);
      setSelectedCadets([]);
      await fetchData();
      await onRefresh?.();
    } catch (error) {
      console.error("Error sending medical invites:", error);
      const data = error.response?.data;
      toast.error(
        data?.error || data?.message || "Failed to send medical invites",
      );
    } finally {
      setSendingInvites(false);
    }
  };

  const runBulkAction = async (actionKey, request) => {
    try {
      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
      await request();
      if (actionKey === "confirm") {
        setExpandedGroups((prev) => ({
          ...prev,
          pending_other: false,
          confirmed: true,
        }));
      } else if (actionKey === "documents") {
        setExpandedGroups((prev) => ({
          ...prev,
          collected_academic: false,
          moved_to_document: true,
        }));
      }
      await fetchData();
      await onRefresh?.();
    } catch (error) {
      console.error(`Error running ${actionKey} action:`, error);
      toast.error(
        error.response?.data?.message || "Unable to complete this action",
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleStartMedicalResultClick = useCallback(
    (row) => {
      const navigateToForm = () => navigate(`/cadets/medical/${row.id}`);
      if (!Number(row.institute_detail_filled || 0)) {
        setConfirmTitle("Pending Institute Details");
        setConfirmMessage(`Cadet ${row.name_as_in_indos_cert}'s institute details are pending. Do you want to proceed to recording medical results anyway?`);
        setConfirmAction({ execute: navigateToForm });
        setShowConfirmModal(true);
      } else {
        navigateToForm();
      }
    },
    [navigate]
  );

  const handleSendMedicalInviteClick = () => {
    const hasPending = selectedRows.some(row => !Number(row.institute_detail_filled || 0));
    if (hasPending) {
      setConfirmTitle("Pending Institute Details");
      setConfirmMessage("Some of the selected cadets have pending institute details. Do you want to proceed with sending medical invites?");
      setConfirmAction({ execute: () => setIsInviteOpen(true) });
      setShowConfirmModal(true);
    } else {
      setIsInviteOpen(true);
    }
  };

  const handleMoveDocumentsClick = (groupSelectedRows) => {
    const hasPending = groupSelectedRows.some(row => !Number(row.institute_detail_filled || 0));
    const runAction = () => {
      runBulkAction("documents", async () => {
        await api.post("/medical-results/bulk/collect-documents", {
          drive_id: drive.id,
          cadet_ids: groupSelectedRows.map((c) => c.id),
        });
        toast.success("Candidate document request sent");
      });
    };
    if (hasPending) {
      setConfirmTitle("Pending Institute Details");
      setConfirmMessage("Some of the selected cadets have pending institute details. Do you want to proceed with moving them to the document process?");
      setConfirmAction({ execute: runAction });
      setShowConfirmModal(true);
    } else {
      runAction();
    }
  };

  const handleCollectAcademicData = async () => {
    try {
      setActionLoading((prev) => ({ ...prev, academic: true }));
      
      const payload = {
        drive_id: drive.id,
        cadet_ids: academicModalData.map((c) => c.id),
      };

      await api.post("/medical-results/bulk/collect-academic", payload);
      toast.success("Pending academic data request sent");
      setAcademicModalData(null);
      setExpandedGroups((prev) => ({
        ...prev,
        confirmed: false,
        collected_academic: true,
      }));
      await fetchData();
      await onRefresh?.();
    } catch (error) {
      console.error("Error collecting academic data:", error);
      toast.error(
        error.response?.data?.message || "Failed to collect academic data",
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, academic: false }));
    }
  };

  const baseColumns = useMemo(
    () => [
      {
        field: "cadet_unique_id",
        headerName: "Cadet ID",
        width: "130px",
        renderCell: ({ value }) => (
          <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase text-indigo-700">
            {value || "-"}
          </span>
        ),
      },
      {
        field: "name_as_in_indos_cert",
        headerName: "Name",
        width: "200px",
        renderCell: ({ row }) => (
          <span
            className="block truncate font-medium text-slate-900"
            title={row.name_as_in_indos_cert}
          >
            {row.name_as_in_indos_cert}
          </span>
        ),
      },
      {
        field: "workflow_status",
        headerName: "Status",
        width: "180px",
        renderCell: ({ row }) => {
          const statusConfig = getWorkflowStatusConfig(row);
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          );
        },
      },
      {
        field: "medical_date",
        headerName: "Medical Date",
        width: "130px",
        renderCell: ({ value }) => formatDateForDisplay(value),
      },
      {
        field: "medical_time",
        headerName: "Time",
        width: "100px",
        renderCell: ({ value }) => value || "-",
      },
      {
        field: "medical_email_date",
        headerName: "Email Sent",
        width: "110px",
        renderCell: ({ value }) =>
          value ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Yes
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              No
            </span>
          ),
      },
      {
        field: "medical_email_date_val",
        headerName: "Email Date",
        width: "130px",
        renderCell: ({ row }) => formatDateForDisplay(row.medical_email_date),
      },
      {
        field: "medical_center_name",
        headerName: "Medical Center",
        width: "180px",
        renderCell: ({ value }) => value || "-",
      },
    ],
    []
  );

  const pendingOtherColumns = useMemo(
    () => [
      {
        field: "assessment_score",
        headerName: "Assessment Score",
        width: "140px",
        renderCell: ({ row, value }) => {
          const score = value ?? row.calculated_score;
          return score || score === 0 ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {Number(score).toFixed(2)}
            </span>
          ) : (
            "-"
          );
        },
      },
      {
        field: "evaluation_score",
        headerName: "Interview Score",
        width: "130px",
        renderCell: ({ value }) => value || "-",
      },
      {
        field: "total_score",
        headerName: "Total Interview Score",
        width: "160px",
        renderCell: ({ value }) =>
          value || value === 0 ? (
            <span className="font-semibold text-slate-700">{Number(value).toFixed(2)}</span>
          ) : (
            "-"
          ),
      },
      {
        field: "interview_final_decision",
        headerName: "Interview Decision",
        width: "155px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = INTERVIEW_DECISION_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
    ],
    []
  );

  const confirmedColumns = useMemo(
    () => [
      {
        field: "medical_final_decision",
        headerName: "Medical Decision",
        width: "140px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = MEDICAL_DECISION_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "fit_status",
        headerName: "Fit Status",
        width: "180px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const label = FIT_STATUS_LABELS[normalized] || value;
          const tone = FIT_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
              {label}
            </span>
          );
        },
      },
      {
        field: "psychometric_status",
        headerName: "Psychometric",
        width: "125px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = TEST_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "profiling_status",
        headerName: "Profiling",
        width: "110px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = TEST_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "medical_remarks",
        headerName: "Remarks",
        width: "180px",
        renderCell: ({ value }) => (
          <span className="block truncate text-slate-600" title={value}>
            {value || "-"}
          </span>
        ),
      },
    ],
    []
  );

  const academicColumns = useMemo(
    () => [
      {
        field: "tenth_avg_percentage",
        headerName: "10th Avg %",
        width: "110px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "twelfth_pcm_avg_percentage",
        headerName: "12th PCM %",
        width: "120px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "twelfth_std_english",
        headerName: "12th English",
        width: "110px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_avg_all_semester_percentage",
        headerName: "IMU Avg %",
        width: "110px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_1_percentage",
        headerName: "Sem 1 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_2_percentage",
        headerName: "Sem 2 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_3_percentage",
        headerName: "Sem 3 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_4_percentage",
        headerName: "Sem 4 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_5_percentage",
        headerName: "Sem 5 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_6_percentage",
        headerName: "Sem 6 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_7_percentage",
        headerName: "Sem 7 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "imu_sem_8_percentage",
        headerName: "Sem 8 %",
        width: "90px",
        align: "center",
        renderCell: ({ value }) => formatPercentage(value),
      },
      {
        field: "assessment_score",
        headerName: "Assessment Score",
        width: "140px",
        renderCell: ({ row, value }) => {
          const score = value ?? row.calculated_score;
          return score || score === 0 ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {Number(score).toFixed(2)}
            </span>
          ) : (
            "-"
          );
        },
      },
      {
        field: "medical_final_decision",
        headerName: "Medical Decision",
        width: "140px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = MEDICAL_DECISION_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "psychometric_status",
        headerName: "Psychometric",
        width: "125px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = TEST_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "profiling_status",
        headerName: "Profiling",
        width: "110px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = TEST_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "medical_remarks",
        headerName: "Remarks",
        width: "180px",
        renderCell: ({ value }) => (
          <span className="block truncate text-slate-600" title={value}>
            {value || "-"}
          </span>
        ),
      },
    ],
    []
  );

  const movedToDocumentColumns = useMemo(
    () => [
      {
        field: "medical_final_decision",
        headerName: "Medical Decision",
        width: "140px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = MEDICAL_DECISION_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "fit_status",
        headerName: "Fit Status",
        width: "180px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const label = FIT_STATUS_LABELS[normalized] || value;
          const tone = FIT_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
              {label}
            </span>
          );
        },
      },
      {
        field: "psychometric_status",
        headerName: "Psychometric",
        width: "125px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = TEST_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
      {
        field: "profiling_status",
        headerName: "Profiling",
        width: "110px",
        renderCell: ({ value }) => {
          if (!value) return "-";
          const normalized = value.toLowerCase();
          const tone = TEST_STATUS_COLORS[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
              {value}
            </span>
          );
        },
      },
    ],
    []
  );

  const actionsColumn = useMemo(
    () => ({
      field: "actions",
      headerName: "Actions",
      width: "120px",
      sortable: false,
      sticky: "right",
      cellClassName: "bg-white",
      align: "right",
      renderCell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStartMedicalResultClick(row)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title={
              row.medical_result_id
                ? "Edit medical result"
                : "Start medical result"
            }
          >
            {row.medical_result_id ? <Edit size={16} /> : <Plus size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/cadets/view/${row.id}`, "_blank")}
            className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            title="View cadet profile"
          >
            <Eye size={16} />
          </Button>
        </div>
      ),
    }),
    [handleStartMedicalResultClick]
  );

  const getColumnsForGroup = useCallback(
    (groupKey) => {
      switch (groupKey) {
        case "pending_other":
          return [...baseColumns, ...pendingOtherColumns, actionsColumn];
        case "confirmed":
          return [...baseColumns, ...confirmedColumns, actionsColumn];
        case "collected_academic":
          return [...baseColumns, ...academicColumns, actionsColumn];
        case "moved_to_document":
          return [...baseColumns, ...movedToDocumentColumns, actionsColumn];
        default:
          return [...baseColumns, actionsColumn];
      }
    },
    [
      baseColumns,
      pendingOtherColumns,
      confirmedColumns,
      academicColumns,
      movedToDocumentColumns,
      actionsColumn,
    ]
  );

  const medicalCenterOptions = medicalCenters.map((center) => ({
    label: center.center_name,
    value: center.id,
  }));

  if (loading && cadets.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Medical Queue
          </h2>
          <p className="text-sm text-slate-500">
            Interview-selected cadets move here for medical, psychometric, and
            profiling updates.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search cadets..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleSendMedicalInviteClick}
            disabled={!hasSelection}
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Send className="h-4 w-4" />
            Send Medical Invite
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(GROUP_CONFIGS).map(([key, config]) => {
          const list = groupedCadets[key] || [];
          // const paginatedList = getPaginatedGroup(key);
          const isExpanded = expandedGroups[key];

          const groupSelectedRows = selectedRows.filter((cadet) =>
            list.some((item) => item.id === cadet.id),
          );

          let actionButton = null;
          if (key === "pending_other") {
            const hasNonPassed = groupSelectedRows.some((c) => c.workflow_result !== "medical_passed");
            actionButton = (
              <Button
                size="sm"
                onClick={() =>
                  runBulkAction("confirm", async () => {
                    await api.post("/medical-results/bulk/confirm", {
                      drive_id: drive.id,
                      cadet_ids: groupSelectedRows.map((c) => c.id),
                    });
                    toast.success(
                      "Selected-candidate confirmation sent to institute",
                    );
                  })
                }
                disabled={
                  actionLoading.confirm || groupSelectedRows.length === 0 || hasNonPassed
                }
                title={
                  hasNonPassed
                    ? "Only cadets who have passed the medical exam can be confirmed"
                    : ""
                }
                className="gap-2 bg-green-600 text-white hover:bg-green-700 shadow-sm"
              >
                {actionLoading.confirm ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Confirm Cadets
              </Button>
            );
          } else if (key === "confirmed") {
            actionButton = (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAcademicModalData(groupSelectedRows)}
                disabled={
                  actionLoading.academic || groupSelectedRows.length === 0
                }
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {actionLoading.academic ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Collect Academic Data
              </Button>
            );
          } else if (key === "collected_academic") {
            const hasPendingMedical = groupSelectedRows.some((c) => !c.medical_result_id);
            actionButton = (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMoveDocumentsClick(groupSelectedRows)}
                disabled={
                  actionLoading.documents ||
                  groupSelectedRows.length === 0 ||
                  hasPendingMedical
                }
                title={
                  hasPendingMedical
                    ? "Medical Examination must be completed for all selected candidates"
                    : ""
                }
                className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                {actionLoading.documents ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Move document process
              </Button>
            );
          }

          return (
            <div
              key={key}
              className={`rounded-xl border ${config.borderColor} overflow-hidden bg-white shadow-sm`}
            >
              <div
                className={`flex w-full items-center justify-between p-4 transition-colors ${config.bgColor} border-b ${config.borderColor}`}
              >
                <div
                  onClick={() => toggleGroup(key)}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <span
                    className={`text-base font-semibold ${config.textColor}`}
                  >
                    {config.label}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.badgeColor}`}
                  >
                    {list.length}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {actionButton}
                  <button
                    type="button"
                    onClick={() => toggleGroup(key)}
                    className={`p-1 rounded hover:bg-black/5 ${config.textColor}`}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="overflow-hidden">
                  <ReusableDataTable
                    columns={getColumnsForGroup(key)}
                    rows={list}
                    loading={loading}
                    checkboxSelection
                    rowSelectionModel={selectedCadets}
                    onRowSelectionModelChange={setSelectedCadets}
                    emptyMessage={
                      searchTerm
                        ? `No cadets found in this group matching "${searchTerm}"`
                        : `No cadets in ${config.label.toLowerCase()}`
                    }
                    hidePagination
                    hideSelectedCount
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <StageInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleSendInvites}
        title="Send Medical Invites"
        description="Set the medical center, appointment schedule, and remarks for each selected cadet."
        cadets={selectedRows}
        loading={sendingInvites}
        fields={[
          {
            key: "appointments",
            label: "Appointments",
            type: "repeater",
            addLabel: "Appointment",
            subFields: [
              {
                key: "medical_date",
                label: "Medical Date",
                type: "date",
                required: true,
              },
              {
                key: "medical_time",
                label: "Medical Time",
                type: "time",
                required: true,
              },
              {
                key: "medical_center_id",
                label: "Medical Center",
                type: "select",
                required: true,
                options: medicalCenterOptions,
                placeholder: "Select medical center",
              },
              {
                key: "medical_reports",
                label: "Medical Reports",
                type: "multiselect",
                placeholder: "Select reports",
                getOptions: (block) => {
                  const centerId = block?.medical_center_id;
                  if (!centerId) return [];
                  const center = medicalCenters.find(c => String(c.id) === String(centerId));
                  if (!center || !center.medical_reports) return [];
                  let reportIds = [];
                  try {
                    reportIds = typeof center.medical_reports === 'string' 
                      ? JSON.parse(center.medical_reports) 
                      : center.medical_reports;
                  } catch (e) {
                    return [];
                  }
                  if (!Array.isArray(reportIds)) return [];
                  
                  return reportIds.map(rId => {
                    const r = medicalReports.find(mr => String(mr.id) === String(rId));
                    return { value: rId, label: r ? r.name : rId };
                  });
                }
              }
            ]
          },
          {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Add medical instructions or remarks",
          },
        ]}
      />

      {academicModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">
              Collect Academic Data
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to request academic data for the following {academicModalData.length} cadet(s)?
            </p>
            <div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3">
              <ul className="space-y-1.5 text-sm text-slate-700">
                {academicModalData.map((cadet) => (
                  <li key={cadet.id} className="flex justify-between">
                    <span className="font-medium">{cadet.name_as_in_indos_cert}</span>
                    <span className="text-xs text-slate-500">{cadet.cadet_unique_id}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAcademicModalData(null)}
                disabled={actionLoading.academic}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCollectAcademicData}
                disabled={actionLoading.academic}
              >
                {actionLoading.academic ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={() => {
          setShowConfirmModal(false);
          if (confirmAction?.execute) {
            confirmAction.execute();
          }
          setConfirmAction(null);
        }}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Yes"
        cancelText="No"
      />
    </div>
  );
};

export default MedicalTab;
