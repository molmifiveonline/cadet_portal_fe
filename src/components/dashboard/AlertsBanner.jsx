import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import ExtendTokenModal from '../../pages/institutes/ExtendTokenModal';
import { Section, EmptyState } from './DashboardPrimitives';

export default function AlertsBanner({
  alerts,
  institute,
  unavailable,
  canExtend,
  onUpdated,
}) {
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? alerts : alerts.slice(0, 5);
  return (
    <Section
      title={institute ? 'Your login access' : 'Login expiry alerts'}
      icon={ShieldAlert}
      description={
        institute
          ? 'Check when your institute login access expires.'
          : 'Accounts expiring in the next seven days or already expired.'
      }
    >
      {unavailable ? (
        <EmptyState>Login access details are currently unavailable.</EmptyState>
      ) : !alerts.length ? (
        <EmptyState>
          {institute
            ? 'No expiry date is set for your login access.'
            : 'No login access has expired or will expire in the next seven days.'}
        </EmptyState>
      ) : (
        <div className="dash-alert-list">
          {visible.map((alert) => {
            const remaining =
              new Date(alert.temp_expiry).getTime() - Date.now();
            const expired = remaining <= 0;
            const urgent = remaining < 7 * 86400000;
            const timeLeft =
              remaining < 86400000
                ? `${Math.max(1, Math.ceil(remaining / 3600000))} hours`
                : `${Math.ceil(remaining / 86400000)} days`;
            return (
              <div
                className={`dash-alert ${expired ? 'expired' : urgent ? 'warning' : ''}`}
                key={alert.id}
              >
                <div>
                  <strong>{alert.institute_name}</strong>
                  <p>
                    {expired
                      ? 'Access expired'
                      : `Access expires in ${timeLeft}`}{' '}
                    · {new Date(alert.temp_expiry).toLocaleDateString()}
                  </p>
                </div>
                {canExtend && (
                  <button
                    className="dash-text-button"
                    onClick={() => setSelected(alert)}
                  >
                    Extend access
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {alerts.length > 5 && (
        <button
          className="dash-text-button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show fewer' : `View all ${alerts.length} alerts`}
        </button>
      )}
      {selected && (
        <ExtendTokenModal
          isOpen
          institute={selected}
          onClose={() => setSelected(null)}
          onSuccess={onUpdated}
        />
      )}
    </Section>
  );
}
