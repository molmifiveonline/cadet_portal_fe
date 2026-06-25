import React, { useState, useEffect, useRef } from 'react';
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
import PageHeader from '../../components/common/PageHeader';
import { getEmailValidationMessage } from '../../lib/utils/validationUtils';
import { errorTextClass } from '../../lib/utils/formStyles';

const MedicalCenterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [formErrors, setFormErrors] = useState({});

  const [reports, setReports] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    center_name: '',
    location: '',
    medical_reports: [],
    contact_person: '',
    email: '',
    status: 'Active',
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get('/medical-reports');
        if (response.data.success) {
          setReports(response.data.data.filter(r => r.status === 'Active'));
        }
      } catch (error) {
        console.error('Failed to fetch medical reports', error);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const response = await api.get(`/medical-centers/${id}`);
        if (response.data.success) {
          const data = response.data.data;
          let selectedReports = [];
          if (data.medical_reports) {
            selectedReports = typeof data.medical_reports === 'string'
              ? JSON.parse(data.medical_reports)
              : data.medical_reports;
          }
          setFormData({
            ...data,
            medical_reports: selectedReports,
          });
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

  const toggleReportSelection = (reportId) => {
    setFormData((prev) => {
      const current = prev.medical_reports || [];
      const updated = current.includes(reportId)
        ? current.filter((id) => id !== reportId)
        : [...current, reportId];
      return { ...prev, medical_reports: updated };
    });
  };

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
    if (!formData.center_name.trim()) {
      nextErrors.center_name = 'Center name is required';
    }
    if (!formData.location.trim()) {
      nextErrors.location = 'Location is required';
    }
    const emailMessage = getEmailValidationMessage(formData.email);
    if (emailMessage) {
      nextErrors.email = emailMessage;
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
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
      <PageHeader
        title={isEditMode ? 'Edit Medical Center' : 'Add New Medical Center'}
        subtitle={isEditMode ? 'Update the clinic/hospital details below' : 'Enter the details of the new approved medical facility'}
        icon={Stethoscope}
        backButton={
          <button
            onClick={() => navigate('/medical-centers')}
            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
        }
      />

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
        <form onSubmit={handleSubmit} noValidate className='space-y-6'>
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
                  invalid={!!formErrors.center_name}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
              {formErrors.center_name && (
                <p className={errorTextClass}>
                  {formErrors.center_name}
                </p>
              )}
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
                  invalid={!!formErrors.location}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
              {formErrors.location && (
                <p className={errorTextClass}>
                  {formErrors.location}
                </p>
              )}
            </div>

            {/* Medical Reports Offered (Dropdown Multiselect) */}
            <div className='space-y-2' ref={dropdownRef}>
              <label className='text-sm font-medium text-gray-700'>
                Medical Reports Offered
              </label>
              <div className='relative'>
                <Activity className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10' />
                <button
                  type='button'
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none text-left flex justify-between items-center text-sm text-gray-700 min-h-[44px]'
                >
                  <span className='truncate mr-4'>
                    {formData.medical_reports?.length > 0
                      ? reports
                          .filter((r) => formData.medical_reports.includes(r.id))
                          .map((r) => r.name)
                          .join(', ')
                      : 'Select medical reports'}
                  </span>
                  <span className='text-gray-400 text-xs'>▼</span>
                </button>

                {dropdownOpen && (
                  <div className='absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2 space-y-1'>
                    {reports.length === 0 ? (
                      <div className='text-sm text-gray-500 p-2 text-center'>
                        No active medical reports found
                      </div>
                    ) : (
                      reports.map((report) => {
                        const isChecked = formData.medical_reports?.includes(report.id);
                        return (
                          <label
                            key={report.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                              isChecked
                                ? 'bg-blue-50 text-blue-800'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input
                              type='checkbox'
                              checked={isChecked}
                              onChange={() => toggleReportSelection(report.id)}
                              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4'
                            />
                            <span className='font-medium'>{report.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
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
                  type='text'
                  inputMode='email'
                  placeholder='clinic@example.com'
                  value={formData.email}
                  onChange={handleInputChange}
                  invalid={!!formErrors.email}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
              {formErrors.email && (
                <p className={errorTextClass}>{formErrors.email}</p>
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
