import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import MedicalResultForm from './MedicalResultForm';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ cadet_id: 'cadet-1' }),
  useNavigate: () => jest.fn(),
  useLocation: () => ({}),
}), { virtual: true });
jest.mock('../../lib/utils/apiConfig', () => ({ get: jest.fn(), delete: jest.fn() }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../RecruitmentDrives/StageInviteModal', () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation(async (url) => ({ data: { success: true, data:
    url === '/cadets/cadet-1' ? { name_as_in_indos_cert: 'Cadet One' } :
    url === '/medical-results/cadet-1' ? { files: [
      { id: 'file-1', file_name: 'report.pdf' },
      { id: 'file-2', file_name: 'other.pdf' },
    ] } : [],
  } }));
});

it('confirms deletion and removes only the selected saved report', async () => {
  api.delete.mockResolvedValue({ data: { success: true } });
  render(<MedicalResultForm />);
  fireEvent.click(await screen.findByRole('button', { name: 'Delete report.pdf' }));
  expect(api.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close Delete Medical Report' }));
  expect(screen.getByText('report.pdf')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Delete report.pdf' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/medical-results/cadet-1/files/file-1'));
  await waitFor(() => expect(screen.queryByText('report.pdf')).not.toBeInTheDocument());
  expect(screen.getByText('other.pdf')).toBeInTheDocument();
});

it('keeps the report visible when deletion fails', async () => {
  api.delete.mockRejectedValue({ response: { data: { message: 'Unable to delete report' } } });
  render(<MedicalResultForm />);
  fireEvent.click(await screen.findByRole('button', { name: 'Delete report.pdf' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Unable to delete report'));
  expect(screen.getByText('report.pdf')).toBeInTheDocument();
  expect(toast.success).not.toHaveBeenCalled();
});

it('removes a newly selected file without calling the delete API', async () => {
  const { container } = render(<MedicalResultForm />);
  await screen.findByText('report.pdf');
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: { files: [new File(['report'], 'new.pdf', { type: 'application/pdf' })] },
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Delete new.pdf' }));
  expect(screen.queryByText('new.pdf')).not.toBeInTheDocument();
  expect(screen.getByText('report.pdf')).toBeInTheDocument();
  expect(api.delete).not.toHaveBeenCalled();
});
