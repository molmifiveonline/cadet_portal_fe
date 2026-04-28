import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Edit,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Send,
  Users,
} from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import StageInviteModal from "./StageInviteModal";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";

const MedicalTab = ({ drive, onRefresh }) => {
  const [cadets, setCadets] = useState([]);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCadets, setSelectedCadets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    confirm: false,
    academic: false,
    documents: false,
  });
  const [bulkFields, setBulkFields] = useState({
    remarks: "",
    academicFormLink: "",
    documentLink: "",
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
      const cadetPayload = entries.map((entry) => {
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
      toast.error(
        error.response?.data?.message || "Failed to send medical invites",
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
            onClick={() => (window.location.href = `/cadets/medical/${row.id}`)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title={row.medical_result_id ? "Edit medical result" : "Start medical result"}
          >
            {row.medical_result_id ? <Edit size={16} /> : <Plus size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/cadets/medical/${row.id}`, "_blank")}
            className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            title="View medical result"
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
            disabled={selectedRows.length === 0}
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Send className="h-4 w-4" />
            Send Medical Invite
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Post-Medical Actions
        </h3>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Pending Academic Data Link
              </label>
              <Input
                value={bulkFields.academicFormLink}
                onChange={(event) =>
                  setBulkFields((prev) => ({
                    ...prev,
                    academicFormLink: event.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Candidate Document Link (OneDrive)
              </label>
              <Input
                value={bulkFields.documentLink}
                onChange={(event) =>
                  setBulkFields((prev) => ({
                    ...prev,
                    documentLink: event.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Remarks (Included in Emails)</label>
            <Input
              value={bulkFields.remarks}
              onChange={(event) =>
                setBulkFields((prev) => ({ ...prev, remarks: event.target.value }))
              }
              placeholder="Enter remarks to be sent to the institute..."
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() =>
                runBulkAction("confirm", async () => {
                  await api.post("/medical-results/bulk/confirm", {
                    drive_id: drive.id,
                    remarks: bulkFields.remarks,
                  });
                  toast.success("Selected-candidate confirmation sent to institute");
                })
              }
              disabled={actionLoading.confirm}
              className="gap-2 bg-green-600 text-white hover:bg-green-700 shadow-sm"
            >
              {actionLoading.confirm ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
                    remarks: bulkFields.remarks,
                    form_link: bulkFields.academicFormLink,
                  });
                  toast.success("Pending academic data request sent");
                })
              }
              disabled={actionLoading.academic}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {actionLoading.academic ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
                    remarks: bulkFields.remarks,
                    document_link: bulkFields.documentLink,
                  });
                  toast.success("Candidate document request sent");
                })
              }
              disabled={actionLoading.documents}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {actionLoading.documents ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Collect Documents
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <ReusableDataTable
          columns={columns}
          rows={paginatedCadets}
          loading={loading}
          checkboxSelection
          rowSelectionModel={selectedCadets}
          onRowSelectionModelChange={setSelectedCadets}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets are waiting for medical"
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
