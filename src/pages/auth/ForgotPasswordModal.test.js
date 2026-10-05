import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ForgotPasswordModal from './ForgotPasswordModal';
import api from '../../lib/utils/apiConfig';
import { toast } from 'sonner';

jest.mock('../../lib/utils/apiConfig', () => ({ post: jest.fn() }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

const mockNavigate = jest.fn();
const limitMessage = 'Your maximum limit has been reached. Please try again after some time.';
const limited = { response: { status: 429, data: { code: 'PASSWORD_RESET_LIMIT_REACHED', message: limitMessage } } };

beforeEach(() => { jest.clearAllMocks(); });

it('keeps the maximum-limit message visible and the modal open without reporting success', async () => {
  const onClose = jest.fn();
  api.post.mockRejectedValue(limited);
  render(<ForgotPasswordModal isOpen onClose={onClose} />);
  fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'one@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(limitMessage);
  expect(toast.error).toHaveBeenCalledWith(limitMessage);
  expect(toast.success).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
});

it('clears the limit message when the email changes and allows a later successful request', async () => {
  const onClose = jest.fn();
  api.post.mockRejectedValueOnce(limited).mockResolvedValueOnce({ data: { message: 'Reset link sent.' } });
  render(<ForgotPasswordModal isOpen onClose={onClose} />);
  const input = screen.getByPlaceholderText('name@company.com');
  fireEvent.change(input, { target: { value: 'one@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
  await screen.findByRole('alert');
  fireEvent.change(input, { target: { value: 'two@example.test' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(api.post).toHaveBeenLastCalledWith('/auth/forgot-password', { email: 'two@example.test' });
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});
