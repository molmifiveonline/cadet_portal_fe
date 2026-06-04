import React, { useEffect, useState } from "react";
import { Loader2, X, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { DOCUMENT_TYPES } from "../../lib/constant";

const DocumentRequestModal = ({
  isOpen,
  onClose,
  onSubmit,
  cadets = [],
  loading = false,
}) => {
  // Each entry: { cadet_id, onedrive_link }
  const [cadetLinks, setCadetLinks] = useState({});
  const [cadetRemarks, setCadetRemarks] = useState({});
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("CV");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCadetLinks({});
      setCadetRemarks({});
      setDocumentName("");
      setDocumentType("CV");
      setRemarks("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateLink = (cadetId, link) => {
    setCadetLinks((prev) => ({ ...prev, [cadetId]: link }));
  };

  const updateRemark = (cadetId, remark) => {
    setCadetRemarks((prev) => ({ ...prev, [cadetId]: remark }));
  };

  const filledCadets = Object.entries(cadetLinks).filter(
    ([, link]) => link && link.trim().length > 0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (filledCadets.length === 0) return;

    const cadetLinksPayload = filledCadets.map(([cadetId, link]) => ({
      cadet_id: cadetId,
      onedrive_link: link.trim(),
      remark: (cadetRemarks[cadetId] || "").trim(),
    }));

    await onSubmit({
      cadet_links: cadetLinksPayload,
      remarks: remarks.trim(),
      document_name: documentName.trim() || undefined,
      document_type: documentType,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Request Document Upload</h2>
            <p className="mt-1 text-sm text-slate-500">
              Paste each cadet's individual OneDrive folder link. Only cadets with a link will receive the email.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Per-cadet folder isolation</p>
                <p className="mt-1">
                  Create a separate subfolder for each cadet in your OneDrive (e.g., <code className="rounded bg-blue-100 px-1">Drive-2026 / Rakesh Kumar</code>), 
                  share it with only that cadet's email ("Specific people" → "Can edit"), and paste the link below.
                </p>
              </div>
            </div>

            {/* Document Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="E.g., Passport Copy, INDOS Certificate..."
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Instructions / Remarks (Optional - applied as default if no cadet remark is set)
              </label>
              <textarea
                rows={2}
                placeholder="E.g., Please upload your Passport, CDC, and Medical Certificate..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Per-cadet link inputs */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Cadet OneDrive Links ({filledCadets.length} of {cadets.length} filled)
                </label>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                {cadets.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">
                    No cadets available in this drive.
                  </p>
                ) : (
                  cadets.map((cadet) => (
                    <div
                      key={cadet.cadet_id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white p-3.5 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-bold uppercase text-indigo-700">
                          {cadet.cadet_unique_id}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-900">
                          {cadet.name_as_in_indos_cert}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="url"
                            placeholder="OneDrive Folder URL..."
                            value={cadetLinks[cadet.cadet_id] || ""}
                            onChange={(e) => updateLink(cadet.cadet_id, e.target.value)}
                            className="pl-9 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <Input
                            type="text"
                            placeholder="Remark for this cadet (optional)..."
                            value={cadetRemarks[cadet.cadet_id] || ""}
                            onChange={(e) => updateRemark(cadet.cadet_id, e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || filledCadets.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send to ${filledCadets.length} Cadet${filledCadets.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentRequestModal;
