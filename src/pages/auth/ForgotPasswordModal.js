import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/forgot-password',
        { email: data.email },
      );
      toast.success(response.data.message || 'Reset link sent to your email!');

      // In dev mode, show OTP for convenience
      if (response.data.dev_otp) {
        toast.info(`Dev Mode OTP: ${response.data.dev_otp}`);
        console.log('Dev OTP:', response.data.dev_otp);
      }

      reset();
      onClose();
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Forgot Password Error:', error);
      const message =
        error.response?.data?.message || 'Failed to send reset link';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/60 backdrop-blur-md transition-all animate-in fade-in duration-200'>
      {/* Modal Content */}
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-100 to-indigo-50 p-6 flex justify-between items-center relative overflow-hidden'>
          <div className='relative z-10'>
            <h3 className='text-xl font-bold text-blue-900'>Forgot Password</h3>
            <p className='text-sm text-blue-700/80 mt-1'>
              Enter your email to reset password
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-full bg-white/50 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors z-10'
          >
            <X size={20} />
          </button>

          {/* Decorative Elements */}
          <div className='absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-300 rounded-full blur-2xl opacity-40'></div>
        </div>

        {/* Body */}
        <div className='p-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='space-y-2'>
              <label className='text-sm font-semibold text-gray-700 block'>
                Email Address
              </label>
              <div className='relative'>
                <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                  <Mail size={20} />
                </div>
                <input
                  type='email'
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className='w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm'
                  placeholder='name@company.com'
                />
              </div>
              {errors.email && (
                <span className='text-red-500 text-xs ml-1'>
                  {errors.email.message}
                </span>
              )}
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-full transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
              {!isSubmitting && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
