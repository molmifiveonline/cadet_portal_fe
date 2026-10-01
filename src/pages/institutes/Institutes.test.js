import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import InstitutesManagement from './index';
import api from '../../lib/utils/apiConfig';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null }),
}), { virtual: true });

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
jest.mock('./SendEmailModal', () => () => null);
jest.mock('./ExtendTokenModal', () => () => null);

const reason =
  'Cannot delete this institute because it is linked to recruitment drives.';
const fixture = (id, canDelete) => ({
  id,
  institute_name: id === 'used' ? 'Used Institute' : 'Unused Institute',
  contact_emails: [],
  location: 'Mumbai',
  address: 'Test',
  can_delete: canDelete,
  delete_blocked_reason: canDelete ? null : reason,
});
const response = (rows) => ({
  data: { data: rows, total: rows.length, page: 1, limit: 10 },
});
const renderPage = () => render(<InstitutesManagement />);

beforeEach(() => {
  jest.clearAllMocks();
  Element.prototype.scrollIntoView = jest.fn();
});

async function openActions(name) {
  const trigger = await screen.findByRole('button', {
    name: `Actions for ${name}`,
  });
  fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
  return screen.findByRole('menuitem', { name: 'Delete', exact: true });
}

it('blocks deletion of linked institutes while allowing an unused institute to be deleted', async () => {
  let rows = [fixture('used', false), fixture('unused', true)];
  api.get.mockImplementation(async () => response(rows));
  api.delete.mockImplementation(async () => {
    rows = rows.filter((row) => row.id !== 'unused');
    return { data: { message: 'Institute deleted successfully' } };
  });
  renderPage();
  const blocked = await openActions('Used Institute');
  expect(blocked).toHaveAttribute('aria-disabled', 'true');
  expect(blocked).toHaveAccessibleDescription(reason);
  fireEvent.click(blocked);
  expect(api.delete).not.toHaveBeenCalled();
  expect(
    screen.queryByRole('heading', { name: 'Confirm Delete' }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  await waitFor(() =>
    expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
  );
  const allowed = await openActions('Unused Institute');
  expect(allowed).not.toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(allowed);
  fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  await waitFor(() =>
    expect(api.delete).toHaveBeenCalledWith('/institutes/unused'),
  );
  await waitFor(() =>
    expect(screen.queryByText('Unused Institute')).not.toBeInTheDocument(),
  );
  expect(screen.getByText('Used Institute')).toBeInTheDocument();
});

it('shows the server reason and refreshes dependencies when a stale deletion is rejected', async () => {
  let linked = false;
  api.get.mockImplementation(async () =>
    response([fixture('unused', !linked)]),
  );
  api.delete.mockImplementation(async () => {
    linked = true;
    throw Object.assign(new Error(reason), {
      response: { status: 409, data: { message: reason } },
    });
  });
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  try {
    renderPage();
    fireEvent.click(await openActions('Unused Institute'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete', exact: true }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(reason));
    expect(toast.success).not.toHaveBeenCalled();
    const blocked = await openActions('Unused Institute');
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    expect(blocked).toHaveAccessibleDescription(reason);
    expect(api.delete).toHaveBeenCalledTimes(1);
  } finally {
    consoleError.mockRestore();
  }
});
