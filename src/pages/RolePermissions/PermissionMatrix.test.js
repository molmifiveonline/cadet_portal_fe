import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import PermissionMatrix from './PermissionMatrix';

it('sorts sections and cards by their visible labels and keeps Add Assessment independently selectable', () => {
  const group = (module, actions) => ({
    module,
    permissions: actions.map(([action, display_name]) =>
      Object.freeze({
        id: `${module}:${action}`,
        action,
        display_name,
        granted: false,
        description: 'Description stays hidden',
      }),
    ),
  });
  const permissions = [
    group('allocations', [['view', 'View Vessel Allocations']]),
    group('users', [['view', 'View System Users']]),
    group('allocation-masters', [
      ['view', 'View Assessment Masters'],
      ['manage', 'Edit and Delete Assessments'],
      ['create', 'Add Assessment'],
    ]),
    group('activity-logs', [['view', 'View Activity Logs']]),
  ];
  permissions.forEach((item) => {
    Object.freeze(item.permissions);
    Object.freeze(item);
  });
  Object.freeze(permissions);
  const toggle = jest.fn();
  render(
    <PermissionMatrix
      permissions={permissions}
      roleName="Recruiter"
      onPermissionToggle={toggle}
    />,
  );
  expect(
    screen
      .getAllByRole('heading', { level: 3 })
      .map((item) => item.textContent),
  ).toEqual([
    'Activity Logs',
    'Assessment Masters',
    'System Users',
    'Vessel Allocations',
  ]);
  expect(
    screen.getAllByRole('button').map((item) => item.textContent.trim()),
  ).toEqual([
    'View Activity Logs',
    'Add Assessment',
    'Edit and Delete Assessments',
    'View Assessment Masters',
    'View System Users',
    'View Vessel Allocations',
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Add Assessment' }));
  expect(toggle).toHaveBeenCalledWith('allocation-masters:create', false);
  expect(
    screen.queryByText('Description stays hidden'),
  ).not.toBeInTheDocument();
});
