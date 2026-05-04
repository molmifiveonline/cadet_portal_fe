import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import api from "../../lib/utils/apiConfig";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ReusableDataTable from "../../components/common/ReusableDataTable";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import { formatDateForDisplay } from "../../lib/utils/dateUtils";
import DocumentRequestModal from "./DocumentRequestModal";

const DOCUMENT_TYPES = [
  "CV",
  "Passport",
  "Medical Certificate",
  "Bank Details",
  "Academic Marksheet",
  "Aadhaar Card",
  "PAN Card",
  "INDOS Certificate",
  "CDC (Continuous Discharge Certificate)",
  "Agreement / Contract",
  "Other",
];

const STATUS_BADGES = {
  accepted: {
    className: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Accepted",
  },
  rejected: {
    className: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Rejected",
  },
  reupload_requested: {
    className: "bg-amber-100 text-amber-800",
    icon: RotateCcw,
    label: "Re-upload",
  },
  pending: {
    className: "bg-slate-100 text-slate-700",
    icon: Clock,
    label: "Pending",
  },
};

const getStatusBadge = (status = "pending") => {
  const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;
  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}>
      <Icon size={12} />
      {badge.label}
    </span>
  );
};

const DocumentsTab = ({ drive }) => {
  const { user } = useAuth();
  const [cadetsWithDocs, setCadetsWithDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCadets, setExpandedCadets] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    document_name: "",
    document_type: "CV",
    file: null,
  });
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    documentId: null,
  });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const isInstituteUser = user?.role === "Institute";

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/drive?drive_id=${drive.id}`);
      if (response.data?.success) {
        setCadetsWithDocs(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching drive documents:", error);
      toast.error("Failed to load document workspace");
    } finally {
      setLoading(false);
    }
  }, [drive.id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredCadets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return cadetsWithDocs.filter((cadet) => {
      if (!normalizedSearch) return true;
      return (
        cadet.name_as_in_indos_cert?.toLowerCase().includes(normalizedSearch) ||
        cadet.cadet_unique_id?.toLowerCase().includes(normalizedSearch) ||
        cadet.email_id?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [cadetsWithDocs, searchTerm]);

  const toggleCadet = (cadetId) => {
    setExpandedCadets((prev) => ({ ...prev, [cadetId]: !prev[cadetId] }));
  };

  const handleUpload = async (cadetId) => {
    if (!uploadForm.file || !uploadForm.document_name || !uploadForm.document_type) {
      toast.error("Please select a file and complete the document details");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("document", uploadForm.file);
      formData.append("document_name", uploadForm.document_name);
      formData.append("document_type", uploadForm.document_type);

      await api.post(`/documents/cadet/${cadetId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Document uploaded successfully");
      setUploadingFor(null);
      setUploadForm({ document_name: "", document_type: "CV", file: null });
      await fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    }
  };

  const handleSendRequest = async (requestData) => {
    try {
      setRequestLoading(true);
      await api.post("/documents/request-upload", {
        drive_id: drive.id,
        ...requestData,
      });
      toast.success("Document requests sent successfully");
      setIsRequestModalOpen(false);
      await fetchDocuments();
    } catch (error) {
      console.error("Error sending document requests:", error);
      toast.error(error.response?.data?.message || "Failed to send requests");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleReview = async (documentId, status) => {
    try {
      await api.put(`/documents/${documentId}/review`, {
        status,
        admin_remarks: reviewRemarks,
      });
      toast.success("Document review updated");
      setReviewingDoc(null);
      setReviewRemarks("");
      await fetchDocuments();
    } catch (error) {
      console.error("Error reviewing document:", error);
      toast.error(error.response?.data?.message || "Failed to review document");
    }
  };

  const handleDownload = (documentId) => {
    const userStr = localStorage.getItem("user");
    let token = "";

    try {
      if (userStr) {
        const parsed = JSON.parse(userStr);
        token = parsed.token || "";
      }
      if (!token) {
        token = localStorage.getItem("token") || "";
      }
    } catch (error) {
      token = localStorage.getItem("token") || "";
    }

    window.open(
      `${api.defaults.baseURL}/documents/${documentId}/download?token=${token}`,
      "_blank",
    );
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/documents/${deleteModal.documentId}`);
      toast.success("Document deleted");
      setDeleteModal({ isOpen: false, documentId: null });
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(error.response?.data?.message || "Failed to delete document");
    }
  };

  const getCadetSummary = (documents = []) => {
    const cvCount = documents.filter(
      (document) => String(document.document_type || "").toUpperCase() === "CV",
    ).length;
    const acceptedCount = documents.filter(
      (document) => document.status === "accepted",
    ).length;
    const pendingCount = documents.filter(
      (document) => document.status === "pending",
    ).length;
    const needsAttentionCount = documents.filter((document) =>
      ["rejected", "reupload_requested"].includes(document.status),
    ).length;

    return {
      total: documents.length,
      cvCount,
      acceptedCount,
      pendingCount,
      needsAttentionCount,
    };
  };

  const canUploadForCadet = (cadet, summary) => {
    if (!isInstituteUser) return true;

    const documents = cadet.documents || [];
    return (
      summary.cvCount === 0 ||
      documents.some(
        (document) =>
          document.status === "reupload_requested" ||
          (document.status === "pending" && !document.original_filename),
      )
    );
  };

  const documentColumns = [
    {
      field: "document_name",
      headerName: "Document Name",
      width: "180px",
      renderCell: ({ value }) => (
        <span className="font-medium text-slate-900">{value}</span>
      ),
    },
    {
      field: "document_type",
      headerName: "Type",
      width: "150px",
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "source",
      headerName: "Source",
      width: "110px",
      renderCell: ({ row }) => (
        <div className="space-y-1">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.source === 'onedrive' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
            {row.source || "portal"}
          </span>
          {row.external_upload_link ? (
            <div>
              <button
                type="button"
                onClick={() => window.open(row.external_upload_link, "_blank")}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <ExternalLink size={12} />
                Open Link
              </button>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      field: "original_filename",
      headerName: "File / Reference",
      width: "180px",
      renderCell: ({ row }) => (
        <span className="block truncate text-slate-600" title={row.original_filename || row.external_reference}>
          {row.original_filename || row.external_reference || "-"}
        </span>
      ),
    },
    {
      field: "requested_at",
      headerName: "Requested",
      width: "130px",
      renderCell: ({ value }) =>
        value ? formatDateForDisplay(value) : "-",
    },
    {
      field: "status",
      headerName: "Status",
      width: "130px",
      renderCell: ({ value }) => getStatusBadge(value),
    },
    {
      field: "admin_remarks",
      headerName: "Admin Remarks",
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
      width: isInstituteUser ? "110px" : "auto",
      sortable: false,
      sticky: "right",
      cellClassName: "bg-white",
      align: "right",
      renderCell: ({ row: document }) => (
        <div className="flex items-center justify-end gap-2">
          {document.original_filename ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => handleDownload(document.id)}
              title="Download document"
            >
              <Download size={14} />
            </Button>
          ) : null}

          {!isInstituteUser ? (
            reviewingDoc === document.id ? (
              <div className="ml-2 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/80 p-2 shadow-sm sm:flex-row sm:items-center">
                <Input
                  placeholder="Remarks (optional)..."
                  value={reviewRemarks}
                  onChange={(event) => setReviewRemarks(event.target.value)}
                  className="h-9 w-full bg-white text-xs sm:w-40"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    className="h-9 bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 sm:h-8"
                    onClick={() => handleReview(document.id, "accepted")}
                    title="Accept Document"
                  >
                    <CheckCircle className="sm:mr-1.5 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Accept</span>
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 bg-rose-600 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 sm:h-8"
                    onClick={() => handleReview(document.id, "rejected")}
                    title="Reject Document"
                  >
                    <XCircle className="sm:mr-1.5 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Reject</span>
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 bg-amber-500 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 sm:h-8"
                    onClick={() => handleReview(document.id, "reupload_requested")}
                    title="Request Re-upload"
                  >
                    <RotateCcw className="sm:mr-1.5 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Re-upload</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-slate-400 hover:bg-white hover:text-slate-700 sm:h-8 sm:w-8"
                    onClick={() => {
                      setReviewingDoc(null);
                      setReviewRemarks("");
                    }}
                    title="Cancel"
                  >
                    <XCircle size={18} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                onClick={() => setReviewingDoc(document.id)}
                title="Review document"
              >
                <Eye size={14} />
              </Button>
            )
          ) : null}

          {!isInstituteUser ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() =>
                setDeleteModal({ isOpen: true, documentId: document.id })
              }
              title="Delete document"
            >
              <Trash2 size={14} />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (loading) {
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
          <h2 className="text-xl font-semibold text-slate-900">Document Workspace</h2>
          <p className="text-sm text-slate-500">
            Track CV intake, external document requests, uploads received, and admin review status.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!isInstituteUser ? (
            <Button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Request Document Upload
            </Button>
          ) : null}
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

      {filteredCadets.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">
            No cadets found for this drive
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Uploaded cadets will appear here with their CV and document progress.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCadets.map((cadet) => {
            const isExpanded = !!expandedCadets[cadet.cadet_id];
            const summary = getCadetSummary(cadet.documents || []);
            const canUpload = canUploadForCadet(cadet, summary);

            return (
              <div
                key={cadet.cadet_id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleCadet(cadet.cadet_id)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-bold uppercase text-indigo-700">
                      {cadet.cadet_unique_id}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{cadet.name_as_in_indos_cert}</p>
                      <p className="text-xs text-slate-500">{cadet.email_id || "-"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {cadet.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium">{summary.total} docs</span>
                      <span className={summary.cvCount > 0 ? "text-emerald-600" : "text-rose-600"}>
                        CV {summary.cvCount > 0 ? "received" : "needed"}
                      </span>
                      {summary.acceptedCount > 0 ? (
                        <span className="text-emerald-600">{summary.acceptedCount} accepted</span>
                      ) : null}
                      {summary.pendingCount > 0 ? (
                        <span className="text-amber-600">{summary.pendingCount} pending</span>
                      ) : null}
                      {summary.needsAttentionCount > 0 ? (
                        <span className="text-rose-600">{summary.needsAttentionCount} needs attention</span>
                      ) : null}
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-4">
                    {uploadingFor !== cadet.cadet_id ? (
                      canUpload ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadingFor(cadet.cadet_id);
                          setUploadForm((prev) => ({
                            ...prev,
                            document_type: isInstituteUser ? "CV" : prev.document_type,
                            document_name: isInstituteUser ? "Cadet CV" : prev.document_name,
                          }));
                        }}
                        className="mb-4 gap-2"
                      >
                        <Upload size={14} />
                        {isInstituteUser ? "Upload CV / Document" : "Upload Document"}
                      </Button>
                      ) : null
                    ) : (
                      <div className="mb-4 space-y-3 rounded-lg border border-blue-200 bg-white p-4">
                        <h4 className="text-sm font-medium text-slate-700">
                          Upload New Document
                        </h4>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <Input
                            placeholder="Document name"
                            value={uploadForm.document_name}
                            onChange={(event) =>
                              setUploadForm((prev) => ({
                                ...prev,
                                document_name: event.target.value,
                              }))
                            }
                          />
                          <select
                            value={uploadForm.document_type}
                            onChange={(event) =>
                              setUploadForm((prev) => ({
                                ...prev,
                                document_type: event.target.value,
                              }))
                            }
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            {DOCUMENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="file"
                            onChange={(event) =>
                              setUploadForm((prev) => ({
                                ...prev,
                                file: event.target.files?.[0] || null,
                              }))
                            }
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleUpload(cadet.cadet_id)}>
                            Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setUploadingFor(null);
                              setUploadForm({
                                document_name: "",
                                document_type: "CV",
                                file: null,
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <ReusableDataTable
                        columns={documentColumns}
                        rows={cadet.documents || []}
                        loading={false}
                        emptyMessage="No documents uploaded or requested yet."
                        pageSize={5}
                        pagination={{
                          current_page: 1,
                          per_page: Math.max((cadet.documents || []).length, 1),
                          total: (cadet.documents || []).length,
                          last_page: 1,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, documentId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
      />

      <DocumentRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleSendRequest}
        cadets={filteredCadets}
        loading={requestLoading}
      />
    </div>
  );
};

export default DocumentsTab;
