import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import StageInviteModal from "./StageInviteModal";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";

const getWorkflowStatusConfig = (cadet) => {
  if (cadet.workflow_phase === "selected") {
    return {
      label: "Moved to Documents",
      className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    };
  }
  if (Number(cadet.institute_detail_filled || 0) === 1) {
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
  if (cadet.workflow_result === "failed" || cadet.rejection_stage === "medical") {
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
  confirmed: {
    label: "Confirmed Candidates",
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
  pending_other: {
    label: "Pending / Other",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-800",
    badgeColor: "bg-slate-100 text-slate-700",
  },
};

const MedicalTab = ({ drive, onRefresh }) => {
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCadets, setSelectedCadets] = useState([]);
  // Independent pagination states per group
  const [currentPages, setCurrentPages] = useState({
    confirmed: 1,
    collected_academic: 1,
    moved_to_document: 1,
    pending_other: 1,
  });
  const [perPages, setPerPages] = useState({
    confirmed: 10,
    collected_academic: 10,
    moved_to_document: 10,
    pending_other: 10,
  });

  // Collapsible state per group
  const [expandedGroups, setExpandedGroups] = useState({
    confirmed: true,
    collected_academic: true,
    moved_to_document: true,
    pending_other: true,
  });

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    confirm: false,
    academic: false,
    documents: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cadetResponse, centerResponse] = await Promise.all([
        api.get(`/recruitment-drives/${drive.id}/cadets?queue=medical`),
        api.get("/medical-centers"),
      ]);

      setCadets(cadetResponse.data?.data || []);
      setMedicalCenters(centerResponse.data?.data || []);
    } catch (error) {
      console.error("Error fetching medical queue:", error);
      toast.error("Failed to load medical queue");
    } finally {
      setLoading(false);
    }
  }, [drive.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page numbers on search
  useEffect(() => {
    setCurrentPages({
      confirmed: 1,
      collected_academic: 1,
      moved_to_document: 1,
      pending_other: 1,
    });
  }, [searchTerm]);

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
      } else if (Number(cadet.institute_detail_filled || 0) === 1) {
        groups.collected_academic.push(cadet);
      } else if (cadet.workflow_result === "confirmed") {
        groups.confirmed.push(cadet);
      } else {
        groups.pending_other.push(cadet);
      }
    });

    return groups;
  }, [filteredCadets]);

  const getPaginatedGroup = useCallback((key) => {
    const list = groupedCadets[key] || [];
    const page = currentPages[key] || 1;
    const limit = perPages[key] || 10;
    const start = (page - 1) * limit;
    return list.slice(start, start + limit);
  }, [groupedCadets, currentPages, perPages]);

  const selectedRows = useMemo(
    () => cadets.filter((cadet) => selectedCadets.includes(cadet.id)),
    [cadets, selectedCadets],
  );

  const allSelectedAreConfirmed = useMemo(
    () => selectedRows.length > 0 && selectedRows.every(
      (cadet) => ["confirmed", "medical_passed"].includes(cadet.workflow_result)
    ),
    [selectedRows]
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
      field: "workflow_status",
      headerName: "Status",
      width: "180px",
      renderCell: ({ row }) => {
        const statusConfig = getWorkflowStatusConfig(row);
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.className}`}>
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
    {
      field: "medical_final_decision",
      headerName: "Decision",
      width: "110px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "psychometric_status",
      headerName: "Psychometric",
      width: "120px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "profiling_status",
      headerName: "Profiling",
      width: "110px",
      renderCell: ({ value }) => value || "-",
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
    {
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
            onClick={() => navigate(`/cadets/medical/${row.id}`)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title={row.medical_result_id ? "Edit medical result" : "Start medical result"}
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
    },
  ];

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
          <h2 className="text-xl font-semibold text-slate-900">Medical Queue</h2>
          <p className="text-sm text-slate-500">
            Interview-selected cadets move here for medical, psychometric, and profiling updates.
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
            disabled={!hasSelection}
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Send className="h-4 w-4" />
            Send Medical Invite
          </Button>
        </div>
      </div>

      <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-opacity ${!hasSelection ? 'opacity-60' : ''}`}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Post-Medical Actions
        </h3>
        {!hasSelection ? (
          <p className="mt-1 text-xs text-amber-600">
            Select one or more candidates from the table below to enable these actions.
          </p>
        ) : !allSelectedAreConfirmed ? (
          <p className="mt-1 text-xs text-amber-600">
            Confirm candidates first to enable academic data collection, and document collection.
          </p>
        ) : null}
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() =>
                runBulkAction("confirm", async () => {
                  await api.post("/medical-results/bulk/confirm", {
                    drive_id: drive.id,
                    cadet_ids: selectedRows.map((c) => c.id),
                  });
                  toast.success("Selected-candidate confirmation sent to institute");
                })
              }
              disabled={actionLoading.confirm || !hasSelection}
              className="gap-2 bg-green-600 text-white hover:bg-green-700 shadow-sm"
            >
              {actionLoading.confirm ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Confirm Candidates
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                runBulkAction("academic", async () => {
                  await api.post("/medical-results/bulk/collect-academic", {
                    drive_id: drive.id,
                    cadet_ids: selectedRows.map((c) => c.id),
                  });
                  toast.success("Pending academic data request sent");
                })
              }
              disabled={actionLoading.academic || !allSelectedAreConfirmed}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {actionLoading.academic ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Collect Academic Data
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                runBulkAction("documents", async () => {
                  await api.post("/medical-results/bulk/collect-documents", {
                    drive_id: drive.id,
                    cadet_ids: selectedRows.map((c) => c.id),
                  });
                  toast.success("Candidate document request sent");
                })
              }
              disabled={actionLoading.documents || !allSelectedAreConfirmed}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {actionLoading.documents ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Move document process
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(GROUP_CONFIGS).map(([key, config]) => {
          const list = groupedCadets[key] || [];
          const paginatedList = getPaginatedGroup(key);
          const isExpanded = expandedGroups[key];

          return (
            <div
              key={key}
              className={`rounded-xl border ${config.borderColor} overflow-hidden bg-white shadow-sm`}
            >
              <button
                type="button"
                onClick={() => toggleGroup(key)}
                className={`flex w-full items-center justify-between p-4 transition-colors ${config.bgColor} border-b ${config.borderColor}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-base font-semibold ${config.textColor}`}>
                    {config.label}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.badgeColor}`}
                  >
                    {list.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`h-5 w-5 ${config.textColor}`} />
                ) : (
                  <ChevronDown className={`h-5 w-5 ${config.textColor}`} />
                )}
              </button>

              {isExpanded && (
                <div className="overflow-hidden">
                  <ReusableDataTable
                    columns={columns}
                    rows={paginatedList}
                    loading={loading}
                    checkboxSelection
                    rowSelectionModel={selectedCadets}
                    onRowSelectionModelChange={setSelectedCadets}
                    emptyMessage={
                      searchTerm
                        ? `No cadets found in this group matching "${searchTerm}"`
                        : `No cadets in ${config.label.toLowerCase()}`
                    }
                    pagination={{
                      current_page: currentPages[key] || 1,
                      per_page: perPages[key] || 10,
                      total: list.length,
                      last_page: Math.max(
                        1,
                        Math.ceil(list.length / (perPages[key] || 10))
                      ),
                    }}
                    handlePageChange={(page) => {
                      setCurrentPages((prev) => ({ ...prev, [key]: page }));
                    }}
                    handlePerPageChange={(limit) => {
                      setPerPages((prev) => ({ ...prev, [key]: limit }));
                      setCurrentPages((prev) => ({ ...prev, [key]: 1 }));
                    }}
                    pageSize={perPages[key] || 10}
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
            key: "medical_center_id",
            label: "Medical Center",
            type: "select",
            required: true,
            options: medicalCenterOptions,
            placeholder: "Select medical center",
          },
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
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Add medical instructions or remarks",
          },
        ]}
      />
    </div>
  );
};

export default MedicalTab;
