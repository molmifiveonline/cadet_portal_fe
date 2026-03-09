import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Stethoscope,
  MapPin,
  Activity,
  User,
  Mail,
  ShieldAlert,
  Loader2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import api from '../../lib/utils/apiConfig';

const MedicalCenterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const [formData, setFormData] = useState({
    center_name: '',
    location: '',
    tests_offered: '',
    contact_person: '',
    email: '',
    status: 'Active',
  });

  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const response = await api.get(`/medical-centers/${id}`);
        if (response.data.success) {
          setFormData(response.data.data);
        }
      } catch (error) {
        toast.error('Failed to fetch medical center details');
        navigate('/medical-centers');
      } finally {
        setInitialLoading(false);
      }
    };

    if (isEditMode) {
      fetchCenter();
    }
  }, [id, navigate, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.center_name || !formData.location) {
      toast.error(
        'Please fill in the required fields (Center Name & Location)',
      );
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/medical-centers/${id}`, formData);
        toast.success('Medical Center updated successfully');
      } else {
        await api.post('/medical-centers', formData);
        toast.success('Medical Center added successfully');
      }
      navigate('/medical-centers');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to save medical center details',
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-blue-600' size={40} />
      </div>
    );
  }

  return (
    <div className='py-6 mx-auto'>
      <div className='flex items-center gap-4 mb-6 ml-2'>
        <button
          onClick={() => navigate('/medical-centers')}
          className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>
            {isEditMode ? 'Edit Medical Center' : 'Add New Medical Center'}
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            {isEditMode
              ? 'Update the clinic/hospital details below'
              : 'Enter the details of the new approved medical facility'}
          </p>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Center Name */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Center Name <span className='text-red-500 ml-1'>*</span>
              </label>
              <div className='relative'>
                <Stethoscope className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='center_name'
                  type='text'
                  placeholder='e.g., Balaji Medical Clinic'
                  value={formData.center_name}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Location <span className='text-red-500 ml-1'>*</span>
              </label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='location'
                  type='text'
                  placeholder='e.g., Andheri, Mumbai'
                  value={formData.location}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  required
                />
              </div>
            </div>

            {/* Tests Offered */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Tests Offered
              </label>
              <div className='relative'>
                <Activity className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='tests_offered'
                  type='text'
                  placeholder='e.g., Blood, X-Ray, General Physical'
                  value={formData.tests_offered}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>

            {/* Contact Person */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Contact Person
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='contact_person'
                  type='text'
                  placeholder='e.g., Dr. Sharma'
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>

            {/* Email */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Email Address
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='email'
                  type='email'
                  placeholder='clinic@example.com'
                  value={formData.email}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>

            {/* Status */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Status
              </label>
              <div className='relative'>
                <ShieldAlert className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10' />
                <Select
                  onValueChange={(val) => handleSelectChange('status', val)}
                  value={formData.status}
                >
                  <SelectTrigger className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Active'>Active</SelectItem>
                    <SelectItem value='Inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className='pt-6 flex justify-end gap-3 border-t border-gray-200 mt-8'>
            <Button
              variant='outline'
              type='button'
              onClick={() => navigate('/medical-centers')}
            >
              Cancel
            </Button>
            <Button
              variant='default'
              type='submit'
              disabled={loading}
              className='flex items-center gap-2'
            >
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Save Center'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalCenterForm;
