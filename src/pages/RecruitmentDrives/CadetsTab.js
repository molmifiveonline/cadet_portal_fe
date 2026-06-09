import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit, Eye, Search, Upload } from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import api from "../../lib/utils/apiConfig";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import { getShortlistCriteriaStatus } from "../../lib/utils/shortlistCriteria";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const STATUS_OPTIONS = [
  "Uploaded",
  "Shortlisted",
  "Assessment",
  "Interviewed",
  "Selected",
  "Rejected",
  "CTV Assigned",
  "Onboarded",
];

const STATUS_COLORS = {
  Uploaded: "bg-blue-100 text-blue-800",
  Shortlisted: "bg-purple-100 text-purple-800",
  Assessment: "bg-teal-100 text-teal-800",
  Interviewed: "bg-orange-100 text-orange-800",
  Selected: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
  "CTV Assigned": "bg-amber-100 text-amber-800",
  Onboarded: "bg-lime-100 text-lime-800",
};

const getStatusColor = (status) => STATUS_COLORS[status] || "bg-slate-100 text-slate-800";

const formatPercentage = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)}%` : "-";
};

const CadetsTab = ({ drive, initialStatus = "all", onStatusFilterChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [totalCadets, setTotalCadets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedUploadCadet, setSelectedUploadCadet] = useState(null);
  const [uploadingCadetId, setUploadingCadetId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const fileInputRef = useRef(null);

  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/recruitment-drives/${drive.id}/cadets`, {
        params: {
          queue: "all",
          page: currentPage,
          limit: perPage,
          search: debouncedSearchTerm || undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
        },
      });
      setCadets(response.data?.data || []);
      setTotalCadets(response.data?.total || 0);
    } catch (error) {
      console.error("Error fetching drive cadets:", error);
      toast.error("Failed to load cadets");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, drive.id, perPage, selectedStatus]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets]);

  useEffect(() => {
    setSelectedStatus(initialStatus || "all");
  }, [initialStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedStatus, perPage]);

  const sortedCadets = useMemo(() => {
    const statusOrder = { passed: 1, missing_twelfth: 2, failed: 3 };

    return [...cadets].sort((a, b) => {
      const statusA = getShortlistCriteriaStatus(a).type;
      const statusB = getShortlistCriteriaStatus(b).type;
      return (statusOrder[statusA] || 4) - (statusOrder[statusB] || 4);
    });
  }, [cadets]);

  const isInstituteUser = user?.role === "Institute";

  const handleUploadClick = (cadet) => {
    setSelectedUploadCadet(cadet);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleCvTemplateUpload = async (event) => {
    const file = event.target.files?.[0];
    const cadet = selectedUploadCadet;

    if (!file || !cadet) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Please upload the completed .xlsx CV template.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingCadetId(cadet.id);
      const formData = new FormData();
      formData.append("file", file);
      if (drive?.id) {
        formData.append("drive_id", drive.id);
      }

      const response = await api.post(
        `/cadets/${cadet.id}/cv-template-upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast.success(response.data?.message || "Cadet CV details updated successfully");
      fetchCadets();
    } catch (error) {
      const errors = error.response?.data?.errors;
      const message =
        Array.isArray(errors) && errors.length > 0
          ? errors.join("\n")
          : error.response?.data?.message || "Failed to upload CV template";
      toast.error(message);
    } finally {
      setUploadingCadetId(null);
      setSelectedUploadCadet(null);
      event.target.value = "";
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
          {row.name_as_in_indos_cert || "-"}
        </span>
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
      align: "center",
      renderCell: ({ value }) => formatPercentage(value),
    },
    {
      field: "status",
      headerName: "Status",
      width: "140px",
      renderCell: ({ value }) => (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      field: "last_email_date",
      headerName: "Email Sent",
      width: "110px",
      renderCell: ({ value, row }) =>
        value ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Yes ({row.last_email_type})
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            No
          </span>
        ),
    },
    {
      field: "last_email_date_val",
      headerName: "Email Date",
      width: "130px",
      renderCell: ({ row }) => formatDateForDisplay(row.last_email_date),
    },
    {
      field: "assessment_eligible",
      headerName: "Eligible for Assessment",
      width: "180px",
      align: "center",
      renderCell: ({ row }) => {
        const criteriaStatus = getShortlistCriteriaStatus(row);
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${criteriaStatus.badgeClassName}`}
          >
            {criteriaStatus.type === "passed" ? "Yes" : "No"}
          </span>
        );
      },
    },
    {
      field: "actions",
      headerName: "View Details",
      width: "150px",
      sortable: false,
      sticky: "right",
      cellClassName: "bg-white",
      align: "right",
      renderCell: ({ row }) => {
        const canUpdatePendingDetails =
          !isInstituteUser || row.can_edit_pending_details;
        const canUploadExcel = isInstituteUser && row.can_edit_pending_details;
        const isUploading = uploadingCadetId === row.id;

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cadets/view/${row.id}`)}
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              title="View details"
            >
              <Eye size={16} />
            </Button>
            {canUploadExcel ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUploadClick(row)}
                disabled={isUploading}
                className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                title={isUploading ? "Uploading Excel..." : "Upload completed Excel"}
              >
                <Upload size={16} />
              </Button>
            ) : null}
            {canUpdatePendingDetails ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isInstituteUser) {
                    navigate(`/cadets/fill-details/${row.id}`, {
                      state: { returnPath: `/drives/${drive.id}`, returnState: { activeTab: "cadets" } },
                    });
                    return;
                  }

                  navigate(`/cadets/view/${row.id}`);
                }}
                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                title={isInstituteUser ? "Edit pending details" : "Edit cadet"}
              >
                <Edit size={16} />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ].filter(col => {
    if (isInstituteUser) {
      return !["status", "last_email_date", "last_email_date_val", "assessment_eligible"].includes(col.field);
    }
    return true;
  });

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    onStatusFilterChange?.(value);
  };

  if (loading && cadets.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleCvTemplateUpload}
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cadets Uploaded</h2>
          <p className="text-sm text-slate-500">
            {isInstituteUser 
              ? "View and manage the list of cadets uploaded for this drive."
              : "Track CV status, workflow stage, and assessment eligibility for this drive."}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {!isInstituteUser && (
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full border-slate-200 bg-white sm:w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search cadets..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow-sm">
        <ReusableDataTable
          columns={columns}
          rows={sortedCadets}
          loading={loading}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets available for this drive"
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
    </div>
  );
};

export default CadetsTab;
