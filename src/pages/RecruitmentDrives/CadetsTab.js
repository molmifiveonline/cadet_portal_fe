import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, Eye, Loader2, Search } from "lucide-react";
import api from "../../lib/utils/apiConfig";
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

const CadetsTab = ({ drive, initialStatus = "all", onStatusFilterChange }) => {
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/recruitment-drives/${drive.id}/cadets?queue=all`);
      setCadets(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching drive cadets:", error);
      toast.error("Failed to load cadets");
    } finally {
      setLoading(false);
    }
  }, [drive.id]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets]);

  useEffect(() => {
    setSelectedStatus(initialStatus || "all");
  }, [initialStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, perPage]);

  const filteredCadets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return cadets.filter((cadet) => {
      const matchesStatus =
        selectedStatus === "all" || cadet.status === selectedStatus;

      const matchesSearch =
        !normalizedSearch ||
        cadet.name_as_in_indos_cert?.toLowerCase().includes(normalizedSearch) ||
        cadet.cadet_unique_id?.toLowerCase().includes(normalizedSearch) ||
        cadet.roll_no?.toLowerCase().includes(normalizedSearch) ||
        cadet.email_id?.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [cadets, searchTerm, selectedStatus]);

  const paginatedCadets = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredCadets.slice(start, start + perPage);
  }, [filteredCadets, currentPage, perPage]);

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
      width: "130px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "cadet_percentage",
      headerName: "%",
      width: "100px",
      align: "center",
      renderCell: ({ value }) =>
        value || value === 0 ? `${Number(value).toFixed(2)}%` : "-",
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
      field: "cv_needed",
      headerName: "CV Needed",
      width: "120px",
      align: "center",
      renderCell: ({ value }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            value ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      field: "assessment_eligible",
      headerName: "Eligible for Assessment",
      width: "180px",
      align: "center",
      renderCell: ({ value }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            value ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "View Details",
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
            onClick={() => window.open(`/cadets/view/${row.id}`, "_blank")}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title="View details"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = `/cadets/view/${row.id}`)}
            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
            title="Edit cadet"
          >
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    onStatusFilterChange?.(value);
  };

  if (loading && cadets.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[#3a5f9e]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cadets Uploaded</h2>
          <p className="text-sm text-slate-500">
            Track CV status, workflow stage, and assessment eligibility for this drive.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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
          rows={paginatedCadets}
          loading={loading}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets available for this drive"
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

export default CadetsTab;
