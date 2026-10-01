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
import MedicalCenters from './index';
import MedicalReports from '../medical-reports';
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
const fixture = (nameField, id, canDelete, reason) => ({
  id,
  [nameField]: id,
  location: 'Mumbai',
  status: 'Active',
  can_delete: canDelete,
  delete_blocked_reason: canDelete ? null : reason,
});

for (const [kind, Component, endpoint, nameField] of [
  ['center', MedicalCenters, 'medical-centers', 'center_name'],
  ['report', MedicalReports, 'medical-reports', 'name'],
]) {
  const reason = `Cannot delete this medical ${kind} because it is linked to cadet medical appointments or results.`;
  it(`${kind}: keeps linked records protected and unused records deletable`, async () => {
    let rows = [
      fixture(nameField, 'Linked record', false, reason),
      fixture(nameField, 'Unused record', true, reason),
    ];
    api.get.mockImplementation(async () => response(rows));
    api.delete.mockImplementation(async () => {
      rows = rows.filter((row) => row.id !== 'Unused record');
      return response(rows);
    });
    render(<Component />);
    const usedRow = (await screen.findByText('Linked record')).closest('tr');
    const blocked = within(usedRow).getByRole('button', {
      name: `Delete ${kind}`,
      exact: true,
    });
    expect(blocked).toBeDisabled();
    expect(blocked).toHaveAccessibleDescription(reason);
    expect(
      within(usedRow).getByRole('button', {
        name: `Why delete ${kind} is disabled`,
      }),
    ).toBeEnabled();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.click(blocked);
    expect(api.delete).not.toHaveBeenCalled();
    const unusedRow = screen.getByText('Unused record').closest('tr');
    expect(
      within(unusedRow).queryByRole('button', {
        name: `Why delete ${kind} is disabled`,
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(unusedRow).getByRole('button', {
        name: `Delete ${kind}`,
        exact: true,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete', exact: true }),
    );
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(`/${endpoint}/Unused record`),
    );
    await waitFor(() =>
      expect(screen.queryByText('Unused record')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Linked record')).toBeInTheDocument();
  });

  it(`${kind}: refreshes and explains a dependency added after the page loaded`, async () => {
    let linked = false;
    api.get.mockImplementation(async () =>
      response([fixture(nameField, 'Record', !linked, reason)]),
    );
    api.delete.mockImplementation(async () => {
      linked = true;
      throw Object.assign(new Error(reason), {
        response: { status: 409, data: { message: reason } },
      });
    });
    render(<Component />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Delete ${kind}`,
        exact: true,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete', exact: true }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(reason));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: `Delete ${kind}`, exact: true }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole('button', { name: `Delete ${kind}`, exact: true }),
    ).toHaveAccessibleDescription(reason);
    expect(toast.success).not.toHaveBeenCalled();
  });
}
