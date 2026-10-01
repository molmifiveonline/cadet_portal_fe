import React from 'react';
import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { toast } from 'sonner';
import AssessmentTypes from './index';
import Vessels from '../vessels';
import api from '../../lib/utils/apiConfig';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), {
  virtual: true,
});
jest.mock('../../lib/utils/apiConfig', () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));
jest.mock('../../hooks/usePermission', () => ({
  __esModule: true,
  default: () => ({ hasPermission: true, loading: false }),
  usePermission: () => ({ hasPermission: true, loading: false }),
}));
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());
const response = (rows) => ({
  data: {
    success: true,
    data: rows,
    pagination: { page: 1, limit: 10, total: rows.length, totalPages: 1 },
  },
});
const fixture = (id, canDelete, reason) => ({
  id,
  name: id,
  status: 'Active',
  can_delete: canDelete,
  delete_blocked_reason: canDelete ? null : reason,
});

for (const [kind, Component, endpoint, deleteLabel, confirmText, reason] of [
  [
    'assessment',
    AssessmentTypes,
    'allocations/masters/courses',
    'Delete',
    'Delete Assessment Type',
    'Cannot delete this assessment type because it is linked to cadet scores.',
  ],
  [
    'vessel',
    Vessels,
    'vessels',
    'Delete vessel',
    'Delete',
    'Cannot delete this vessel because it is linked to primary or secondary vessel allocations.',
  ],
]) {
  it(`${kind}: shows why deletion is blocked and allows unused records to be deleted`, async () => {
    let rows = [
      fixture('Linked record', false, reason),
      fixture('Unused record', true, reason),
    ];
    api.get.mockImplementation(async () => response(rows));
    api.delete.mockImplementation(async () => {
      rows = rows.filter((row) => row.id !== 'Unused record');
      return response(rows);
    });
    render(<Component />);
    const usedRow = (await screen.findByText('Linked record')).closest('tr');
    const blocked = within(usedRow).getByRole('button', {
      name: deleteLabel,
      exact: true,
    });
    expect(blocked).toBeDisabled();
    expect(blocked).toHaveAccessibleDescription(reason);
    expect(
      within(usedRow).getByRole('button', {
        name: `Why ${deleteLabel.toLowerCase()} is disabled`,
      }),
    ).toBeEnabled();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.click(blocked);
    expect(api.delete).not.toHaveBeenCalled();
    const unusedRow = screen.getByText('Unused record').closest('tr');
    expect(
      within(unusedRow).queryByRole('button', {
        name: `Why ${deleteLabel.toLowerCase()} is disabled`,
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(unusedRow).getByRole('button', { name: deleteLabel, exact: true }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: confirmText, exact: true }),
    );
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(`/${endpoint}/Unused record`),
    );
    await waitFor(() =>
      expect(screen.queryByText('Unused record')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Linked record')).toBeInTheDocument();
  });

  it(`${kind}: refreshes dependencies after a stale delete attempt`, async () => {
    let linked = false;
    api.get.mockImplementation(async () =>
      response([fixture('Record', !linked, reason)]),
    );
    api.delete.mockImplementation(async () => {
      linked = true;
      throw Object.assign(new Error(reason), {
        response: { status: 409, data: { message: reason } },
      });
    });
    render(<Component />);
    fireEvent.click(
      await screen.findByRole('button', { name: deleteLabel, exact: true }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: confirmText, exact: true }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(reason));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: deleteLabel, exact: true }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole('button', { name: deleteLabel, exact: true }),
    ).toHaveAccessibleDescription(reason);
    expect(toast.success).not.toHaveBeenCalled();
  });
}
