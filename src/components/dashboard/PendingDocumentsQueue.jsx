import React from 'react';
import { FileClock, ExternalLink } from 'lucide-react';
import {
  Section,
  EmptyState,
  Pagination,
  safeExternalUrl,
} from './DashboardPrimitives';

export default function PendingDocumentsQueue({
  data,
  unavailable,
  onPage,
  refreshing,
}) {
  return (
    <div id="pending-documents">
      <Section
        title="Documents to review"
        icon={FileClock}
        description="Open the saved Drive link to view documents. Oldest requests are shown first."
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
                {data.rows.map((row) => {
                  const driveUrl = safeExternalUrl(
                    row.external_upload_link,
                  );
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.cadet_name}</strong>
                        <span>
                          {row.document_type} ·{' '}
                          {row.institute_name || 'Institute not recorded'}
                        </span>
                        {!Number(row.has_file) &&
                          !row.external_upload_link && (
                            <small>Awaiting upload</small>
                          )}
                      </td>
                      <td>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td>
                        {driveUrl ? (
                          <a
                            className="dash-text-button"
                            href={driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={15} aria-hidden="true" />
                            Open Drive
                          </a>
                        ) : (
                          <span>No Drive link</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
      </Section>
    </div>
  );
}
