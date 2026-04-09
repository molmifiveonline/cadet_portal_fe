import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Eye, Edit, Loader2, Mail, Search } from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";

const criteria = {
  tenth_avg_percentage: 85,
  tenth_std_maths: 80,
  tenth_std_science: 80,
  tenth_std_english: 80,
  twelfth_pcm_avg_percentage: 80,
  twelfth_std_english: 75,
  twelfth_std_physics: 75,
  twelfth_std_chemistry: 75,
  twelfth_std_maths: 75,
  imu_rank_max: 3000,
  bmi_max: 25,
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const isCriteriaQualified = (cadet) => {
  return (
    toNumber(cadet.tenth_avg_percentage) >= criteria.tenth_avg_percentage &&
    toNumber(cadet.tenth_std_maths) >= criteria.tenth_std_maths &&
    toNumber(cadet.tenth_std_science) >= criteria.tenth_std_science &&
    toNumber(cadet.tenth_std_english) >= criteria.tenth_std_english &&
    toNumber(cadet.twelfth_pcm_avg_percentage) >= criteria.twelfth_pcm_avg_percentage &&
    toNumber(cadet.twelfth_std_english) >= criteria.twelfth_std_english &&
    toNumber(cadet.twelfth_std_physics) >= criteria.twelfth_std_physics &&
    toNumber(cadet.twelfth_std_chemistry) >= criteria.twelfth_std_chemistry &&
    toNumber(cadet.twelfth_std_maths) >= criteria.twelfth_std_maths &&
    toNumber(cadet.imu_rank) <= criteria.imu_rank_max &&
    toNumber(cadet.bmi) < criteria.bmi_max
  );
};

const getSuggestion = (cadet) => {
  const isLateralEntry = /lateral\s*entry/i.test(String(cadet.course || ""));
  if (isCriteriaQualified(cadet)) {
    return { label: "Qualified", tone: "green" };
  }
  if (isLateralEntry) {
    return { label: "Lateral Entry", tone: "yellow" };
  }
  return { label: "Below Criteria", tone: "red" };
};

const ShortlistTab = ({
  drive,
  canSendShortlistEmail,
  onSendShortlistEmail,
  sendingShortlist,
  refreshTrigger,
}) => {
  const [cadets, setCadets] = useState([]);
  const [selectedCadets, setSelectedCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSuggestionCadets = useCallback(async () => {
    if (!drive?.institute_id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        drive_id: drive.id,
        page: currentPage,
        limit: perPage,
        search: debouncedSearch.trim(),
      });

      const response = await api.get(`/cadets?${params.toString()}`);
      const data = (response.data?.data || []).map((cadet) => {
        const suggestion = getSuggestion(cadet);
        return {
          ...cadet,
          suggestion,
          suggestion_order: suggestion.tone === 'green' ? 1 : suggestion.tone === 'yellow' ? 2 : 3
        };
      }).sort((a, b) => a.suggestion_order - b.suggestion_order);
      const total =
        Number(response.data?.pagination?.total) ||
        Number(response.data?.total || 0);
      const limit =
        Number(response.data?.pagination?.limit) ||
        Number(response.data?.limit || perPage);

      setCadets(data);
      setTotalItems(total);
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
      // Reset selection when data is refreshed
      setSelectedCadets([]);
    } catch (error) {
      console.error("Error fetching shortlist suggestions:", error);
      toast.error("Failed to load shortlist suggestions");
    } finally {
      setLoading(false);
    }
  }, [
    drive?.institute_id,
    drive?.id,
    currentPage,
    perPage,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchSuggestionCadets();
  }, [fetchSuggestionCadets, refreshTrigger]);

  const isRowSelectable = (row) => !row.shortlist_email_sent;

  const columns = [
    {
      field: "cadet_unique_id",
      headerName: "Cadet ID",
      width: "120px",
      sortable: true,
      renderCell: ({ row, value }) => (
        <div className="flex items-center gap-2">
          {row.shortlist_email_sent === 1 && (
            <Mail className="h-3 w-3 text-blue-500" title="Shortlist email sent" />
          )}
          <span>{value}</span>
        </div>
      ),
    },
    {
      field: "name_as_in_indos_cert",
      headerName: "Name",
      width: "220px",
      sortable: true,
      renderCell: ({ value }) => (
        <span className="font-medium text-gray-900">{value || "-"}</span>
      ),
    },
    {
      field: "email_id",
      headerName: "Email",
      width: "220px",
      sortable: true,
    },
    {
      field: "batch_year",
      headerName: "Batch",
      width: "100px",
      sortable: true,
    },
    {
      field: "course",
      headerName: "Course",
      width: "120px",
      sortable: true,
    },
    {
      field: "suggestion_order",
      headerName: "Suggestion",
      width: "160px",
      sortable: true,
      renderCell: ({ row }) => {
        const value = row.suggestion;
        if (row.shortlist_email_sent === 1) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
              <Mail className="h-3 w-3" />
              Email Sent
            </span>
          );
        }
        const toneClass =
          value?.tone === "green"
            ? "bg-green-100 text-green-800"
            : value?.tone === "yellow"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800";
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${toneClass}`}>
            {value?.label || "Below Criteria"}
          </span>
        );
      },
    },
    {
      field: "imu_rank",
      headerName: "IMU Rank",
      width: "120px",
      sortable: true,
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "bmi",
      headerName: "BMI",
      width: "90px",
      sortable: true,
      renderCell: ({ value }) => value || "-",
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
              window.open(`/cadets/view/${row.id}`, { state: { editMode: true } })
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

  const getSuggestionRowClassName = (row) => {
    if (row.shortlist_email_sent === 1) return "!bg-blue-50/30 opacity-75";
    const tone = row?.suggestion?.tone;
    if (tone === "green") return "!bg-green-50 hover:!bg-green-100";
    if (tone === "yellow") return "!bg-yellow-50 hover:!bg-yellow-100";
    return "!bg-red-50 hover:!bg-red-100";
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shortlist Suggestions</h2>
          <p className="text-sm text-gray-600">
            Green: qualified, Yellow: Lateral Entry, Red: below criteria. Locked rows indicate email already sent.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search suggestion cadets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          {canSendShortlistEmail && (
            <Button
              variant="outline"
              onClick={() => onSendShortlistEmail(selectedCadets)}
              disabled={sendingShortlist || selectedCadets.length === 0}
              className="flex items-center gap-2 border-green-300 text-green-600 hover:bg-green-50"
              title={
                selectedCadets.length === 0
                  ? "Select at least one cadet"
                  : "Send shortlist email"
              }
            >
              {sendingShortlist ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send Shortlist Email
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-hidden border rounded-lg">
        <ReusableDataTable
          columns={columns}
          rows={cadets}
          loading={loading}
          getRowClassName={getSuggestionRowClassName}
          checkboxSelection={true}
          isRowSelectable={isRowSelectable}
          rowSelectionModel={selectedCadets}
          onRowSelectionModelChange={setSelectedCadets}
          emptyMessage={
            searchTerm
              ? `No suggestion cadets found matching "${searchTerm}"`
              : "No shortlist suggestions found for this drive"
          }
          pagination={{
            current_page: currentPage,
            per_page: perPage,
            total: totalItems,
            last_page: totalPages,
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
