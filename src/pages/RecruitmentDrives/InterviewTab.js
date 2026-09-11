import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Edit,
  Eye,
  Plus,
  Search,
  Send,
} from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import StageInviteModal from "./StageInviteModal";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const DECISION_COLORS = {
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  waitlisted: "bg-amber-100 text-amber-700",
  pass: "bg-green-100 text-green-700",
  fail: "bg-red-100 text-red-700",
};

const getInterviewRowClassName = (cadet = {}) =>
  String(cadet.interview_final_decision || "").trim().toLowerCase() === "selected"
    ? "bg-emerald-50/50 hover:bg-emerald-50/80 [&>td:not(:last-child)]:!bg-emerald-50/50 [&:hover>td:not(:last-child)]:!bg-emerald-50/80 [&>td:last-child]:!bg-white"
    : "";

const InterviewTab = ({ drive, onRefresh, readOnly = false }) => {
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

  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/recruitment-drives/${drive.id}/cadets`, {
        params: {
          queue: "interview",
          page: currentPage,
          limit: perPage,
          search: debouncedSearchTerm || undefined,
        },
      });
      setCadets(response.data?.data || []);
      setTotalCadets(response.data?.total || 0);
    } catch (error) {
      console.error("Error fetching interview queue:", error);
      toast.error("Failed to load interview cadets");
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

  const returnTo = `/drives/${drive.id}?tab=interview`;

  const handleSendInvites = async (formData, submissions, emailOptions) => {
    try {
      setSendingInvites(true);
      await api.post(`/recruitment-drives/${drive.id}/send-interview-invites`, {
        cadets: submissions,
        cc: emailOptions?.cc,
      });
      toast.success("Interview invites sent successfully");
      setIsInviteOpen(false);
      setSelectedCadets([]);
      await fetchCadets();
      await onRefresh?.();
    } catch (error) {
      console.error("Error sending interview invites:", error);
      const data = error.response?.data;
      toast.error(
        data?.error || data?.message || "Failed to send interview invites",
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
      field: "assessment_score",
      headerName: "Assessment Score",
      width: "140px",
      align: "center",
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
      field: "interview_date",
      headerName: "Interview Date",
      width: "130px",
      renderCell: ({ value }) => formatDateForDisplay(value),
    },
    {
      field: "interview_time",
      headerName: "Time",
      width: "100px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "interview_email_date",
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
      field: "interview_email_date_val",
      headerName: "Email Date",
      width: "130px",
      renderCell: ({ row }) => formatDateForDisplay(row.interview_email_date),
    },
    {
      field: "interviewers",
      headerName: "Panel / Interviewers",
      width: "220px",
      renderCell: ({ row }) => {
        const interviewers = row.interviewers;
        if (interviewers) {
          try {
            const list = typeof interviewers === 'string' ? JSON.parse(interviewers) : interviewers;
            if (Array.isArray(list) && list.length > 0) {
              const formattedTitle = list.map((i) => `${i.name}${i.designation ? ` (${i.designation})` : ''}`).join(', ');
              return (
                <div className="flex flex-col gap-0.5 max-w-[200px] overflow-hidden py-1" title={formattedTitle}>
                  {list.map((interviewer, idx) => (
                    <span key={idx} className="truncate text-xs text-slate-700 block">
                      {interviewer.name} {interviewer.designation && (
                        <span className="text-[10px] text-slate-400 font-medium">({interviewer.designation})</span>
                      )}
                    </span>
                  ))}
                </div>
              );
            }
          } catch (e) {
            console.error('Error parsing interviewers row:', e);
          }
        }
        return <span className="block truncate text-slate-700">{row.panel_members || "-"}</span>;
      },
    },
    {
      field: "evaluation_score",
      headerName: "Score",
      width: "80px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "total_score",
      headerName: "Total",
      width: "90px",
      renderCell: ({ value }) =>
        value || value === 0 ? Number(value).toFixed(2) : "-",
    },
    {
      field: "interview_final_decision",
      headerName: "Decision",
      width: "120px",
      renderCell: ({ value }) => {
        if (!value) return "-";
        const normalized = value.toLowerCase();
        const tone = DECISION_COLORS[normalized] || "bg-slate-100 text-slate-700";
        return (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
            {value}
          </span>
        );
      },
    },
    {
      field: "interview_comments",
      headerName: "Comments",
      width: "180px",
      renderCell: ({ row }) => (
        <span
          className="block truncate text-slate-600"
          title={row.interview_comments || row.interview_remarks}
        >
          {row.interview_comments || row.interview_remarks || "-"}
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
      renderCell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(
                `/cadets/interview/${row.id}?returnTo=${encodeURIComponent(returnTo)}`,
                {
                  state: {
                    returnPath: `/drives/${drive.id}`,
                    returnState: { activeTab: "interview" },
                  },
                },
              )
            }
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title={row.interview_final_decision ? "Edit interview" : "Start interview"}
          >
            {row.interview_final_decision ? <Edit size={16} /> : <Plus size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              window.open(
                `/cadets/interview/${row.id}?returnTo=${encodeURIComponent(returnTo)}&view=true`,
                "_blank",
              )
            }
            className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            title="View interview"
          >
            <Eye size={16} />
          </Button>
        </div>
      ),
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
          <h2 className="text-xl font-semibold text-slate-900">Interview Queue</h2>
          <p className="text-sm text-slate-500">
            Only cadets marked for interview appear in this stage.
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
              onClick={() => setIsInviteOpen(true)}
              disabled={selectedRows.length === 0}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Send className="h-4 w-4" />
              Send Interview Invite
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
          rowSelectionModel={!readOnly ? selectedCadets : []}
          onRowSelectionModelChange={!readOnly ? setSelectedCadets : undefined}
          getRowClassName={getInterviewRowClassName}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets are waiting for interview"
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
          title="Send Interview Invites"
          description="Add the interview schedule, optional document link, and remarks for each selected cadet."
          cadets={selectedRows}
          loading={sendingInvites}
          fields={[
            {
              key: "interview_date",
              label: "Interview Date",
              type: "date",
              required: true,
            },
            {
              key: "interview_time",
              label: "Interview Time",
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
              placeholder: "Add interview instructions or remarks",
            },
          ]}
        />
      ) : null}
    </div>
  );
};

export default InterviewTab;
