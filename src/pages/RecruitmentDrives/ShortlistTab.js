import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Eye, Loader2, Search, Send } from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";

const ShortlistTab = ({
  drive,
  canSendShortlistEmail,
  onSendShortlistEmail,
  sendingShortlist,
  refreshTrigger,
  onRefresh,
}) => {
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCadets, setSelectedCadets] = useState([]);
  const [submittingShortlist, setSubmittingShortlist] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/recruitment-drives/${drive.id}/cadets?queue=all`,
      );
      const driveCadets = (response.data?.data || []).filter(
        (cadet) =>
          ["uploaded", "shortlisted"].includes(cadet.workflow_phase) ||
          ["pass", "fail"].includes(
            String(cadet.assessment_status || "").toLowerCase(),
          ),
      );
      setCadets(driveCadets);
      setSelectedCadets([]);
    } catch (error) {
      console.error("Error fetching shortlist cadets:", error);
      toast.error("Failed to load shortlist queue");
    } finally {
      setLoading(false);
    }
  }, [drive.id]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets, refreshTrigger]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, perPage]);

  const filteredCadets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return cadets.filter((cadet) => {
      if (!normalizedSearch) return true;

      return (
        cadet.name_as_in_indos_cert?.toLowerCase().includes(normalizedSearch) ||
        cadet.cadet_unique_id?.toLowerCase().includes(normalizedSearch) ||
        cadet.roll_no?.toLowerCase().includes(normalizedSearch) ||
        cadet.email_id?.toLowerCase().includes(normalizedSearch)
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

  const selectedForShortlist = useMemo(
    () => selectedRows.filter((cadet) => cadet.workflow_phase === "uploaded"),
    [selectedRows],
  );

  const shortlistedPendingEmail = useMemo(
    () =>
      cadets.filter(
        (cadet) =>
          cadet.workflow_phase === "shortlisted" &&
          !Number(cadet.shortlist_email_sent || 0),
      ),
    [cadets],
  );

  const handleShortlist = async () => {
    if (!selectedForShortlist.length) {
      toast.error("Select at least one uploaded cadet to shortlist");
      return;
    }

    try {
      setSubmittingShortlist(true);
      await api.post(`/recruitment-drives/${drive.id}/shortlist`, {
        cadet_ids: selectedForShortlist.map((cadet) => cadet.id),
      });
      toast.success(`${selectedForShortlist.length} cadet(s) shortlisted`);
      await fetchCadets();
      await onRefresh?.();
    } catch (error) {
      console.error("Error shortlisting cadets:", error);
      toast.error(
        error.response?.data?.message || "Failed to shortlist cadets",
      );
    } finally {
      setSubmittingShortlist(false);
    }
  };

  const handleSendEmail = async () => {
    await onSendShortlistEmail(
      shortlistedPendingEmail.map((cadet) => cadet.id),
    );
  };

  const getWorkflowBadge = (cadet) => {
    if (cadet.workflow_phase === "uploaded") {
      return "bg-blue-100 text-blue-700";
    }
    if (cadet.workflow_phase === "shortlisted") {
      return "bg-purple-100 text-purple-700";
    }
    return "bg-emerald-100 text-emerald-700";
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
      width: "220px",
      renderCell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.name_as_in_indos_cert}
          </p>
          <p className="text-xs text-slate-500">{row.email_id || "-"}</p>
        </div>
      ),
    },
    {
      field: "roll_no",
      headerName: "Roll No",
      width: "120px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "cadet_percentage",
      headerName: "%",
      width: "100px",
      renderCell: ({ value }) =>
        value || value === 0 ? `${Number(value).toFixed(2)}%` : "-",
    },
    {
      field: "status",
      headerName: "Current Stage",
      width: "140px",
      renderCell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${getWorkflowBadge(row)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      field: "cv_needed",
      headerName: "CV Needed",
      width: "110px",
      align: "center",
      renderCell: ({ value }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            value
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      field: "shortlist_email_sent",
      headerName: "Shortlist Email",
      width: "130px",
      align: "center",
      renderCell: ({ value }) =>
        Number(value) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
            <CheckCircle size={12} />
            Sent
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            Pending
          </span>
        ),
    },
    {
      field: "assessment_status",
      headerName: "Assessment Result",
      width: "140px",
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
      field: "actions",
      headerName: "Actions",
      width: "100px",
      sortable: false,
      sticky: "right",
      cellClassName: "bg-white",
      align: "right",
      renderCell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/cadets/view/${row.id}`, "_blank")}
          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          title="View cadet"
        >
          <Eye size={16} />
        </Button>
      ),
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
          <h2 className="text-xl font-semibold text-slate-900">
            Shortlist Management
          </h2>
          <p className="text-sm text-slate-500">
            Review uploaded, shortlisted, and assessed cadets here. Already
            shortlisted rows stay locked.
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
            onClick={handleShortlist}
            disabled={submittingShortlist || selectedForShortlist.length === 0}
            className="gap-2 bg-purple-600 text-white hover:bg-purple-700"
          >
            {submittingShortlist ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Shortlist Selected
          </Button>

          {canSendShortlistEmail ? (
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={
                sendingShortlist || shortlistedPendingEmail.length === 0
              }
              className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
            >
              {sendingShortlist ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Shortlist Email ({shortlistedPendingEmail.length})
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800">
        <p className="font-semibold">How this tab works</p>
        <p className="mt-1">
          `Shortlist Selected` marks uploaded cadets as shortlisted. Once
          shortlisted, rows are locked here. Assessment passed and failed cadets
          remain visible here for tracking, and `Send Shortlist Email` sends to
          all shortlisted rows that are still pending email.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <ReusableDataTable
          columns={columns}
          rows={paginatedCadets}
          loading={loading}
          checkboxSelection
          rowSelectionModel={selectedCadets}
          onRowSelectionModelChange={setSelectedCadets}
          isRowSelectable={(row) => row.workflow_phase === "uploaded"}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets available for shortlist management"
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
    </div>
  );
};

export default ShortlistTab;
