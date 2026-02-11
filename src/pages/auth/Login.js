import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/utils/apiConfig';
import ForgotPasswordModal from './ForgotPasswordModal';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Use AuthContext login
      login(response.data.user, response.data.token);

      toast.success('Login successful! Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Decorative Blobs */}
      <div className='absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse'></div>
      <div
        className='absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse'
        style={{ animationDelay: '1s' }}
      ></div>
      <div
        className='absolute -bottom-32 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse'
        style={{ animationDelay: '2s' }}
      ></div>

      <div className='flex w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-white/70 backdrop-blur-xl border border-white/50 h-[650px] z-10 transition-all duration-300 hover:shadow-3xl'>
        {/* Left Side - Branding */}
        <div className='hidden lg:flex lg:w-1/2 relative justify-center items-center p-12 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700'>
          <div className='absolute inset-0 overflow-hidden'>
            <div className='absolute -top-24 -left-24 w-64 h-64 rounded-full bg-blue-400 opacity-20 blur-3xl'></div>
            <div className='absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-purple-400 opacity-20 blur-3xl'></div>
          </div>

          <div className='relative z-10 flex flex-col justify-center items-center text-center'>
            <div className='bg-white/20 backdrop-blur-sm p-4 rounded-3xl mb-6 shadow-inner border border-white/30'>
              <img src='mol-logo.png' alt='mol.logo' width={100} height={100} />
            </div>
            <p className='text-white/90 mt-6 text-lg font-medium px-4'>
              Admin Portal
            </p>
            <p className='text-blue-100 mt-2 text-sm'>
              Secure access to your dashboard
            </p>
          </div>
        </div>

        {/* Right Side - Form Container */}
        <div className='w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/60 backdrop-blur-md'>
          <div className='w-full max-w-md space-y-8'>
            <div className='text-center'>
              <h2 className='text-3xl font-bold text-gray-900 mb-2'>
                Admin Sign In
              </h2>
              <p className='text-gray-600'>
                Enter your credentials to access the portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label className='text-sm font-semibold text-gray-700 block mb-2'>
                  Email Address
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                    <Mail size={20} />
                  </div>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className='w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 border border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none shadow-sm'
                    placeholder='admin@example.com'
                  />
                </div>
              </div>

              <div>
                <div className='flex justify-between items-center mb-2'>
                  <label className='text-sm font-semibold text-gray-700 block'>
                    Password
                  </label>
                  <button
                    type='button'
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className='text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors'
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className='w-full pl-10 pr-12 py-3 rounded-xl bg-white/80 border border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none shadow-sm'
                    placeholder='Enter your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </form>

            {/* Footer Text */}
            <p className='text-center text-sm text-gray-600 mt-6'>
              Protected by secure authentication
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default Login;
