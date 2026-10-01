import React from 'react';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Section, EmptyState } from './DashboardPrimitives';

export default function InstituteSummary({ rows, unavailable, driveId }) {
  return (
    <Section
      title="Batch submissions"
      icon={Upload}
      description="Upload status for your institute and selected drive."
      action={
        <Link
          className="dash-button primary"
          to={driveId ? `/drives/${driveId}` : '/institute/submit-excel'}
        >
          <Upload size={15} />
          Upload Excel
        </Link>
      }
    >
      {unavailable ? (
        <EmptyState>Submission data is currently unavailable.</EmptyState>
      ) : rows.length ? (
        <div className="dash-submissions">
          {rows.map((row) => (
            <div key={row.status}>
              <strong>{row.count}</strong>
              <span>
                {row.status === 'pending' ? 'Awaiting import' : row.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>
          No submissions yet. Start by uploading your batch.
        </EmptyState>
      )}
    </Section>
  );
}
