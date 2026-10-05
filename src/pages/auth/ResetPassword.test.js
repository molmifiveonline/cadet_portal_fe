import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResetPassword from './ResetPassword';
import Login from './Login';
import api from '../../lib/utils/apiConfig';

jest.mock('../../lib/utils/apiConfig', () => ({ post: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login: jest.fn() }) }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockResetSearch)],
}), { virtual: true });

const token = 'a'.repeat(64);
const mockNavigate = jest.fn();
let mockResetSearch = '';
const invalidMessage = 'This reset link is invalid, expired, or already used. Please request a new link using Forgot Password.';
const invalid = { response: { status: 400, data: { code: 'INVALID_RESET_TOKEN', message: invalidMessage } } };
const showPage = (url = `/reset-password?token=${token}`) => {
  mockResetSearch = url.split('?')[1] || '';
  return render(<ResetPassword />);
};

beforeEach(() => { jest.clearAllMocks(); });

it('blocks the old ID-only email and opens Forgot Password to request a new link', async () => {
  showPage('/reset-password?id=56e99b64-d227-435b-86c4-a17e222c72d1');
  expect(screen.queryByPlaceholderText('Enter new password')).not.toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Request a new reset link' }));
  expect(mockNavigate).toHaveBeenCalledWith('/login?forgotPassword=1');
  mockResetSearch = 'forgotPassword=1';
  render(<Login />);
  expect(await screen.findByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();
});

it('requires successful validation before showing the password form', async () => {
  let resolveValidation;
  api.post.mockImplementation(() => new Promise((resolve) => { resolveValidation = resolve; }));
  showPage();
  expect(screen.getByRole('status', { name: 'Checking reset link' })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Enter new password')).not.toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/auth/validate-reset-token', { token });
  resolveValidation({ data: {} });
  expect(await screen.findByPlaceholderText('Enter new password')).toBeInTheDocument();
  expect(document.querySelector('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
});

it('shows recovery instructions for expired or used links without exposing a reset form', async () => {
  api.post.mockRejectedValue(invalid);
  showPage();
  expect(await screen.findByText(invalidMessage)).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Enter new password')).not.toBeInTheDocument();
});

it('allows retry after a temporary validation failure', async () => {
  api.post.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ data: {} });
  showPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByPlaceholderText('Enter new password')).toBeInTheDocument();
});

it('submits the token instead of the ID and returns to login on success', async () => {
  api.post.mockResolvedValue({ data: {} });
  showPage();
  fireEvent.change(await screen.findByPlaceholderText('Enter new password'), { target: { value: 'Changed123' } });
  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'Changed123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
    token, password: 'Changed123', confirm_password: 'Changed123',
  }));
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});

it('removes the form if a link expires or is used while the user is filling it in', async () => {
  api.post.mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce(invalid);
  showPage();
  fireEvent.change(await screen.findByPlaceholderText('Enter new password'), { target: { value: 'Changed123' } });
  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'Changed123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
  expect(await screen.findByText(invalidMessage)).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Enter new password')).not.toBeInTheDocument();
});
