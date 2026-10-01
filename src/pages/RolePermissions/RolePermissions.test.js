import React from 'react';
import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import RolePermissions from './index';
import api from '../../lib/utils/apiConfig';
import { toast } from 'sonner';

jest.mock('../../lib/utils/apiConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'SuperAdmin' } }),
}));
jest.mock('../../context/PermissionContext', () => ({
  usePermissionContext: () => ({
    hasPermission: () => true,
    loading: false,
    refreshPermissions: jest.fn(),
  }),
}));
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const roles = [
  { id: 'a', name: 'Recruiter', display_name: 'Recruiter' },
  { id: 'b', name: 'Viewer', display_name: 'Viewer' },
  {
    id: 'system',
    name: 'SuperAdmin',
    display_name: 'SuperAdmin',
    is_system_role: true,
  },
];
const permissions = [
  {
    module: 'cadets',
    permissions: [
      {
        id: 'cadet-view',
        action: 'view',
        display_name: 'View Cadets',
        granted: true,
      },
    ],
  },
  {
    module: 'medical-centers',
    permissions: [
      {
        id: 'center-edit',
        action: 'edit',
        display_name: 'Edit Medical Centers',
        granted: false,
      },
    ],
  },
  {
    module: 'allocations',
    permissions: [
      {
        id: 'contact',
        action: 'communicate',
        display_name: 'Record Candidate Communication',
        granted: false,
      },
    ],
  },
  {
    module: 'tests',
    permissions: [
      {
        id: 'legacy',
        action: 'edit',
        display_name: 'Legacy Test Action',
        granted: true,
      },
    ],
  },
];
const response = (data) => ({ data: { success: true, data } });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation(async (url) =>
    response(url === '/role-permissions/roles' ? roles : permissions),
  );
  api.put.mockResolvedValue(response(null));
});

async function selectRole(name = 'Recruiter') {
  fireEvent.click(await screen.findByRole('button', { name, exact: true }));
  await screen.findByRole('button', { name: 'View Cadets' });
}

it('shows active actions and saves only changed permissions, preserving hidden grants', async () => {
  render(<RolePermissions />);
  await selectRole();
  expect(
    screen.queryByRole('button', { name: 'SuperAdmin', exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Legacy Test Action' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Record Candidate Communication' }),
  );
  expect(
    screen.getByRole('button', { name: 'Viewer', exact: true }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith(
      '/role-permissions/roles/a/permissions',
      { permissions: [{ permissionId: 'contact', granted: true }] },
    ),
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled(),
  );
});

it('ignores an older response after a different role is selected', async () => {
  const old = deferred();
  api.get.mockImplementation((url) =>
    url.includes('/a/permissions')
      ? old.promise
      : Promise.resolve(
          response(url === '/role-permissions/roles' ? roles : permissions),
        ),
  );
  render(<RolePermissions />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Recruiter', exact: true }),
  );
  await selectRole('Viewer');
  await act(async () =>
    old.resolve(
      response([
        {
          module: 'cadets',
          permissions: [
            {
              id: 'other',
              display_name: 'Wrong Role Permission',
              action: 'view',
              granted: true,
            },
          ],
        },
      ]),
    ),
  );
  expect(
    screen.queryByRole('button', { name: 'Wrong Role Permission' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Medical Centers' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith(
      '/role-permissions/roles/b/permissions',
      { permissions: [{ permissionId: 'center-edit', granted: true }] },
    ),
  );
});

it('blocks saving after a failed load and allows retrying that role', async () => {
  api.get.mockImplementation((url) =>
    url.includes('/a/permissions')
      ? Promise.reject(new Error('offline'))
      : Promise.resolve(response(roles)),
  );
  render(<RolePermissions />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Recruiter', exact: true }),
  );
  await screen.findByText('Failed to load permissions. Please try again.');
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  api.get.mockResolvedValue(response(permissions));
  fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
  await screen.findByRole('button', { name: 'View Cadets' });
  expect(api.put).not.toHaveBeenCalled();
});

it('keeps failed saves pending and supports discarding them', async () => {
  api.put.mockRejectedValue(new Error('offline'));
  render(<RolePermissions />);
  await selectRole();
  fireEvent.click(screen.getByRole('button', { name: 'View Cadets' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Discard Changes' }),
    ).toBeEnabled(),
  );
  expect(
    screen.getByRole('button', { name: 'View Cadets', pressed: false }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Discard Changes' }));
  expect(
    screen.getByRole('button', { name: 'View Cadets', pressed: true }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Viewer', exact: true }),
  ).toBeEnabled();
});

it('locks editing and role switching during a save', async () => {
  const save = deferred();
  api.put.mockReturnValue(save.promise);
  render(<RolePermissions />);
  await selectRole();
  fireEvent.click(screen.getByRole('button', { name: 'View Cadets' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(
    screen.getByRole('button', { name: 'Edit Medical Centers' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Viewer', exact: true }),
  ).toBeDisabled();
  await act(async () => save.resolve(response(null)));
  expect(
    screen.getByRole('button', { name: 'Viewer', exact: true }),
  ).toBeEnabled();
});

it('disables deletion of assigned roles while keeping unused roles deletable', async () => {
  let availableRoles = roles.map((role) => ({
    ...role,
    assigned_user_count: role.id === 'a' ? 2 : 0,
  }));
  api.get.mockImplementation(async (url) =>
    response(url === '/role-permissions/roles' ? availableRoles : permissions),
  );
  api.delete.mockImplementation(async () => {
    availableRoles = availableRoles.filter((role) => role.id !== 'b');
    return response(null);
  });
  render(<RolePermissions />);
  const usedRole = await screen.findByRole('button', {
    name: 'Delete Recruiter',
  });
  expect(usedRole).toBeDisabled();
  expect(usedRole).toHaveAccessibleDescription(
    'Used by 2 users. Reassign users before deleting.',
  );
  expect(screen.getByRole('button', { name: 'Edit Recruiter' })).toBeEnabled();
  fireEvent.click(usedRole);
  expect(
    screen.queryByRole('heading', { name: 'Delete Role' }),
  ).not.toBeInTheDocument();
  expect(api.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete Viewer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  await waitFor(() =>
    expect(api.delete).toHaveBeenCalledWith('/role-permissions/roles/b'),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Viewer', exact: true }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole('button', { name: 'Delete Recruiter' }),
  ).toBeDisabled();
});

it('refreshes role usage when a user was assigned after the role list loaded', async () => {
  let assigned = false;
  api.get.mockImplementation(async (url) =>
    response(
      url === '/role-permissions/roles'
        ? roles.map((role) => ({
            ...role,
            assigned_user_count: assigned && role.id === 'a' ? 1 : 0,
          }))
        : permissions,
    ),
  );
  const message = 'Assign users to another role before deleting this role';
  api.delete.mockImplementation(async () => {
    assigned = true;
    throw Object.assign(new Error(message), {
      response: { status: 409, data: { message } },
    });
  });
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  try {
    render(<RolePermissions />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Recruiter' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete', exact: true }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete Recruiter' }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole('button', { name: 'Delete Recruiter' }),
    ).toHaveAccessibleDescription(
      'Used by 1 user. Reassign users before deleting.',
    );
    expect(
      screen.queryByRole('heading', { name: 'Delete Role' }),
    ).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});
