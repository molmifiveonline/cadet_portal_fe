import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, ArrowRight, Building2, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/utils/apiConfig';
import { getPrefixRoute } from '../../lib/utils/routeUtils';
import { getEmailValidationMessage } from '../../lib/utils/validationUtils';
import {
  errorTextClass,
  getInvalidFieldClass,
} from '../../lib/utils/formStyles';

const InstituteLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    const emailMessage = getEmailValidationMessage(email);
    if (emailMessage) {
      setEmailError(emailMessage);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/institute/request-otp', {
        email: email.trim().toLowerCase(),
      });
      setOtpSent(true);
      setCountdown(60);
      toast.success(response.data.message || 'OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please check your email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otp.trim() || otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/institute/verify-otp', {
        email: email.trim().toLowerCase(),
        otp,
      });

      login(response.data.user, response.data.token);
      toast.success('Login successful! Welcome.');

      const user = response.data.user;
      let redirectUrl = searchParams.get('redirect') || '/';
      const prefixRoute = getPrefixRoute(user);
      if (prefixRoute) redirectUrl = prefixRoute;

      navigate(redirectUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setOtp('');
    await handleRequestOtp({ preventDefault: () => {} });
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Decorative Blobs */}
      <div className='absolute top-0 left-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse'></div>
      <div
        className='absolute top-0 right-0 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse'
        style={{ animationDelay: '1s' }}
      ></div>
      <div
        className='absolute -bottom-32 left-20 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse'
        style={{ animationDelay: '2s' }}
      ></div>

      <div className='flex w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-white/70 backdrop-blur-xl border border-white/50 min-h-[620px] z-10 transition-all duration-300'>
        {/* Left Side - Branding */}
        <div className='hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center p-12 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700'>
          <div className='absolute inset-0 overflow-hidden'>
            <div className='absolute -top-24 -left-24 w-64 h-64 rounded-full bg-emerald-400 opacity-20 blur-3xl'></div>
            <div className='absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-cyan-400 opacity-20 blur-3xl'></div>
          </div>

          <div className='relative z-10 flex flex-col justify-center items-center text-center'>
            <div className='bg-white/20 backdrop-blur-sm p-4 rounded-3xl mb-6 shadow-inner border border-white/30'>
              <img src='/mol-logo.png' alt='mol.logo' width={150} height={150} />
            </div>
            <p className='text-white/90 mt-6 text-lg font-medium px-4'>
              MOLMI Institute Portal
            </p>
            <p className='text-emerald-100 mt-2 text-sm'>
              Secure OTP-based access for institutes
            </p>

            {/* Step Indicators */}
            <div className='mt-10 space-y-4 w-full max-w-xs'>
              <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${!otpSent ? 'bg-white/25 border border-white/40' : 'bg-white/10 opacity-60'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${!otpSent ? 'bg-white text-emerald-700' : 'bg-white/30 text-white'}`}>1</div>
                <div className='text-left'>
                  <p className='text-white font-semibold text-sm'>Enter Email Address</p>
                  <p className='text-emerald-100 text-xs'>Your registered institute email</p>
                </div>
              </div>
              <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${otpSent ? 'bg-white/25 border border-white/40' : 'bg-white/10 opacity-60'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${otpSent ? 'bg-white text-emerald-700' : 'bg-white/30 text-white'}`}>2</div>
                <div className='text-left'>
                  <p className='text-white font-semibold text-sm'>Enter OTP</p>
                  <p className='text-emerald-100 text-xs'>Sent to your email</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Container */}
        <div className='w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/60 backdrop-blur-md'>
          <div className='w-full max-w-md space-y-8'>
            {/* Header */}
            <div className='text-center'>
              <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg'>
                <Building2 size={28} className='text-white' />
              </div>
              <h2 className='text-3xl font-bold text-gray-900 mb-2'>Institute Login</h2>
              <p className='text-gray-500 text-sm'>
                {otpSent
                  ? `OTP sent to ${email}. Enter it below.`
                  : 'Enter your registered email to receive an OTP'}
              </p>
            </div>

            {/* Step 1: Email */}
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} noValidate className='space-y-6'>
                <div>
                  <label className='text-sm font-semibold text-gray-700 block mb-2'>
                    Email Address
                  </label>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                      <Mail size={20} />
                    </div>
                    <input
                      type='text'
                      inputMode='email'
                      value={email}
                      onChange={(e) => {
                        setEmailError('');
                        setEmail(e.target.value);
                      }}
                      autoFocus
                      aria-invalid={emailError ? true : undefined}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 border border-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all outline-none shadow-sm ${getInvalidFieldClass(emailError)}`}
                      placeholder='you@institute.com'
                    />
                  </div>
                  {emailError && (
                    <p className={`${errorTextClass} mt-1.5`}>{emailError}</p>
                  )}
                  <p className='mt-1.5 text-xs text-gray-400'>
                    Use your registered institute email address
                  </p>
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <span>{isLoading ? 'Sending OTP...' : 'Send OTP to Email'}</span>
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              </form>
            ) : (
              /* Step 2: OTP Entry */
              <form onSubmit={handleVerifyOtp} noValidate className='space-y-6'>
                {/* Show entered email with change option */}
                <div className='bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Mail size={16} className='text-emerald-600' />
                    <span className='text-sm font-semibold text-emerald-800'>{email}</span>
                  </div>
                  <button
                    type='button'
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className='text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors'
                  >
                    Change
                  </button>
                </div>

                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <label className='text-sm font-semibold text-gray-700 block'>
                      One-Time Password (OTP)
                    </label>
                    <button
                      type='button'
                      disabled={countdown > 0 || isLoading}
                      onClick={handleResendOtp}
                      className={`text-xs font-semibold flex items-center space-x-1 transition-colors ${
                        countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-800'
                      }`}
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                      <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}</span>
                    </button>
                  </div>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                      <KeyRound size={20} />
                    </div>
                    <input
                      type='text'
                      value={otp}
                      onChange={(e) => {
                        setOtpError('');
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      }}
                      autoFocus
                      maxLength={6}
                      aria-invalid={otpError ? true : undefined}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 border border-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all outline-none shadow-sm text-center text-2xl font-bold tracking-[0.6em] ${getInvalidFieldClass(otpError)}`}
                      placeholder='······'
                    />
                  </div>
                  {otpError && (
                    <p className={`${errorTextClass} mt-1.5 text-center`}>
                      {otpError}
                    </p>
                  )}
                  <p className='mt-2 text-xs text-gray-400 text-center'>
                    OTP expires in 10 minutes. Check your registered contact email.
                  </p>
                </div>

                <button
                  type='submit'
                  disabled={isLoading || otp.length !== 6}
                  className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 ${
                    isLoading || otp.length !== 6 ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <span>{isLoading ? 'Verifying...' : 'Verify & Sign In'}</span>
                  {!isLoading && <ShieldCheck size={20} />}
                </button>
              </form>
            )}

            <p className='text-center text-sm text-gray-500 mt-4'>
              Are you an Admin?{' '}
              <a
                href='/login'
                className='font-semibold text-emerald-600 hover:text-emerald-800 transition-colors'
              >
                Admin Login →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteLogin;
