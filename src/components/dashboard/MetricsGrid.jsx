import React from 'react';
import { Users, UserCheck, Ship, FileClock } from 'lucide-react';
import MetricCard from './MetricCard';

export default function MetricsGrid({ data, onStage, onDocuments }) {
  const shortlisted = data.pipeline.find(
    (stage) => stage.key === 'shortlisted',
  );
  const missing = (key) => data.unavailable.includes(key);
  return (
    <div className="dash-metrics">
      <MetricCard
        label="Total candidates"
        value={missing('summary') ? null : data.totalCandidates}
        detail={`${data.totalInstitutes} institutes`}
        icon={Users}
        onClick={() => onStage(data.pipeline[0])}
      />
      <MetricCard
        label="Shortlisted"
        value={missing('summary') ? null : shortlisted?.count || 0}
        detail={
          shortlisted?.conversionRate == null
            ? 'Percentage not available yet'
            : `${shortlisted.conversionRate}% of applicants shortlisted`
        }
        icon={UserCheck}
        tone="violet"
        onClick={() => onStage(shortlisted)}
      />
      <MetricCard
        label="Ready for CTV"
        value={missing('ctv') ? null : data.ctvReadyCandidates.total}
        detail="Documents verified · awaiting allocation"
        icon={Ship}
        tone="teal"
        onClick={() =>
          document
            .getElementById('ctv-readiness')
            ?.scrollIntoView({ block: 'center' })
        }
      />
      <MetricCard
        label="Documents pending"
        value={missing('documents') ? null : data.pendingDocuments.total}
        detail="Awaiting upload or document review"
        icon={FileClock}
        tone="amber"
        onClick={onDocuments}
      />
    </div>
  );
}
