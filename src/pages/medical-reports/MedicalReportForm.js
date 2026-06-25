import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
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
import PageHeader from '../../components/common/PageHeader';
import { errorTextClass } from '../../lib/utils/formStyles';

const MedicalReportForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active',
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(`/medical-reports/${id}`);
        if (response.data.success) {
          setFormData(response.data.data);
        }
      } catch (error) {
        toast.error('Failed to fetch medical report details');
        navigate('/medical-reports');
      } finally {
        setInitialLoading(false);
      }
    };

    if (isEditMode) {
      fetchReport();
    }
  }, [id, navigate, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Report name is required';
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/medical-reports/${id}`, formData);
        toast.success('Medical Report updated successfully');
      } else {
        await api.post('/medical-reports', formData);
        toast.success('Medical Report added successfully');
      }
      navigate('/medical-reports');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to save medical report details',
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
    <div className='py-6 mx-auto max-w-3xl'>
      <PageHeader
        title={isEditMode ? 'Edit Medical Report' : 'Add New Medical Report'}
        subtitle={isEditMode ? 'Update the report configuration below' : 'Enter the details of the new medical report'}
        icon={ClipboardList}
        backButton={
          <button
            onClick={() => navigate('/medical-reports')}
            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
        }
      />

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
        <form onSubmit={handleSubmit} noValidate className='space-y-6'>
          <div className='grid grid-cols-1 gap-6'>
            {/* Report Name */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Report Name <span className='text-red-500 ml-1'>*</span>
              </label>
              <div className='relative'>
                <ClipboardList className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='name'
                  type='text'
                  placeholder='e.g., Blood Test'
                  value={formData.name}
                  onChange={handleInputChange}
                  invalid={!!formErrors.name}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
              {formErrors.name && (
                <p className={errorTextClass}>
                  {formErrors.name}
                </p>
              )}
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
              onClick={() => navigate('/medical-reports')}
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
              <span>{loading ? 'Saving...' : 'Save Report'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalReportForm;
