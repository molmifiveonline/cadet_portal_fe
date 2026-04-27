import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Edit,
  Eye,
  Loader2,
  Plus,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import StageInviteModal from "./StageInviteModal";

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
  isAssessmentPassed(cadet) ||
  hasTwoCompletedAttempts(cadet) ||
  isAssessmentCompletedStatus(cadet);

const AssessmentTab = ({ drive, onRefresh }) => {
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCadets, setSelectedCadets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);

  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/recruitment-drives/${drive.id}/cadets?queue=assessment`,
      );
      setCadets(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching assessment queue:", error);
      toast.error("Failed to load assessment cadets");
    } finally {
      setLoading(false);
    }
  }, [drive.id]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, perPage]);

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

  const paginatedCadets = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredCadets.slice(start, start + perPage);
  }, [filteredCadets, currentPage, perPage]);

  const selectedRows = useMemo(
    () => cadets.filter((cadet) => selectedCadets.includes(cadet.id)),
    [cadets, selectedCadets],
  );

  const handleSendInvites = async (entries) => {
    try {
      setSendingInvites(true);
      await api.post(`/recruitment-drives/${drive.id}/send-assessment-invites`, {
        cadets: entries,
      });
      toast.success("Assessment invites sent successfully");
      setIsInviteOpen(false);
      setSelectedCadets([]);
      await fetchCadets();
      await onRefresh?.();
    } catch (error) {
      console.error("Error sending assessment invites:", error);
      toast.error(
        error.response?.data?.message || "Failed to send assessment invites",
      );
    } finally {
      setSendingInvites(false);
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
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "assessment_time",
      headerName: "Time",
      width: "100px",
      renderCell: ({ value }) => value || "-",
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
      field: "mark_for_interview",
      headerName: "Interview?",
      width: "100px",
      align: "center",
      renderCell: ({ value }) =>
        value ? (
          <CheckCircle className="mx-auto text-green-600" size={18} />
        ) : (
          <XCircle className="mx-auto text-red-600" size={18} />
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
    {
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
              onClick={() => (window.location.href = `/cadets/assess/${row.id}`)}
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              title={
                disableStartAssessment
                  ? "Assessment completed"
                  : row.assessment_id
                    ? "Edit assessment"
                    : "Start assessment"
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
    },
  ];

  if (loading && cadets.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[#3a5f9e]" size={40} />
      </div>
    );
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

          <Button
            variant="outline"
            onClick={() => setIsInviteOpen(true)}
            disabled={selectedRows.length === 0}
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Send className="h-4 w-4" />
            Send Assessment Invite
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <ReusableDataTable
          columns={columns}
          rows={paginatedCadets}
          loading={loading}
          checkboxSelection
          isRowSelectable={(row) => !isAssessmentLocked(row)}
          rowSelectionModel={selectedCadets}
          onRowSelectionModelChange={setSelectedCadets}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets are waiting for assessment"
          }
          pagination={{
            current_page: currentPage,
            per_page: perPage,
            total: filteredCadets.length,
            last_page: Math.max(1, Math.ceil(filteredCadets.length / perPage)),
          }}
          handlePageChange={setCurrentPage}
          handlePerPageChange={(limit) => {
            setPerPage(limit);
            setCurrentPage(1);
          }}
          pageSize={perPage}
        />
      </div>

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
            key: "document_link",
            label: "Document Upload Link",
            type: "url",
            placeholder: "https://...",
          },
          {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Add assessment instructions or remarks",
          },
        ]}
      />
    </div>
  );
};

export default AssessmentTab;
