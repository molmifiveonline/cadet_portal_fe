import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CheckCircle,
  Edit,
  Eye,
  Plus,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import StageInviteModal from "./StageInviteModal";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const hasAssessmentValue = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
};

const isAssessmentPassed = (cadet = {}) =>
  String(cadet.assessment_status || cadet.status || "")
    .trim()
    .toLowerCase() === "pass" ||
  String(cadet.status || "").trim().toLowerCase() === "assessment passed";

const hasTwoCompletedAttempts = (cadet = {}) =>
  hasAssessmentValue(cadet.ces_test) && hasAssessmentValue(cadet.ces_test_2);

const isAssessmentCompletedStatus = (cadet = {}) =>
  ["completed", "complete", "assessment completed"].includes(
    String(cadet.assessment_status || cadet.status || "")
      .trim()
      .toLowerCase(),
  );

const isAssessmentLocked = (cadet = {}) =>
  hasTwoCompletedAttempts(cadet) ||
  isAssessmentCompletedStatus(cadet);

const AssessmentTab = ({ drive, onRefresh, readOnly = false }) => {
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [totalCadets, setTotalCadets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const [selectedCadets, setSelectedCadets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/recruitment-drives/${drive.id}/cadets`, {
        params: {
          queue: "assessment",
          page: currentPage,
          limit: perPage,
          search: debouncedSearchTerm || undefined,
        },
      });
      setCadets(response.data?.data || []);
      setTotalCadets(response.data?.total || 0);
    } catch (error) {
      console.error("Error fetching assessment queue:", error);
      toast.error("Failed to load assessment cadets");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, drive.id, perPage]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, perPage]);

  const selectedRows = useMemo(
    () => cadets.filter((cadet) => selectedCadets.includes(cadet.id)),
    [cadets, selectedCadets],
  );

  const handleSendInvites = async (entries) => {
    try {
      setSendingInvites(true);
      await api.post(`/recruitment-drives/${drive.id}/send-assessment-invites`, entries, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Assessment invites sent successfully");
      setIsInviteOpen(false);
      setSelectedCadets([]);
      await fetchCadets();
      await onRefresh?.();
    } catch (error) {
      console.error("Error sending assessment invites:", error);
      const data = error.response?.data;
      toast.error(
        data?.error || data?.message || "Failed to send assessment invites",
      );
    } finally {
      setSendingInvites(false);
    }
  };

  const handleSendInviteClick = () => {
    const hasPending = selectedRows.some(row => !Number(row.institute_detail_filled || 0));
    if (hasPending) {
      setConfirmTitle("Pending Institute Details");
      setConfirmMessage("Some of the selected cadets have pending institute details. Do you want to proceed with sending assessment invites?");
      setConfirmAction({ execute: () => setIsInviteOpen(true) });
      setShowConfirmModal(true);
    } else {
      setIsInviteOpen(true);
    }
  };

  const handleStartAssessmentClick = (row) => {
    const navigateToForm = () => navigate(`/cadets/assess/${row.id}`);
    if (!Number(row.institute_detail_filled || 0)) {
      setConfirmTitle("Pending Institute Details");
      setConfirmMessage(`Cadet ${row.name_as_in_indos_cert}'s institute details are pending. Do you want to proceed to the assessment anyway?`);
      setConfirmAction({ execute: navigateToForm });
      setShowConfirmModal(true);
    } else {
      navigateToForm();
    }
  };

  const columns = [
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
        <span className="block truncate font-medium text-slate-900" title={row.name_as_in_indos_cert}>
          {row.name_as_in_indos_cert}
        </span>
      ),
    },
    {
      field: "assessment_date",
      headerName: "Assessment Date",
      width: "130px",
      renderCell: ({ value }) => formatDateForDisplay(value),
    },
    {
      field: "assessment_time",
      headerName: "Time",
      width: "100px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "assessment_email_date",
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
      field: "assessment_email_date_val",
      headerName: "Email Date",
      width: "130px",
      renderCell: ({ row }) => formatDateForDisplay(row.assessment_email_date),
    },
    { field: "ces_test", headerName: "CES 1", width: "80px" },
    { field: "ces_test_2", headerName: "CES 2", width: "80px" },
    { field: "qa_test", headerName: "QA", width: "80px" },
    { field: "english_test", headerName: "English", width: "90px" },
    { field: "essay_writing_mark", headerName: "Essay", width: "80px" },
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
      field: "assessment_status",
      headerName: "Result",
      width: "110px",
      align: "center",
      renderCell: ({ value }) => {
        const normalized = String(value || "").toLowerCase();
        if (normalized === "pass") {
          return (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              Passed
            </span>
          );
        }
        if (normalized === "fail") {
          return (
            <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
              Failed
            </span>
          );
        }
        return (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            Pending
          </span>
        );
      },
    },
    {
      field: "institute_detail_filled",
      headerName: "Inst. Details",
      width: "120px",
      align: "center",
      renderCell: ({ value }) =>
        Number(value) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Filled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">
            Pending
          </span>
        ),
    },
    {
      field: "assessment_remarks",
      headerName: "Remarks",
      width: "180px",
      renderCell: ({ value }) => (
        <span className="block truncate text-slate-600" title={value}>
          {value || "-"}
        </span>
      ),
    },
    !readOnly
      ? {
      field: "actions",
      headerName: "Actions",
      width: "120px",
      sortable: false,
      sticky: "right",
      cellClassName: "bg-white",
      align: "right",
      renderCell: ({ row }) => {
        const disableStartAssessment = isAssessmentLocked(row);
        
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={disableStartAssessment}
              onClick={() => handleStartAssessmentClick(row)}
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              title={
                disableStartAssessment
                  ? "Assessment completed"
                  : `${row.assessment_id ? "Edit assessment" : "Start assessment"}${!Number(row.institute_detail_filled || 0) ? " (Pending institute details)" : ""}`
              }
            >
              {row.assessment_id ? <Edit size={16} /> : <Plus size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/cadets/assess/${row.id}`, "_blank")}
              className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              title="View assessment"
            >
              <Eye size={16} />
            </Button>
          </div>
        );
      },
    }
      : null,
  ].filter(Boolean);

  if (loading && cadets.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Assessment Queue</h2>
          <p className="text-sm text-slate-500">
            Shortlisted, in-progress, and failed assessment cadets appear here for scoring and reassessment.
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

          {!readOnly ? (
            <Button
              variant="outline"
              onClick={handleSendInviteClick}
              disabled={selectedRows.length === 0}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Send className="h-4 w-4" />
              Send Assessment Invite
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <ReusableDataTable
          columns={columns}
          rows={cadets}
          loading={loading}
          checkboxSelection={!readOnly}
          isRowSelectable={!readOnly ? (row) => !isAssessmentLocked(row) : undefined}
          rowSelectionModel={!readOnly ? selectedCadets : []}
          onRowSelectionModelChange={!readOnly ? setSelectedCadets : undefined}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets are waiting for assessment"
          }
          pagination={{
            current_page: currentPage,
            per_page: perPage,
            total: totalCadets,
            last_page: Math.max(1, Math.ceil(totalCadets / perPage)),
          }}
          handlePageChange={setCurrentPage}
          handlePerPageChange={(limit) => {
            setPerPage(limit);
            setCurrentPage(1);
          }}
          pageSize={perPage}
        />
      </div>

      {!readOnly ? (
        <StageInviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onSubmit={handleSendInvites}
          title="Send Assessment Invites"
          description="Add the assessment schedule, optional upload link, and remarks for each selected cadet."
          cadets={selectedRows}
          loading={sendingInvites}
          fields={[
            {
              key: "assessment_date",
              label: "Assessment Date",
              type: "date",
              required: true,
            },
            {
              key: "assessment_time",
              label: "Assessment Time",
              type: "time",
              required: true,
            },
            {
              key: "assessment_document",
              label: "Upload Document",
              type: "file",
              global: true,
            },
            {
              key: "remarks",
              label: "Remarks",
              type: "textarea",
              placeholder: "Add assessment instructions or remarks",
            },
          ]}
        />
      ) : null}
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

export default AssessmentTab;
