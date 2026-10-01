import React from 'react';
import { PieChart } from 'lucide-react';
import { Section, EmptyState } from './DashboardPrimitives';

function Breakdown({ title, rows }) {
  const total = rows.reduce((sum, row) => sum + Number(row.count), 0);
  return (
    <div className="dash-breakdown">
      <h3>{title}</h3>
      {!total ? (
        <EmptyState>No candidates match the selected filters.</EmptyState>
      ) : (
        rows.map((row, index) => (
          <div key={row.label}>
            <div className="dash-breakdown-label">
              <span>{row.label}</span>
              <strong>
                {Number(row.count).toLocaleString()}{' '}
                <small>· {Math.round((row.count / total) * 100)}%</small>
              </strong>
            </div>
            <div className="dash-track">
              <div
                style={{
                  width: `${(row.count / total) * 100}%`,
                  background: [
                    '#4f46e5',
                    '#0d9488',
                    '#94a3b8',
                    '#7c3aed',
                    '#d97706',
                  ][index % 5],
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function DemographicsWidget({ data }) {
  return (
    <Section
      title="Candidate summary"
      icon={PieChart}
      description="Candidate counts by stream, gender, and institute."
    >
      {data.unavailable.includes('demographics') ? (
        <EmptyState>Candidate summary is currently unavailable.</EmptyState>
      ) : (
        <>
          <Breakdown title="Stream" rows={data.streamDistribution} />
          <Breakdown title="Gender" rows={data.genderDistribution} />
          <div className="dash-breakdown">
            <h3>Institutes with the most candidates</h3>
            {data.topInstitutes.length ? (
              <ol className="dash-institute-list">
                {data.topInstitutes.map((row, index) => (
                  <li key={`${index}-${row.label}`}>
                    <span>
                      <small>{index + 1}</small>
                      {row.label}
                    </span>
                    <strong>{row.count}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState>No institutes match the selected filters.</EmptyState>
            )}
          </div>
        </>
      )}
    </Section>
  );
}
