import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AssessmentTypes from './index';
import { usePermission } from '../../hooks/usePermission';
import api from '../../lib/utils/apiConfig';

jest.mock('../../hooks/usePermission', () => ({ usePermission: jest.fn() }));
jest.mock('../../lib/utils/apiConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({
    data: {
      success: true,
      data: [
        {
          id: 'assessment',
          name: 'Navigation',
          status: 'Active',
          default_max_score: 100,
        },
      ],
    },
  });
  api.post.mockResolvedValue({ data: { success: true } });
});

it.each([
  [false, false],
  [true, false],
  [false, true],
  [true, true],
])(
  'assessment creation (%s) and management (%s) have separate permissions',
  async (canCreate, canManage) => {
    usePermission.mockImplementation((module, action) => ({
      hasPermission: action === 'create' ? canCreate : canManage,
    }));
    render(<AssessmentTypes />);
    await screen.findByText('Navigation');
    expect(usePermission).toHaveBeenCalledWith('allocation-masters', 'manage');
    expect(usePermission).toHaveBeenCalledWith('allocation-masters', 'create');
    expect(
      Boolean(
        screen.queryByRole('button', {
          name: 'Add Assessment Type',
          exact: true,
        }),
      ),
    ).toBe(canCreate);
    for (const name of ['Edit', 'Deactivate', 'Delete']) {
      expect(Boolean(screen.queryByRole('button', { name, exact: true }))).toBe(
        canManage,
      );
    }
  },
);

it('allows a role with Add Assessment only to create an assessment', async () => {
  usePermission.mockImplementation((module, action) => ({
    hasPermission: action === 'create',
  }));
  render(<AssessmentTypes />);
  await screen.findByText('Navigation');
  fireEvent.click(
    screen.getByRole('button', { name: 'Add Assessment Type', exact: true }),
  );
  fireEvent.change(
    screen.getByPlaceholderText('Example: Communication Skills'),
    { target: { value: 'Communication Skills' } },
  );
  fireEvent.click(
    screen
      .getAllByRole('button', { name: 'Add Assessment Type', exact: true })
      .at(-1),
  );
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith('/allocations/masters/courses', {
      name: 'Communication Skills',
      status: 'Active',
    }),
  );
  expect(api.put).not.toHaveBeenCalled();
});
