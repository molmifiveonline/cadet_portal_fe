import React, { useRef, useState } from 'react';
import { CheckCircle2, Circle, Ship, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import { Section, EmptyState, safeExternalUrl } from './DashboardPrimitives';

export default function CadetDashboard({ data, onUpdated }) {
  const [uploading, setUploading] = useState(null);
  const uploadRef = useRef(false);
  const personal = data.personal;
  const upload = async (document, file) => {
    if (!file || uploadRef.current) return;
    if (
      file.size > 5 * 1024 * 1024 ||
      !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)
    ) {
      toast.error('Choose a PDF, JPG or PNG file up to 5 MB.');
      return;
    }
    uploadRef.current = true;
    setUploading(document.id);
    try {
      const form = new FormData();
      form.append('document', file);
      await api.put(`/dashboard/documents/${document.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded for review');
      onUpdated();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Upload failed. Please retry.',
      );
    } finally {
      uploadRef.current = false;
      setUploading(null);
    }
  };
  if (!personal?.candidate)
    return (
      <Section title="Application not linked">
        <EmptyState>
          We could not uniquely match an application to your account email.
          Contact your institute to confirm your application details.
        </EmptyState>
      </Section>
    );
  const medical = data.pipeline.find((stage) => stage.key === 'medical');
  const assignment = personal.assignment;
  const vessels = [
    assignment?.allocation_status === 'Allocated' && assignment.vessel_name,
    assignment?.secondary_allocation_status === 'Allocated' &&
      assignment.secondary_vessel_name,
  ].filter(Boolean);
  return (
    <>
      <Section
        title={personal.candidate.name_as_in_indos_cert}
        description={`${personal.candidate.cadet_unique_id} · ${personal.candidate.course}`}
        action={<span className="dash-badge">{personal.candidate.status}</span>}
      >
        <ol className="dash-roadmap">
          {data.pipeline.map((stage) => (
            <li key={stage.key} className={stage.count ? 'complete' : ''}>
              {stage.count ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              <strong>{stage.label}</strong>
              <span>{stage.count ? 'Completed' : 'Awaiting completion'}</span>
            </li>
          ))}
        </ol>
        <p className="dash-personal-status">
          Medical status:{' '}
          <strong>
            {medical?.count
              ? 'Cleared'
              : personal.candidate.status === 'Medical Failed'
                ? 'Not cleared — contact your institute'
                : 'Awaiting clearance'}
          </strong>
        </p>
      </Section>
      <div className="dash-operations">
        <Section
          title="Your document checklist"
          icon={FileText}
          description="Complete requested uploads to keep your application moving."
        >
          {data.unavailable.includes('documents') ? (
            <EmptyState>Documents are currently unavailable.</EmptyState>
          ) : !personal.documents.length ? (
            <EmptyState>No documents have been requested yet.</EmptyState>
          ) : (
            <div className="dash-personal-documents">
              {personal.documents.map((document) => {
                const external = safeExternalUrl(document.external_upload_link);
                const needsUpload =
                  document.status === 'reupload_requested' ||
                  (document.status === 'pending' && !Number(document.has_file));
                return (
                  <div key={document.id}>
                    <div>
                      <strong>{document.document_type}</strong>
                      <span className="dash-badge">
                        {document.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {document.admin_remarks && <p>{document.admin_remarks}</p>}
                    {needsUpload && (
                      <label className="dash-upload-label">
                        {uploading === document.id
                          ? 'Uploading…'
                          : 'Upload PDF, JPG or PNG · max 5 MB'}
                        <input
                          aria-label={`Upload ${document.document_type}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={Boolean(uploading)}
                          onChange={(event) => {
                            upload(document, event.target.files?.[0]);
                            event.target.value = '';
                          }}
                        />
                      </label>
                    )}
                    {needsUpload && external && (
                      <a
                        className="dash-text-button"
                        href={external}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open upload instructions
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
        <Section
          title="Vessel assignment"
          icon={Ship}
          description="Your next destination."
        >
          {vessels.length ? (
            <div className="dash-assignment">
              <Ship size={36} />
              <h3>{vessels.join(' / ')}</h3>
              <p>
                Your vessel allocation is confirmed. Your institute will share
                joining instructions.
              </p>
            </div>
          ) : (
            <EmptyState>
              Your vessel assignment will appear here once confirmed.
            </EmptyState>
          )}
        </Section>
      </div>
    </>
  );
}
