import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { DashboardModal, EmptyState, Pagination } from './DashboardPrimitives';

export default function StageCandidatesModal({
  stage,
  filters,
  onClose,
  canViewDrives,
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get('/dashboard/candidates', {
        params: { ...filters, stage: stage.key, page },
        signal: controller.signal,
      })
      .then((response) => setData(response.data.data))
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error.response?.data?.message || 'Could not load candidates.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, stage.key, page, retry]);
  return (
    <DashboardModal title={stage.label} onClose={onClose}>
      {loading ? (
        <p role="status" className="dash-empty">
          Loading candidates…
        </p>
      ) : error ? (
        <div role="alert">
          {error}{' '}
          <button
            className="dash-text-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {!data?.rows.length ? (
            <EmptyState />
          ) : (
            <div className="dash-candidate-list">
              {data.rows.map((row) => (
                <div key={row.id}>
                  <div>
                    <strong>{row.name_as_in_indos_cert}</strong>
                    <p>
                      {row.cadet_unique_id} · {row.course} ·{' '}
                      {row.institute_name}
                    </p>
                    <span className="dash-badge">{row.status}</span>
                  </div>
                  {canViewDrives && row.drive_id && (
                    <Link
                      className="dash-text-button"
                      to={`/drives/${row.drive_id}?tab=${stage.tab}`}
                    >
                      Open drive
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
          <Pagination data={data} onPage={setPage} label="candidates" />
        </>
      )}
    </DashboardModal>
  );
}
