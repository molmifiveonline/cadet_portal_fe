import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import { useUserPermissions } from '../hooks/usePermission';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import MetricsGrid from '../components/dashboard/MetricsGrid';
import PipelineFunnelWidget from '../components/dashboard/PipelineFunnelWidget';
import DemographicsWidget from '../components/dashboard/DemographicsWidget';
import PendingDocumentsQueue from '../components/dashboard/PendingDocumentsQueue';
import CtvReadinessCard, {
  OnboardingPending,
} from '../components/dashboard/CtvReadinessCard';
import AlertsBanner from '../components/dashboard/AlertsBanner';
import InstituteSummary from '../components/dashboard/InstituteSummary';
import CadetDashboard from '../components/dashboard/CadetDashboard';
import StageCandidatesModal from '../components/dashboard/StageCandidatesModal';
import '../components/dashboard/dashboard.css';

const emptyOptions = { drives: [], batchYears: [] };

export default function Dashboard() {
  const { user } = useAuth();
  const { hasPermission } = useUserPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterKey = JSON.stringify(
    Object.fromEntries(
      ['driveId', 'stream', 'batchYear', 'from', 'to'].flatMap((key) =>
        searchParams.get(key) && searchParams.get(key) !== 'all'
          ? [[key, searchParams.get(key)]]
          : [],
      ),
    ),
  );
  const filters = useMemo(() => JSON.parse(filterKey), [filterKey]);
  const [pages, setPages] = useState({});
  const [snapshot, setSnapshot] = useState(null);
  const [options, setOptions] = useState(emptyOptions);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stage, setStage] = useState(null);
  const activeRequest = useRef(null);
  const requestVersion = useRef(0);
  const personal = user?.role === 'Cadet';
  const institute = user?.role === 'Institute';
  const canReview = ['SuperAdmin', 'Admin'].includes(user?.role);
  const identity = `${user?.id}:${user?.role}`;
  const snapshotKey = `${identity}:${personal ? '{}' : filterKey}`;
  const data = snapshot?.key === snapshotKey ? snapshot.data : null;

  const load = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const version = ++requestVersion.current;
    setRefreshing(true);
    setError('');
    try {
      const response = await api.get('/dashboard/stats', {
        params: { ...(personal ? {} : filters), ...pages },
        signal: controller.signal,
      });
      if (controller.signal.aborted || version !== requestVersion.current)
        return;
      setSnapshot({ key: snapshotKey, data: response.data.data });
      setOptions(response.data.data.filterOptions || emptyOptions);
    } catch (error) {
      if (!controller.signal.aborted && version === requestVersion.current)
        setError(
          error.response?.data?.message ||
            'Unable to load dashboard. Please try again.',
        );
    } finally {
      if (!controller.signal.aborted && version === requestVersion.current)
        setRefreshing(false);
    }
  }, [filters, pages, personal, snapshotKey]);

  useEffect(() => {
    load();
    return () => activeRequest.current?.abort();
  }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      if (!document.hidden && !document.querySelector('dialog[open]')) load();
    }, 60000);
    return () => clearInterval(timer);
  }, [autoRefresh, load]);
  useEffect(() => {
    setStage(null);
  }, [filterKey, identity]);

  const changeFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setPages({});
    setSearchParams(next, { replace: true });
  };
  const page = (name) => (value) =>
    setPages((previous) => ({ ...previous, [`${name}Page`]: value }));
  const missing = (key) => data?.unavailable.includes(key);
  const canViewDrives = hasPermission('recruitment_drives', 'view');

  return (
    <div className="dashboard">
      <DashboardHeader
        user={user}
        filters={filters}
        options={options}
        onFilter={changeFilter}
        onReset={() => {
          setPages({});
          setSearchParams({}, { replace: true });
        }}
        refresh={load}
        refreshing={refreshing}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        updatedAt={data?.generatedAt}
      />
      {error && (
        <div className="dash-error-banner" role="alert">
          <span>
            {error}
            {data && ' Showing the last successful update.'}
          </span>
          <button className="dash-button" onClick={load} disabled={refreshing}>
            Retry
          </button>
        </div>
      )}
      {!data && !error ? (
        <DashboardSkeleton />
      ) : (
        data && (
          <>
            {data.unavailable.length > 0 && (
              <div className="dash-warning-banner" role="status">
                Some dashboard sections are unavailable:{' '}
                {data.unavailable.join(', ')}. Refresh to try again.
              </div>
            )}
            {personal ? (
              <CadetDashboard data={data} onUpdated={load} />
            ) : (
              <>
                {institute && (
                  <InstituteSummary
                    rows={data.submissions}
                    unavailable={missing('submissions')}
                    driveId={filters.driveId}
                  />
                )}
                <MetricsGrid
                  data={data}
                  onStage={setStage}
                  onDocuments={() =>
                    document
                      .getElementById('pending-documents')
                      ?.scrollIntoView({ block: 'center' })
                  }
                />
                <div className="dash-analytics">
                  <PipelineFunnelWidget
                    stages={data.pipeline}
                    unavailable={missing('summary')}
                    onStage={setStage}
                  />
                  <DemographicsWidget data={data} />
                </div>
                <div className="dash-operations">
                  <PendingDocumentsQueue
                    key={snapshotKey}
                    data={data.pendingDocuments}
                    unavailable={missing('documents')}
                    onPage={page('documents')}
                    refreshing={refreshing}
                    onUpdated={load}
                    canReview={canReview}
                    canViewDrives={canViewDrives}
                  />
                  <CtvReadinessCard
                    data={data.ctvReadyCandidates}
                    unavailable={missing('ctv')}
                    fleet={data.fleet}
                    onPage={page('ctv')}
                    refreshing={refreshing}
                    canAllocate={
                      !institute && hasPermission('allocations', 'view')
                    }
                    canViewDrives={canViewDrives}
                  />
                </div>
                <div className="dash-operations">
                  <OnboardingPending
                    data={data.onboardingPending}
                    unavailable={missing('onboarding')}
                    onPage={page('onboarding')}
                    refreshing={refreshing}
                    canView={!institute && hasPermission('onboarding', 'view')}
                  />
                  <AlertsBanner
                    alerts={data.expiryAlerts}
                    institute={institute}
                    unavailable={missing('alerts')}
                    canExtend={
                      !institute && hasPermission('institutes', 'edit')
                    }
                    onUpdated={load}
                  />
                </div>
              </>
            )}
          </>
        )
      )}
      {stage && (
        <StageCandidatesModal
          key={stage.key}
          stage={stage}
          filters={filters}
          onClose={() => setStage(null)}
          canViewDrives={canViewDrives}
        />
      )}
    </div>
  );
}
