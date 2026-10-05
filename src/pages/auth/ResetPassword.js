import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import {
  PASSWORD_LENGTH_MESSAGE,
  isValidPasswordLength,
} from '../../lib/utils/validationUtils';
import {
  errorTextClass,
  getInvalidFieldClass,
} from '../../lib/utils/formStyles';

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkStatus, setLinkStatus] = useState('checking');
  const [linkMessage, setLinkMessage] = useState('');
  const [validationAttempt, setValidationAttempt] = useState(0);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const existing = document.querySelector('meta[name="referrer"]');
    const meta = existing || document.createElement('meta');
    const previous = meta.getAttribute('content');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    if (!existing) document.head.appendChild(meta);
    return () => {
      if (!existing) meta.remove();
      else if (previous === null) meta.removeAttribute('content');
      else meta.content = previous;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      setLinkStatus('invalid');
      setLinkMessage('This reset link is invalid. Please request a new link using Forgot Password.');
      return;
    }
    setLinkStatus('checking');
    api.post('/auth/validate-reset-token', { token })
      .then(() => { if (active) setLinkStatus('valid'); })
      .catch((error) => {
        if (!active) return;
        const invalid = error.response?.data?.code === 'INVALID_RESET_TOKEN';
        setLinkStatus(invalid ? 'invalid' : 'error');
        setLinkMessage(
          invalid
            ? error.response.data.message
            : 'Unable to verify this reset link. Please try again.',
        );
      });
    return () => { active = false; };
  }, [token, validationAttempt]);

  const onSubmit = async (data) => {
    if (linkStatus !== 'valid' || !token) {
      toast.error('Please request a new reset link using Forgot Password.');
      return;
    }

    if (data.password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isValidPasswordLength(data.password)) {
      toast.error(PASSWORD_LENGTH_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
        confirm_password: data.confirm_password,
      });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to reset password';
      if (error.response?.data?.code === 'INVALID_RESET_TOKEN') {
        setLinkStatus('invalid');
        setLinkMessage(message);
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-blue-200 via-indigo-100 to-blue-200 items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Decorative Blobs */}
      <div className='absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse'></div>
      <div className='absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000'></div>

      <div className='flex w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-white/60 backdrop-blur-xl border border-white/40 h-[650px] z-10 transition-all duration-300'>
        {/* Left Side - Hero Section */}
        <div className='hidden lg:flex lg:w-1/2 relative justify-center items-center p-12 bg-blue-800/85 transition-colors duration-500'>
          <div className='absolute inset-0 overflow-hidden'>
            <div className='absolute -top-24 -left-24 w-64 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl'></div>
            <div className='absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-purple-500 opacity-20 blur-3xl'></div>
          </div>

          <div className='relative z-10 flex flex-col justify-center items-center text-center'>
            <div className='bg-white/20 backdrop-blur-sm p-6 rounded-3xl mb-8 shadow-inner border border-white/20'>
              <img
                src='/mol-logo.png'
                alt='MOLMI Logo'
                className='w-48 h-auto object-contain drop-shadow-lg'
              />
            </div>
            <p className='text-blue-100 mt-2 text-lg font-medium'>
              Securing your journey to success
            </p>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className='w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/40 backdrop-blur-md'>
          <div className='w-full max-w-md space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900'>
                Reset Password
              </h2>
              <p className='mt-2 text-gray-600'>
                {linkStatus === 'valid'
                  ? 'Enter your new password below. This link can be used only once.'
                  : linkStatus === 'checking'
                    ? 'Checking your reset link...'
                    : linkMessage}
              </p>
            </div>

            {linkStatus === 'checking' && (
              <div role='status' aria-label='Checking reset link' className='space-y-4 motion-safe:animate-pulse'>
                <div className='h-12 rounded-lg bg-slate-200' />
                <div className='h-12 rounded-lg bg-slate-200' />
              </div>
            )}
            {linkStatus === 'error' && (
              <button
                type='button'
                onClick={() => setValidationAttempt((attempt) => attempt + 1)}
                className='w-full rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700'
              >
                Try again
              </button>
            )}
            {linkStatus === 'invalid' && (
              <button
                type='button'
                onClick={() => navigate('/login?forgotPassword=1')}
                className='w-full rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700'
              >
                Request a new reset link
              </button>
            )}
            {linkStatus === 'valid' && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-6 mt-6'>
              <div className='space-y-4'>
                {/* New Password */}
                <div className='relative'>
                  <label className='text-sm font-semibold text-gray-700 block mb-1'>
                    New Password
                  </label>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: PASSWORD_LENGTH_MESSAGE,
                        },
                        maxLength: {
                          value: 16,
                          message: PASSWORD_LENGTH_MESSAGE,
                        },
                      })}
                      aria-invalid={errors.password ? true : undefined}
                      className={`w-full pl-10 pr-12 py-3 rounded-lg bg-white/70 border border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none shadow-sm ${getInvalidFieldClass(errors.password)}`}
                      placeholder='Enter new password'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className={`${errorTextClass} block`}>
                      {errors.password.message}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className='relative'>
                  <label className='text-sm font-semibold text-gray-700 block mb-1'>
                    Confirm Password
                  </label>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                      <Lock size={20} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      {...register('confirm_password', {
                        required: 'Please confirm your password',
                        validate: (val) => {
                          if (!isValidPasswordLength(val))
                            return PASSWORD_LENGTH_MESSAGE;
                          if (watch('password') !== val)
                            return 'Passwords do not match';
                        },
                      })}
                      aria-invalid={errors.confirm_password ? true : undefined}
                      className={`w-full pl-10 pr-12 py-3 rounded-lg bg-white/70 border border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none shadow-sm ${getInvalidFieldClass(errors.confirm_password)}`}
                      placeholder='Confirm new password'
                    />
                    <button
                      type='button'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <span className={`${errorTextClass} block`}>
                      {errors.confirm_password.message}
                    </span>
                  )}
                </div>
              </div>

              <button
                type='submit'
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-full transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span>{isSubmitting ? 'Resetting...' : 'Reset Password'}</span>
                {!isSubmitting && <ArrowRight size={20} />}
              </button>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
