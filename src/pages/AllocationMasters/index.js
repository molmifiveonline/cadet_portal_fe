import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/utils/apiConfig";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";

const AssessmentTypes = () => {
  const { user } = useAuth();
  const canManage = ["SuperAdmin", "Admin"].includes(user?.role);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "",
    sortOrder: "ASC",
  });
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/allocations/masters/courses");
      setTypes(response.data.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load Assessment Types",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTypes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return types.filter(
      (item) =>
        (!term || item.name?.toLowerCase().includes(term)) &&
        (statusFilter === "All" || item.status === statusFilter),
    );
  }, [types, search, statusFilter]);

  const sortedTypes = useMemo(() => {
    if (!sortConfig.sortBy) return filteredTypes;

    const direction = sortConfig.sortOrder === "DESC" ? -1 : 1;
    return [...filteredTypes].sort((first, second) => {
      const field = sortConfig.sortBy;
      const firstValue =
        field === "updated_at"
          ? first.updated_at || first.created_at
          : first[field];
      const secondValue =
        field === "updated_at"
          ? second.updated_at || second.created_at
          : second[field];

      if (firstValue == null && secondValue == null) return 0;
      if (firstValue == null) return 1;
      if (secondValue == null) return -1;

      if (field === "updated_at") {
        return (
          (new Date(firstValue).getTime() - new Date(secondValue).getTime()) *
          direction
        );
      }

      return (
        String(firstValue).localeCompare(String(secondValue), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * direction
      );
    });
  }, [filteredTypes, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedTypes.length / rowsPerPage));
  const paginatedTypes = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedTypes.slice(start, start + rowsPerPage);
  }, [sortedTypes, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handlePerPageChange = (value) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortConfig({ sortBy: field, sortOrder: order.toUpperCase() });
    setCurrentPage(1);
  };

  const activeCount = types.filter((item) => item.status === "Active").length;
  const openAdd = () => {
    setEditor({ mode: "add" });
    setForm({ name: "" });
    setErrors({});
  };
  const openEdit = (item) => {
    setEditor({ mode: "edit", item });
    setForm({ name: item.name || "" });
    setErrors({});
  };
  const closeEditor = () => {
    if (saving) return;
    setEditor(null);
    setForm({ name: "" });
    setErrors({});
  };
  const updateName = (value) => {
    setForm({ name: value });
    setErrors((current) => ({ ...current, name: "" }));
  };

  const save = async () => {
    const name = form.name.trim().replace(/\s+/g, " ");
    if (!name) {
      setErrors({ name: "Assessment Type Name is required." });
      return;
    }
    if (name.length > 150) {
      setErrors({ name: "Assessment Type Name cannot exceed 150 characters." });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name,
        status: editor?.item?.status || "Active",
      };
      if (editor?.mode === "edit") {
        await api.put(
          `/allocations/masters/courses/${editor.item.id}`,
          payload,
        );
      } else {
        await api.post("/allocations/masters/courses", payload);
      }
      toast.success(
        editor?.mode === "edit"
          ? "Assessment Type updated"
          : "Assessment Type added",
      );
      setEditor(null);
      setForm({ name: "" });
      setErrors({});
      await load();
    } catch (error) {
      const apiErrors = error.response?.data?.errors || {};
      setErrors(apiErrors);
      if (!apiErrors.name)
        toast.error(
          error.response?.data?.message || "Failed to save Assessment Type",
        );
    } finally {
      setSaving(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusAction) return;
    const nextStatus = statusAction.status === "Active" ? "Inactive" : "Active";
    try {
      setSaving(true);
      await api.put(`/allocations/masters/courses/${statusAction.id}`, {
        name: statusAction.name,
        status: nextStatus,
      });
      toast.success(
        `Assessment Type ${nextStatus === "Active" ? "activated" : "deactivated"}`,
      );
      setStatusAction(null);
      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update Assessment Type status",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteAction) return;
    try {
      setDeleting(true);
      const response = await api.delete(
        `/allocations/masters/courses/${deleteAction.id}`,
      );
      toast.success(
        response.data?.message || 'Assessment Type deleted successfully',
      );
      setDeleteAction(null);
      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete Assessment Type',
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: "name",
      headerName: "Assessment Type Name",
      width: "260px",
      renderCell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
        </div>
      ),
    },
    {
      field: "applies_to",
      headerName: "Applies To",
      width: "160px",
      sortable: false,
      renderCell: () => (
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Deck &amp; Engine
        </span>
      ),
    },
    {
      field: "maximum_score",
      headerName: "Maximum Score",
      width: "160px",
      sortable: false,
      renderCell: () => (
        <span>
          <span className="font-semibold text-slate-900">10</span>
          <span className="text-slate-500"> marks</span>
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: "120px",
      renderCell: ({ value }) => <StatusBadge status={value} />,
    },
    {
      field: "updated_at",
      headerName: "Last Updated",
      width: "160px",
      renderCell: ({ row }) => (
        <span className="text-slate-600">
          {formatDateForDisplay(row.updated_at || row.created_at)}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            field: "actions",
            headerName: "Actions",
            width: "340px",
            align: "right",
            sortable: false,
            sticky: "right",
            cellClassName: "bg-white",
            headerClassName: "bg-white",
            renderCell: ({ row }) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(row)}
                >
                  <Pencil size={14} className="mr-1.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={
                    row.status === "Active"
                      ? "text-red-700 hover:bg-red-50"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }
                  onClick={() => setStatusAction(row)}
                >
                  {row.status === "Active" ? (
                    <Ban size={14} className="mr-1.5" />
                  ) : (
                    <CheckCircle2 size={14} className="mr-1.5" />
                  )}
                  {row.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => setDeleteAction(row)}
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (loading && !types.length) return <PageLoader />;

  return (
    <div className="py-6">
      <PageHeader
        title="Assessment Type Master"
        subtitle="General assessment names used for every Deck and Engine cadet"
        icon={ClipboardList}
      >
        {canManage && (
          <Button onClick={openAdd}>
            <Plus size={18} className="mr-2" />
            Add Assessment Type
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Assessment Types"
          value={types.length}
          tone="blue"
        />
        <SummaryCard label="Active" value={activeCount} tone="green" />
        <SummaryCard
          label="Inactive"
          value={types.length - activeCount}
          tone="slate"
        />
      </div>

      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Every Assessment Type is general, applies to both departments, and has a
        fixed maximum score of <strong>10</strong>. Only active types are copied
        into newly created allocation cycles; existing cycles keep their saved
        snapshot.
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search Assessment Type..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-full border-slate-300 bg-white sm:w-40"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent align="end" className="z-[100] bg-white">
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ReusableDataTable
          columns={columns}
          rows={paginatedTypes}
          loading={loading}
          checkboxSelection={false}
          pageSize={rowsPerPage}
          sortConfig={sortConfig}
          handleSortChange={handleSortChange}
          handlePageChange={setCurrentPage}
          handlePerPageChange={handlePerPageChange}
          pagination={{
            current_page: currentPage,
            per_page: rowsPerPage,
            total: sortedTypes.length,
            last_page: totalPages,
          }}
          emptyMessage={
            search || statusFilter !== "All"
              ? "No Assessment Types match the selected filters."
              : "No Assessment Types added yet."
          }
        />
      </div>

      <ConfirmationModal
        isOpen={Boolean(editor)}
        onClose={closeEditor}
        onConfirm={save}
        title={
          editor?.mode === "edit"
            ? "Edit Assessment Type"
            : "Add Assessment Type"
        }
        message="This name will appear as a manual score field in new allocation cycles."
        confirmText={
          editor?.mode === "edit" ? "Save Changes" : "Add Assessment Type"
        }
        isLoading={saving}
        confirmDisabled={!form.name.trim()}
      >
        <label className="block text-sm font-medium text-slate-700">
          Assessment Type Name <span className="text-red-500">*</span>
          <Input
            autoFocus
            className={`mt-1 ${errors.name ? "border-red-500 focus-visible:ring-red-200" : ""}`}
            value={form.name}
            onChange={(event) => updateName(event.target.value)}
            placeholder="Example: Communication Skills"
            maxLength={150}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </label>
        <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <p>
            <strong>Applies to:</strong> Deck and Engine
          </p>
          <p>
            <strong>Maximum score:</strong> 10
          </p>
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(statusAction)}
        onClose={() => {
          if (!saving) setStatusAction(null);
        }}
        onConfirm={confirmStatusChange}
        title={`${statusAction?.status === "Active" ? "Deactivate" : "Activate"} Assessment Type`}
        message={
          statusAction?.status === "Active"
            ? `${statusAction?.name} will not be included in new allocation cycles. Existing allocation scores will remain unchanged.`
            : `${statusAction?.name} will be included when the next allocation cycle is created.`
        }
        confirmText={
          statusAction?.status === "Active" ? "Deactivate" : "Activate"
        }
        confirmButtonClass={
          statusAction?.status === "Active"
            ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
            : undefined
        }
        isLoading={saving}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteAction)}
        onClose={() => {
          if (!deleting) setDeleteAction(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Assessment Type"
        message={`Delete ${deleteAction?.name || 'this Assessment Type'}? This action cannot be undone. Assessment Types already used in a formula or cadet score cannot be deleted.`}
        confirmText="Delete Assessment Type"
        confirmButtonClass="bg-red-600 hover:bg-red-700 shadow-red-600/20"
        isLoading={deleting}
      />
    </div>
  );
};

const SummaryCard = ({ label, value, tone }) => {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
  >
    {status}
  </span>
);

export default AssessmentTypes;
