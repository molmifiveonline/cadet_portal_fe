import React from 'react';
export default function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="dash-skeleton">
      <span className="sr-only">Loading dashboard…</span>
      <div className="dash-metrics">
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className="dash-skeleton-card" />
        ))}
      </div>
      <div className="dash-analytics">
        <div />
        <div />
      </div>
      <div className="dash-operations">
        <div />
        <div />
      </div>
    </div>
  );
}
