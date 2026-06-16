import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Eye, Search, Send, Edit, X } from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import { useNavigate } from "react-router-dom";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import { getShortlistCriteriaStatus } from "../../lib/utils/shortlistCriteria";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const formatPercentage = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)}%` : "-";
};

const ShortlistTab = ({
  drive,
  canSendShortlistEmail,
  onSendShortlistEmail,
  sendingShortlist,
  refreshTrigger,
  onRefresh,
  isInstituteUser = false,
}) => {
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [totalCadets, setTotalCadets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const [selectedCadets, setSelectedCadets] = useState([]);
  const [submittingShortlist, setSubmittingShortlist] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/recruitment-drives/${drive.id}/cadets`, {
        params: {
          queue: "shortlist",
          page: currentPage,
          limit: perPage,
          search: debouncedSearchTerm || undefined,
          excludeUploaded: isInstituteUser ? "true" : undefined,
        },
      });
      setCadets(response.data?.data || []);
      setTotalCadets(response.data?.total || 0);
      setSelectedCadets([]);
    } catch (error) {
      console.error("Error fetching shortlist cadets:", error);
      toast.error("Failed to load shortlist queue");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, drive.id, isInstituteUser, perPage]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets, refreshTrigger]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, perPage]);

  const sortedCadets = useMemo(() => {
    const statusOrder = { passed: 1, missing_twelfth: 2, failed: 3 };

    return [...cadets].sort((a, b) => {
      const statusA = getShortlistCriteriaStatus(a).type;
      const statusB = getShortlistCriteriaStatus(b).type;
      return (statusOrder[statusA] || 4) - (statusOrder[statusB] || 4);
    });
  }, [cadets]);

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

  const handleShortlist = () => {
    if (!selectedForShortlist.length) {
      toast.error("Select at least one uploaded cadet to shortlist");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeShortlist = async () => {
    setShowConfirmModal(false);
    try {
      setSubmittingShortlist(true);
      const cadetIds = selectedForShortlist.map((cadet) => cadet.id);

      await api.post(`/recruitment-drives/${drive.id}/shortlist`, {
        cadet_ids: cadetIds,
      });
      toast.success(`${selectedForShortlist.length} cadet(s) shortlisted`);

      if (canSendShortlistEmail && onSendShortlistEmail) {
        await onSendShortlistEmail(cadetIds);
      }

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
      field: "tenth_avg_percentage",
      headerName: "10th Avg",
      width: "110px",
      align: "center",
      renderCell: ({ value }) => formatPercentage(value),
    },
    {
      field: "twelfth_pcm_avg_percentage",
      headerName: "12th PCM Avg",
      width: "130px",
      align: "center",
      renderCell: ({ value }) => formatPercentage(value),
    },
    {
      field: "twelfth_std_english",
      headerName: "12th English",
      width: "120px",
      align: "center",
      renderCell: ({ value }) => formatPercentage(value),
    },
    {
      field: "criteria_status",
      headerName: "Criteria",
      width: "150px",
      align: "center",
      renderCell: ({ row }) => {
        const criteriaStatus = getShortlistCriteriaStatus(row);
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${criteriaStatus.badgeClassName}`}
          >
            {criteriaStatus.label}
          </span>
        );
      },
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
      field: "shortlist_email_sent",
      headerName: "Email Sent",
      width: "110px",
      align: "center",
      renderCell: ({ value, row }) =>
        Number(value) || row.shortlist_email_date ? (
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
      field: "shortlist_email_date_val",
      headerName: "Email Date",
      width: "130px",
      renderCell: ({ row }) => formatDateForDisplay(row.shortlist_email_date),
    },
    {
      field: "institute_detail_filled",
      headerName: "Institute Details",
      width: "150px",
      align: "center",
      renderCell: ({ value }) =>
        Number(value) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle size={12} />
            Filled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
            Pending
          </span>
        ),
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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/cadets/view/${row.id}`, "_blank")}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title="View cadet"
          >
            <Eye size={16} />
          </Button>
          {isInstituteUser && row.can_edit_pending_details && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/cadets/fill-details/${row.id}`, {
                  state: {
                    returnPath: `/drives/${drive.id}`,
                    returnState: { activeTab: "shortlist" },
                  },
                })
              }
              className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
              title="Edit details"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading && cadets.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(620px,auto)] xl:items-start">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900">
            Shortlist Management
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Review uploaded, shortlisted, and assessed cadets here. Already
            shortlisted rows stay locked.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto] sm:items-start xl:justify-end">
          <div className="relative min-w-0 sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search cadets..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 pl-10"
            />
          </div>

          {!isInstituteUser && (
            <>
              <Button
                onClick={handleShortlist}
                disabled={submittingShortlist || sendingShortlist || selectedForShortlist.length === 0}
                className="h-11 min-w-[178px] gap-2 whitespace-nowrap bg-purple-600 px-5 text-white hover:bg-purple-700"
              >
                {submittingShortlist || sendingShortlist ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {canSendShortlistEmail ? "Shortlist & Send Email" : "Shortlist Selected"}
              </Button>

              {canSendShortlistEmail && shortlistedPendingEmail.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  disabled={
                    sendingShortlist || shortlistedPendingEmail.length === 0
                  }
                  className="h-11 min-w-[230px] gap-2 whitespace-nowrap border-amber-200 px-5 text-amber-700 hover:bg-amber-50"
                >
                  {sendingShortlist ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Pending Emails ({shortlistedPendingEmail.length})
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
        {isInstituteUser ? (
          <p>
            Review your shortlisted cadets for this drive. You can update their
            pending details by clicking the edit icon in the actions column.
          </p>
        ) : (
          <p>
            <span className="font-semibold">Shortlist & Send Email</span> locks
            uploaded cadets as shortlisted and sends them a notification. Assessment results remain visible
            here. If any emails fail to send, a retry button will appear.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <ReusableDataTable
          columns={columns}
          rows={sortedCadets}
          loading={loading}
          checkboxSelection={!isInstituteUser}
          rowSelectionModel={selectedCadets}
          onRowSelectionModelChange={setSelectedCadets}
          isRowSelectable={(row) => !isInstituteUser && row.workflow_phase === "uploaded"}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets available for shortlist management"
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
          getRowClassName={(row) => getShortlistCriteriaStatus(row).rowClassName}
          pageSize={perPage}
        />
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {canSendShortlistEmail ? "Confirm Shortlist & Email" : "Confirm Shortlist"}
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {canSendShortlistEmail
                  ? "This will shortlist the selected cadets and send an email to the institute. The email will also request the institute to update any pending details for these cadets."
                  : "This will shortlist the selected cadets."}
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected Cadets ({selectedForShortlist.length})
                </label>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                  {selectedForShortlist.map((cadet) => (
                    <div key={cadet.id} className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-100 shadow-sm text-sm">
                      <span className="font-semibold text-slate-800">{cadet.name_as_in_indos_cert}</span>
                      <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase">
                        {cadet.cadet_unique_id || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={executeShortlist}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                {canSendShortlistEmail ? "Confirm & Send" : "Confirm Shortlist"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistTab;
