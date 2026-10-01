import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import PendingDocumentsQueue from './PendingDocumentsQueue';
import CadetDashboard from './CadetDashboard';
import api from '../../lib/utils/apiConfig';
import { useAuth } from '../../context/AuthContext';
import { useUserPermissions } from '../../hooks/usePermission';

jest.mock('../../lib/utils/apiConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
}));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../hooks/usePermission', () => ({
  useUserPermissions: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// CRA's Jest resolver predates React Router 7's package exports. Keep routing
// state real in React here; the browser check covers the actual router.
jest.mock(
  'react-router-dom',
  () => {
    const React = require('react');
    return {
      MemoryRouter: ({ children }) =>
        React.createElement(React.Fragment, null, children),
      Link: ({ to, children, ...props }) =>
        React.createElement('a', { href: to, ...props }, children),
      useSearchParams: () => React.useState(() => new URLSearchParams()),
    };
  },
  { virtual: true },
);

const queue = { rows: [], total: 0, page: 1, pageSize: 5 };
const snapshot = (overrides = {}) => ({
  generatedAt: '2026-09-30T10:00:00Z',
  scope: 'global',
  filters: {},
  totalCandidates: 12,
  totalInstitutes: 2,
  pipeline: [
    {
      key: 'applied',
      label: 'Applied',
      count: 12,
      tab: 'cadets',
      conversionRate: null,
    },
    {
      key: 'shortlisted',
      label: 'Shortlisted',
      count: 8,
      tab: 'shortlist',
      conversionRate: 66.7,
    },
    {
      key: 'medical',
      label: 'Medical cleared',
      count: 3,
      tab: 'medical',
      conversionRate: 37.5,
    },
  ],
  streamDistribution: [{ label: 'Deck', count: 12 }],
  genderDistribution: [{ label: 'Other / not recorded', count: 12 }],
  topInstitutes: [],
  pendingDocuments: queue,
  ctvReadyCandidates: queue,
  onboardingPending: queue,
  expiryAlerts: [],
  fleet: null,
  recentActivity: [],
  submissions: [],
  unavailable: [],
  filterOptions: {
    drives: [
      { id: 'drive-1', drive_name: 'Drive one' },
      { id: 'drive-2', drive_name: 'Drive two' },
    ],
    batchYears: ['2026'],
  },
  ...overrides,
});
const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  window.matchMedia = () => ({ matches: true });
  HTMLElement.prototype.scrollIntoView = jest.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
});
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({
    user: { id: 'admin', role: 'SuperAdmin', first_name: 'Alex' },
  });
  useUserPermissions.mockReturnValue({ hasPermission: () => true });
  api.get.mockResolvedValue({ data: { data: snapshot() } });
});

test('filters apply to the API and a late response cannot replace the newest cohort', async () => {
  let resolveFirst;
  renderDashboard();
  await screen.findByText('Recruitment progress');
  api.get.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
  );
  fireEvent.keyDown(
    screen.getByRole('combobox', { name: 'Recruitment drive' }),
    { key: 'ArrowDown' },
  );
  fireEvent.click(await screen.findByRole('option', { name: 'Drive one' }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/dashboard/stats',
      expect.objectContaining({ params: { driveId: 'drive-1' } }),
    ),
  );
  api.get.mockResolvedValueOnce({
    data: {
      data: snapshot({ totalCandidates: 7, filters: { driveId: 'drive-2' } }),
    },
  });
  fireEvent.keyDown(
    screen.getByRole('combobox', { name: 'Recruitment drive' }),
    { key: 'ArrowDown' },
  );
  fireEvent.click(await screen.findByRole('option', { name: 'Drive two' }));
  await screen.findByLabelText('7');
  await act(async () =>
    resolveFirst({ data: { data: snapshot({ totalCandidates: 99 }) } }),
  );
  expect(screen.queryByLabelText('99')).not.toBeInTheDocument();
  expect(screen.getByLabelText('7')).toBeInTheDocument();
  expect(screen.queryByLabelText('Export summary')).not.toBeInTheDocument();
});

test('failed refresh retains the last successful snapshot with an explicit error', async () => {
  renderDashboard();
  await screen.findByText('Recruitment progress');
  api.get.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Showing the last successful update',
  );
  expect(screen.getByText('Recruitment progress')).toBeInTheDocument();
});

test('institute view exposes submission tools but hides admin actions and global audit feed', async () => {
  useAuth.mockReturnValue({
    user: { id: 'institute', role: 'Institute', intent: 'institute_drives' },
  });
  useUserPermissions.mockReturnValue({
    hasPermission: (module) => module === 'recruitment_drives',
  });
  renderDashboard();
  expect(await screen.findByText('Batch submissions')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Upload Excel/ })).toHaveAttribute(
    'href',
    '/institute/submit-excel',
  );
  expect(screen.queryByText('Recent activity')).not.toBeInTheDocument();
  expect(screen.queryByText('Extend access')).not.toBeInTheDocument();
});

test('unlinked cadet never renders global metrics or filters', async () => {
  useAuth.mockReturnValue({ user: { id: 'cadet-user', role: 'Cadet' } });
  api.get.mockResolvedValue({
    data: {
      data: snapshot({ scope: 'personal', personal: { candidate: null } }),
    },
  });
  renderDashboard();
  await screen.findByText('Application not linked');
  expect(screen.queryByText('Total candidates')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Recruitment drive')).not.toBeInTheDocument();
});

test('auto-refresh fires at sixty seconds and cleans up when disabled', async () => {
  jest.useFakeTimers();
  try {
    renderDashboard();
    await act(async () => {});
    fireEvent.click(screen.getByRole('checkbox', { name: /Auto-refresh/ }));
    await act(async () => jest.advanceTimersByTime(60000));
    expect(api.get).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('checkbox', { name: /Auto-refresh/ }));
    await act(async () => jest.advanceTimersByTime(60000));
    expect(api.get).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});

test('request re-upload requires remarks and prevents duplicate review submissions', async () => {
  const document = {
    id: 'doc',
    document_type: 'Passport',
    cadet_name: 'Sample cadet',
    institute_name: 'Institute',
    has_file: 0,
    status: 'pending',
  };
  const onUpdated = jest.fn();
  let resolveSave;
  api.put.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  );
  render(
    <MemoryRouter>
      <PendingDocumentsQueue
        data={{ ...queue, rows: [document], total: 1 }}
        onPage={jest.fn()}
        canReview
        onUpdated={onUpdated}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Review' }));
  const dialog = screen.getByRole('dialog');
  expect(
    within(dialog).getByRole('button', { name: 'Approve document' }),
  ).toBeDisabled();
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Request re-upload' }),
  );
  expect(api.put).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Review remarks'), {
    target: { value: 'Please upload a legible scan' },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Request re-upload' }),
  );
  expect(
    within(dialog).getByRole('button', { name: 'Request re-upload' }),
  ).toBeDisabled();
  expect(api.put).toHaveBeenCalledTimes(1);
  expect(api.put).toHaveBeenCalledWith('/documents/doc/review', {
    status: 'reupload_requested',
    admin_remarks: 'Please upload a legible scan',
  });
  await act(async () => resolveSave({ data: { success: true } }));
  expect(onUpdated).toHaveBeenCalledTimes(1);
});

test('cadet checklist uploads only a requested file and shows confirmed vessels', async () => {
  const onUpdated = jest.fn();
  api.put.mockResolvedValue({ data: { success: true } });
  const data = snapshot({
    scope: 'personal',
    personal: {
      candidate: {
        id: 'cadet',
        name_as_in_indos_cert: 'My application',
        course: 'Deck',
        status: 'Selected',
      },
      documents: [
        {
          id: 'requested',
          document_type: 'Passport',
          status: 'reupload_requested',
          has_file: 1,
        },
        {
          id: 'accepted',
          document_type: 'CV',
          status: 'accepted',
          has_file: 1,
        },
      ],
      assignment: {
        vessel_name: 'Confirmed vessel',
        allocation_status: 'Allocated',
        secondary_vessel_name: 'Reserved vessel',
        secondary_allocation_status: 'Hold',
      },
    },
  });
  render(<CadetDashboard data={data} onUpdated={onUpdated} />);
  expect(screen.getByText('Confirmed vessel')).toBeInTheDocument();
  expect(screen.queryByText('Reserved vessel')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Upload CV')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Upload Passport'), {
    target: {
      files: [new File(['pdf'], 'passport.pdf', { type: 'application/pdf' })],
    },
  });
  await waitFor(() => expect(onUpdated).toHaveBeenCalledTimes(1));
  expect(api.put).toHaveBeenCalledWith(
    '/dashboard/documents/requested',
    expect.any(FormData),
    expect.objectContaining({
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
});
