import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileClock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import {
  Section,
  EmptyState,
  Pagination,
  DashboardModal,
  safeExternalUrl,
} from './DashboardPrimitives';

function DocumentReview({ document, onClose, onUpdated, canReview }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(Boolean(Number(document.has_file)));
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  useEffect(() => {
    if (!Number(document.has_file)) return;
    const controller = new AbortController();
    let objectUrl;
    api
      .get(`/documents/${document.id}/download`, {
        responseType: 'blob',
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(response.data);
        setPreview({ url: objectUrl, type: response.data.type });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            'This file could not be loaded. Open the drive to check the document.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document.id, document.has_file]);

  const review = async (status) => {
    if (savingRef.current) return;
    if (status === 'reupload_requested' && !remarks.trim()) {
      setError('Add a reason so the institute knows what to correct.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await api.put(`/documents/${document.id}/review`, {
        status,
        admin_remarks: remarks.trim(),
      });
      toast.success(
        status === 'accepted' ? 'Document approved' : 'Re-upload requested',
      );
      onUpdated();
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'The review could not be saved. Please retry.',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const externalUrl = safeExternalUrl(document.external_upload_link);
  const canApprove = Boolean(preview || externalUrl);
  return (
    <DashboardModal
      title={`Review ${document.document_type}`}
      onClose={onClose}
      busy={saving}
    >
      <p className="dash-modal-description">
        {document.cadet_name} · {document.institute_name}
      </p>
      {loading && <p role="status">Loading preview…</p>}
      {preview?.type === 'application/pdf' ? (
        <iframe
          title="Document preview"
          className="dash-document-preview"
          src={preview.url}
        />
      ) : preview &&
        ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
          preview.type,
        ) ? (
        <img
          className="dash-document-preview"
          src={preview.url}
          alt={`${document.document_type} for ${document.cadet_name}`}
        />
      ) : preview ? (
        <p>Preview unavailable for this file type. Download it to review.</p>
      ) : (
        !loading && (
          <EmptyState>
            {externalUrl
              ? 'This document is stored externally.'
              : 'The requested document has not been uploaded yet.'}
          </EmptyState>
        )
      )}
      {preview && (
        <a
          className="dash-text-button"
          href={preview.url}
          download={document.original_filename || document.document_name}
        >
          Download document
        </a>
      )}
      {externalUrl && (
        <a
          className="dash-text-button"
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open external document
        </a>
      )}
      {canReview && (
        <>
          <label className="dash-review-label">
            Review remarks
            <textarea
              maxLength={2000}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Required when requesting a re-upload"
              disabled={saving}
            />
          </label>
          <p className="dash-footnote">
            Saving a review sends the institute its document status update.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="dash-error">
          {error}
        </p>
      )}
      {canReview && (
        <div className="dash-modal-actions">
          <button
            className="dash-button"
            disabled={saving}
            onClick={() => review('reupload_requested')}
          >
            Request re-upload
          </button>
          <button
            className="dash-button primary"
            disabled={saving || loading || !canApprove}
            onClick={() => review('accepted')}
          >
            {saving ? 'Saving…' : 'Approve document'}
          </button>
        </div>
      )}
    </DashboardModal>
  );
}

export default function PendingDocumentsQueue({
  data,
  unavailable,
  onPage,
  refreshing,
  onUpdated,
  canReview,
  canViewDrives,
}) {
  const [selected, setSelected] = useState(null);
  return (
    <div id="pending-documents">
      <Section
        title="Documents to review"
        icon={FileClock}
        description="Review uploaded documents. Oldest requests are shown first."
        action={
          <span className="dash-badge amber">
            {unavailable ? 'Unavailable' : `${data.total} pending`}
          </span>
        }
      >
        {unavailable ? (
          <EmptyState>Document data is currently unavailable.</EmptyState>
        ) : !data.rows.length ? (
          <EmptyState>
            No documents need review for the selected filters.
          </EmptyState>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Candidate / document</th>
                  <th>Received</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.cadet_name}</strong>
                      <span>
                        {row.document_type} ·{' '}
                        {row.institute_name || 'Institute not recorded'}
                      </span>
                      {!Number(row.has_file) && !row.external_upload_link && (
                        <small>Awaiting upload</small>
                      )}
                    </td>
                    <td>
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="dash-text-button"
                        onClick={() => setSelected(row)}
                      >
                        <Eye size={15} />
                        {canReview ? 'Review' : 'View'}
                      </button>
                      {canViewDrives && row.drive_id && (
                        <Link
                          className="dash-row-link"
                          to={`/drives/${row.drive_id}?tab=documents`}
                        >
                          Open drive
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!unavailable && (
          <Pagination
            data={data}
            onPage={onPage}
            disabled={refreshing}
            label="documents"
          />
        )}
        {selected && (
          <DocumentReview
            document={selected}
            onClose={() => setSelected(null)}
            canReview={canReview}
            onUpdated={onUpdated}
          />
        )}
      </Section>
    </div>
  );
}
