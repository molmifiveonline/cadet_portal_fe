import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, Edit, Loader2, Search } from "lucide-react";
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

const CadetsTab = ({ drive, initialStatus = "all", onStatusFilterChange }) => {
  useParams();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCadets = useCallback(async () => {
    if (!drive?.institute_id) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        instituteId: drive.institute_id,
        drive_id: drive.id,
        page: currentPage,
        limit: perPage,
        status: selectedStatus === "all" ? "" : selectedStatus,
        search: debouncedSearch.trim(),
      });

      const response = await api.get(`/cadets?${params.toString()}`);
      if (response.data) {
        setCadets(response.data.data || []);
        if (response.data.pagination) {
          setTotalItems(response.data.pagination.total || 0);
          setTotalPages(response.data.pagination.pages || 1);
        } else if (response.data.total !== undefined) {
          // Fallback if structured differently (some endpoints in controller use this)
          setTotalItems(response.data.total);
          setTotalPages(Math.ceil(response.data.total / perPage));
        }
      }
    } catch (error) {
      console.error("Error fetching cadets:", error);
      toast.error("Failed to load cadets");
    } finally {
      setLoading(false);
    }
  }, [
    drive?.institute_id,
    drive?.id,
    currentPage,
    perPage,
    selectedStatus,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, perPage]);

  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    if (onStatusFilterChange) onStatusFilterChange(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Eligible for Assessment":
        return "bg-blue-100 text-blue-800";
      case "Assessment Completed":
        return "bg-green-100 text-green-800";
      case "Assessment Failed":
        return "bg-red-100 text-red-800";
      case "Eligible for Interview":
        return "bg-cyan-100 text-cyan-800";
      case "Interview Selected":
        return "bg-purple-100 text-purple-800";
      case "Interview Failed":
        return "bg-red-100 text-red-800";
      case "Eligible for Medical":
        return "bg-teal-100 text-teal-800";
      case "Medical Completed":
        return "bg-indigo-100 text-indigo-800";
      case "Medical Failed":
        return "bg-red-100 text-red-800";
      case "CTV Assigned":
        return "bg-amber-100 text-amber-800";
      case "Onboarded":
        return "bg-emerald-100 text-emerald-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Imported":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newLimit) => {
    setPerPage(newLimit);
    setCurrentPage(1);
  };

  const columns = [
    {
      field: "cadet_unique_id",
      headerName: "Cadet ID",
      width: "120px",
      sortable: true,
      renderCell: ({ value }) => (
        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100 uppercase">
          {value || "-"}
        </span>
      ),
    },
    {
      field: "name_as_in_indos_cert",
      headerName: "Name",
      width: "180px",
      sortable: true,
      renderCell: ({ row }) => (
        <span
          className="font-medium text-gray-900 truncate block w-full"
          title={row.name_as_in_indos_cert}
        >
          {row.name_as_in_indos_cert}
        </span>
      ),
    },
    {
      field: "email_id",
      headerName: "Email",
      width: "200px",
      sortable: true,
      renderCell: ({ value }) => (
        <span className="truncate block w-full" title={value}>
          {value}
        </span>
      ),
    },
    {
      field: "batch_year",
      headerName: "Batch",
      width: "100px",
      sortable: true,
    },
    { field: "course", headerName: "Course", width: "120px", sortable: true },
    {
      field: "status",
      headerName: "Status",
      width: "160px",
      sortable: true,
      renderCell: ({ value }) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}
        >
          {value}
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
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/cadets/view/${row.id}`, "_blank")}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="View Cadet Details"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              window.open(`/cadets/view/${row.id}`, {
                state: { editMode: true },
              })
            }
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Edit Cadet"
          >
            <Edit size={16} />
          </Button>
        </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Cadets Management
          </h2>
          <p className="text-sm text-slate-500">
            All cadets associated with this recruitment drive
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-200">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Imported">Imported</SelectItem>
              <SelectItem value="Eligible for Assessment">
                Eligible for Assessment
              </SelectItem>
              <SelectItem value="Assessment Completed">
                Assessment Completed
              </SelectItem>
              <SelectItem value="Assessment Failed">
                Assessment Failed
              </SelectItem>
              <SelectItem value="Eligible for Interview">
                Eligible for Interview
              </SelectItem>
              <SelectItem value="Interview Selected">
                Interview Selected
              </SelectItem>
              <SelectItem value="Interview Failed">Interview Failed</SelectItem>
              <SelectItem value="Eligible for Medical">
                Eligible for Medical
              </SelectItem>
              <SelectItem value="Medical Completed">
                Medical Completed
              </SelectItem>
              <SelectItem value="Medical Failed">Medical Failed</SelectItem>
              <SelectItem value="CTV Assigned">CTV Assigned</SelectItem>
              <SelectItem value="Onboarded">Onboarded</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search cadets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-hidden">
        <ReusableDataTable
          columns={columns}
          rows={cadets}
          loading={loading}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : "No cadets found for this drive"
          }
          pagination={{
            current_page: currentPage,
            per_page: perPage,
            total: totalItems,
            last_page: totalPages,
          }}
          handlePageChange={handlePageChange}
          handlePerPageChange={handlePerPageChange}
          pageSize={perPage}
        />
      </div>
    </div>
  );
};

export default CadetsTab;
