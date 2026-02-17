import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Loader2,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { toast } from 'sonner';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';

const InstituteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (location.state?.instituteData) {
      const data = location.state.instituteData;
      setValue('institute_name', data.institute_name);
      setValue('institute_email', data.institute_email);
      setValue('mobile_number', data.mobile_number);
      setValue('address', data.address);
      setValue('location', data.location);
    } else if (id) {
      const fetchInstitute = async () => {
        try {
          setFetching(true);
          const response = await api.get(`/institutes/${id}`);
          // Handle both wrapped { data: ... } and direct response formats
          const data = response.data.data || response.data;

          setValue('institute_name', data.institute_name);
          setValue('institute_email', data.institute_email);
          setValue('mobile_number', data.mobile_number);
          setValue('address', data.address);
          setValue('location', data.location);
        } catch (error) {
          console.error('Error fetching institute:', error);
          toast.error('Failed to fetch institute data');
          navigate('/institutes');
        } finally {
          setFetching(false);
        }
      };
      fetchInstitute();
    } else {
      reset();
    }
  }, [id, setValue, reset, navigate, location.state]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (id) {
        await api.put(`/institutes/${id}`, data);
        toast.success('Institute updated successfully');
      } else {
        await api.post('/institutes', data);
        toast.success('Institute created successfully');
      }
      navigate('/institutes');
    } catch (error) {
      console.error('Error saving institute:', error);
      toast.error(error.response?.data?.message || 'Failed to save institute');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/institutes');
  };

  if (fetching) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-blue-600' size={40} />
      </div>
    );
  }

  return (
    <div className='py-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ml-2'>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleCancel}
            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>
              {id ? 'Edit Institute' : 'Add New Institute'}
            </h1>
            <p className='text-gray-500 text-sm mt-1'>
              {id
                ? 'Update institute details and information'
                : 'Create a new institute record in the system'}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700 ml-1'>
                Institute Name <span className='text-red-500'>*</span>
              </label>
              <div className='relative group'>
                <Building2 className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
                <Input
                  {...register('institute_name', {
                    required: 'Name is required',
                  })}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  placeholder='Enter institute name'
                />
              </div>
              {errors.institute_name && (
                <span className='text-red-500 text-xs ml-1'>
                  {errors.institute_name.message}
                </span>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700 ml-1'>
                Email Address <span className='text-red-500'>*</span>
              </label>
              <div className='relative group'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
                <Input
                  type='email'
                  {...register('institute_email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  placeholder='contact@institute.com'
                />
              </div>
              {errors.institute_email && (
                <span className='text-red-500 text-xs ml-1'>
                  {errors.institute_email.message}
                </span>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700 ml-1'>
                Mobile Number <span className='text-red-500'>*</span>
              </label>
              <div className='relative group'>
                <Phone className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
                <Input
                  {...register('mobile_number', {
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'Must be exactly 10 digits',
                    },
                  })}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  placeholder='1234567890'
                  maxLength={10}
                />
              </div>
              {errors.mobile_number && (
                <span className='text-red-500 text-xs ml-1'>
                  {errors.mobile_number.message}
                </span>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700 ml-1'>
                Location/City <span className='text-red-500'>*</span>
              </label>
              <div className='relative group'>
                <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
                <Input
                  {...register('location', {
                    required: 'Location is required',
                  })}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  placeholder='e.g. Mumbai'
                />
              </div>
              {errors.location && (
                <span className='text-red-500 text-xs ml-1'>
                  {errors.location.message}
                </span>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700 ml-1'>
              Full Address <span className='text-red-500'>*</span>
            </label>
            <div className='relative group'>
              <MapPin className='absolute left-3 top-3 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
              <textarea
                {...register('address', { required: 'Address is required' })}
                rows={3}
                className='w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none resize-none'
                placeholder='Enter full address...'
              />
            </div>
            {errors.address && (
              <span className='text-red-500 text-xs ml-1'>
                {errors.address.message}
              </span>
            )}
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t'>
            <button
              type='button'
              onClick={handleCancel}
              className='px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors'
            >
              Cancel
            </button>
            <Button
              type='submit'
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white px-6 py-2.5 h-auto'
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className='animate-spin' size={18} />
                  Saving...
                </>
              ) : (
                'Save Institute'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstituteForm;
