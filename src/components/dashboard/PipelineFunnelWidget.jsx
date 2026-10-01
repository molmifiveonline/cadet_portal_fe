import React from 'react';
import { GitBranch, ArrowUpRight } from 'lucide-react';
import { Section, EmptyState } from './DashboardPrimitives';

export default function PipelineFunnelWidget({ stages, unavailable, onStage }) {
  const total = Math.max(1, ...stages.map((stage) => stage.count));
  return (
    <Section
      title="Recruitment progress"
      icon={GitBranch}
      description="Select a step to see the candidates at that step."
    >
      {unavailable ? (
        <EmptyState>Recruitment progress is currently unavailable.</EmptyState>
      ) : (
        <div className="dash-funnel">
          {stages.map((stage, index) => (
            <button
              key={stage.key}
              className="dash-funnel-stage"
              onClick={() => onStage(stage)}
            >
              <div className="dash-funnel-label">
                <span>
                  <small>{String(index + 1).padStart(2, '0')}</small>
                  {stage.label}
                </span>
                <strong>
                  {stage.count.toLocaleString()}
                  <ArrowUpRight size={14} />
                </strong>
              </div>
              <div className="dash-track">
                <div
                  style={{
                    width: `${(stage.count / total) * 100}%`,
                    opacity: 1 - index * 0.09,
                  }}
                />
              </div>
              <div className="dash-funnel-note">
                {index === 0 ? (
                  'Candidates who applied'
                ) : stage.conversionRate === null ? (
                  'Percentage not available'
                ) : (
                  <>
                    <span>
                      {stage.conversionRate}% moved here from the previous step
                    </span>
                    <span>{stage.dropOffRate}% have not reached this step</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      <p className="dash-footnote">
        Candidates who have not reached the next step may still be under review.
        These percentages do not show how many were rejected.
      </p>
    </Section>
  );
}
