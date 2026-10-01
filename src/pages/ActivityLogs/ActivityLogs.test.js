import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ActivityLogs from './ActivityLogs';
import ActivityWidget from '../../components/dashboard/ActivityWidget';
import api from '../../lib/utils/apiConfig';

jest.mock('../../lib/utils/apiConfig', () => ({ get: jest.fn() }));

const row = {
  id: 'log-1',
  action: 'UPDATE_CTV_VESSEL_ALLOCATION',
  details: 'Updated secondary vessel',
  display_name: 'Test Admin',
  created_at: '2026-09-30T20:00:00.000Z',
};

it('displays the activity date and time in IST with the original instant in the time element', async () => {
  api.get.mockResolvedValue({
    data: {
      data: [row],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
  });
  render(<ActivityLogs />);
  expect(await screen.findByText('Timestamp (IST)')).toBeInTheDocument();
  expect(screen.getByText('01-10-2026')).toBeInTheDocument();
  expect(screen.getByText('01:30:00 AM IST').closest('time')).toHaveAttribute(
    'datetime',
    row.created_at,
  );
  expect(api.get).toHaveBeenCalledWith(
    '/activity-logs/recent',
    expect.objectContaining({
      params: expect.objectContaining({
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }),
    }),
  );
});

it('uses the same India timestamp in dashboard recent activity', () => {
  render(<ActivityWidget rows={[row]} />);
  expect(screen.getByText('01-10-2026 01:30:00 AM IST')).toHaveAttribute(
    'datetime',
    row.created_at,
  );
});
