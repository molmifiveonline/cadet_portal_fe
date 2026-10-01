import React from 'react';
import { Link } from 'react-router-dom';
import { Ship, ClipboardCheck } from 'lucide-react';
import { Section, EmptyState, Pagination } from './DashboardPrimitives';

export default function CtvReadinessCard({
  data,
  onPage,
  refreshing,
  unavailable,
  fleet,
  canAllocate,
  canViewDrives,
}) {
  return (
    <div id="ctv-readiness">
      <Section
        title="Ready for vessel assignment"
        icon={Ship}
        description="Candidates with verified documents who can be assigned to a vessel."
        action={
          <span className="dash-badge teal">
            {unavailable ? 'Unavailable' : `${data.total} ready`}
          </span>
        }
      >
        {fleet && (
          <div className="dash-fleet-strip">
            <div>
              <strong>{fleet.activeVessels}</strong>
              <span>active vessels</span>
            </div>
            <p>Vessel assignments depend on department and vessel type.</p>
          </div>
        )}
        {unavailable ? (
          <EmptyState>
            The list of candidates ready for assignment is currently
            unavailable.
          </EmptyState>
        ) : !data.rows.length ? (
          <EmptyState>No candidates waiting for CTV allocation.</EmptyState>
        ) : (
          <div className="dash-candidate-list">
            {data.rows.map((row) => (
              <div key={row.id}>
                <div>
                  <strong>{row.name_as_in_indos_cert}</strong>
                  <p>
                    {row.course} · Academic {row.academic_score ?? '—'}%
                  </p>
                  <small>{row.institute_name}</small>
                </div>
                {canAllocate ? (
                  <Link
                    className="dash-text-button"
                    to={`/allocations?department=${encodeURIComponent(row.course?.toLowerCase().includes('deck') ? 'Deck' : 'Engine')}`}
                  >
                    Assign to vessel →
                  </Link>
                ) : canViewDrives && row.drive_id ? (
                  <Link
                    className="dash-text-button"
                    to={`/drives/${row.drive_id}?tab=documents`}
                  >
                    View documents
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {!unavailable && (
          <Pagination
            data={data}
            onPage={onPage}
            disabled={refreshing}
            label="CTV"
          />
        )}
      </Section>
    </div>
  );
}

export function OnboardingPending({
  data,
  unavailable,
  onPage,
  refreshing,
  canView,
}) {
  return (
    <Section
      title="Pending joining checks"
      icon={ClipboardCheck}
      description="Assigned cadets with joining checks to complete."
      action={
        <span className="dash-badge">
          {unavailable ? 'Unavailable' : data.total}
        </span>
      }
    >
      {unavailable ? (
        <EmptyState>
          Joining check details are currently unavailable.
        </EmptyState>
      ) : !data.rows.length ? (
        <EmptyState>
          No joining checks are pending for the selected filters.
        </EmptyState>
      ) : (
        <div className="dash-candidate-list">
          {data.rows.map((row) => (
            <div key={row.onboarding_id}>
              <div>
                <strong>{row.name_as_in_indos_cert}</strong>
                <p>
                  {row.course} · {Number(row.completed_checks || 0)} / 5 checks
                  complete
                </p>
              </div>
              {canView && (
                <Link
                  className="dash-text-button"
                  to={`/onboarding?allocation=${encodeURIComponent(row.cadet_unique_id || row.name_as_in_indos_cert)}`}
                >
                  Complete checklist →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      {!unavailable && (
        <Pagination
          data={data}
          onPage={onPage}
          disabled={refreshing}
          label="onboarding"
        />
      )}
    </Section>
  );
}
