import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ship,
  Hash,
  Anchor,
  Navigation,
  ShieldAlert,
  Loader2,
  MapPin,
  Users,
  FileText,
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

const VesselForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [vesselTypes, setVesselTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    imo_number: '',
    vessel_type: '',
    vessel_type_id: '',
    department: 'Both',
    flag: '',
    status: 'Active',
    location: '',
    total_seats: '',
    voyage_ref: '',
    reporting_port: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
  });

  const loadVesselTypes = useCallback(async () => {
    setTypesLoading(true);
    setTypesError('');
    try {
      const response = await api.get('/vessels/master-types');
      setVesselTypes(response.data.data || []);
    } catch (error) {
      setTypesError(error.response?.data?.message || 'Failed to load vessel types.');
    } finally {
      setTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVesselTypes();
  }, [loadVesselTypes]);

  useEffect(() => {
    const fetchVessel = async () => {
      try {
        const response = await api.get(`/vessels/${id}`);
        if (response.data.success) {
          const vessel = response.data.data;
          const editableVessel = { ...vessel };
          delete editableVessel.joining_date;
          delete editableVessel.required_documents;
          delete editableVessel.communication_details;
          setFormData({ ...editableVessel, vessel_type_id: vessel.vessel_type_id || '' });
        }
      } catch (error) {
        toast.error('Failed to fetch vessel details');
        navigate('/vessels');
      } finally {
        setInitialLoading(false);
      }
    };

    if (isEditMode) {
      fetchVessel();
    }
  }, [id, navigate, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'vessel_type_id') {
      const selectedType = vesselTypes.find((type) => type.id === value);
      setFormData((prev) => ({ ...prev, vessel_type_id: value, vessel_type: selectedType?.name || '' }));
      setErrors((prev) => ({ ...prev, vessel_type: undefined }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.name?.trim()) nextErrors.name = 'Vessel Name is required.';
    if (!formData.imo_number?.trim()) nextErrors.imo_number = 'IMO Number is required.';
    const selectedType = vesselTypes.find((type) => type.id === formData.vessel_type_id);
    if (!selectedType || (selectedType.status !== 'Active' && !isEditMode)) nextErrors.vessel_type = 'Choose an active Vessel Type.';
    if (!['Deck', 'Engine', 'Both'].includes(formData.department)) nextErrors.department = 'Department Compatibility is required.';
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      const firstInvalidField = Object.keys(validationErrors)[0];
      requestAnimationFrame(() => document.querySelector(`[name="${firstInvalidField === 'vessel_type' ? 'vessel_type_id' : firstInvalidField}"]`)?.focus());
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/vessels/${id}`, formData);
        toast.success('Vessel updated successfully');
      } else {
        await api.post('/vessels', formData);
        toast.success('Vessel added successfully');
      }
      navigate('/vessels');
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') setErrors(apiErrors);
      toast.error(error.response?.data?.message || 'Failed to save vessel details');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || typesLoading) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-blue-600' size={40} />
      </div>
    );
  }

  const fieldClass = (field, className) => `${className} ${errors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`;
  const FieldError = ({ field }) => errors[field] ? <p className='text-sm text-red-600' role='alert'>{errors[field]}</p> : null;
  const selectedMasterType = vesselTypes.find((type) => type.id === formData.vessel_type_id);
  const legacyVesselType = isEditMode && formData.vessel_type && !selectedMasterType
    ? formData.vessel_type
    : '';

  return (
    <div className='py-6 mx-auto'>
      <PageHeader
        title={isEditMode ? 'Edit Vessel' : 'Add New Vessel'}
        subtitle={isEditMode ? 'Update the vessel details below' : 'Enter the details of the new vessel'}
        icon={isEditMode ? Ship : Anchor}
        backButton={
          <button
            onClick={() => navigate('/vessels')}
            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
        }
      />

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Vessel Name */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Vessel Name <span className='text-red-500 ml-1'>*</span>
              </label>
              <div className='relative'>
                <Ship className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='name'
                  type='text'
                  placeholder='e.g., MOL Truth'
                  value={formData.name}
                  onChange={handleInputChange}
                  className={fieldClass('name', 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none')}
                  aria-invalid={Boolean(errors.name)}
                />
              </div>
              <FieldError field='name' />
            </div>

            {/* IMO Number */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                IMO Number <span className='text-red-500 ml-1'>*</span>
              </label>
              <div className='relative'>
                <Hash className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='imo_number'
                  type='text'
                  placeholder='e.g., 9773210'
                  value={formData.imo_number}
                  onChange={handleInputChange}
                  className={fieldClass('imo_number', 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none')}
                  aria-invalid={Boolean(errors.imo_number)}
                />
              </div>
              <FieldError field='imo_number' />
            </div>

            {/* Vessel Type */}
            <div className='space-y-2'>
              <label htmlFor='vessel_type' className='text-sm font-medium text-gray-700'>
                Vessel Type <span className='text-red-500 ml-1'>*</span>
              </label>
              <div className='relative'>
                <Anchor className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10' />
                <select
                  id='vessel_type'
                  name='vessel_type_id'
                  value={selectedMasterType?.id || ''}
                  onChange={handleInputChange}
                  className={fieldClass('vessel_type', 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 outline-none')}
                  aria-invalid={Boolean(errors.vessel_type)}
                  required
                >
                  <option value=''>Select vessel type</option>
                  {vesselTypes.filter((type) => type.status === 'Active' || type.id === selectedMasterType?.id).map((type) => (
                    <option key={type.id} value={type.id}>{type.name}{type.status === 'Inactive' ? ' (Inactive)' : ''}</option>
                  ))}
                </select>
              </div>
              <FieldError field='vessel_type' />
              {legacyVesselType && <p className='text-sm text-amber-700'>Current type: {legacyVesselType}. Choose a master type before saving.</p>}
              {typesError && (
                <div className='text-sm text-red-600' role='alert'>
                  {typesError}{' '}
                  <button type='button' onClick={loadVesselTypes} className='underline'>Try again</button>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Department Compatibility <span className='text-red-500 ml-1'>*</span></label>
              <select
                name='department'
                value={formData.department || 'Both'}
                onChange={handleInputChange}
                className={fieldClass('department', 'w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white outline-none')}
                aria-invalid={Boolean(errors.department)}
              >
                <option value='Both'>Both</option>
                <option value='Deck'>Deck</option>
                <option value='Engine'>Engine</option>
              </select>
              <FieldError field='department' />
            </div>

            {/* Flag */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Flag Name
              </label>
              <div className='relative'>
                <Navigation className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='flag'
                  type='text'
                  placeholder='e.g., Panama'
                  value={formData.flag}
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

            {/* Location */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Location
              </label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='location'
                  type='text'
                  placeholder='e.g., Singapore'
                  value={formData.location}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>

            {/* Total Seats */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Total Seats
              </label>
              <div className='relative'>
                <Users className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='total_seats'
                  type='number'
                  placeholder='e.g., 20'
                  value={formData.total_seats}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>

            {/* Voyage Ref */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Voyage Reference
              </label>
              <div className='relative'>
                <FileText className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='voyage_ref'
                  type='text'
                  placeholder='e.g., V2024-001'
                  value={formData.voyage_ref}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>

            {/* Reporting Port */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Reporting Port
              </label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='reporting_port'
                  type='text'
                  placeholder='e.g., Port Klang'
                  value={formData.reporting_port}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>

          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Contact Person</label>
              <Input name='contact_person_name' value={formData.contact_person_name || ''} onChange={handleInputChange} placeholder='Full name' />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Contact Email</label>
              <Input name='contact_person_email' type='email' value={formData.contact_person_email || ''} onChange={handleInputChange} placeholder='Email address' />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Contact Phone</label>
              <Input name='contact_person_phone' value={formData.contact_person_phone || ''} onChange={handleInputChange} placeholder='Phone / WhatsApp' />
            </div>
          </div>

          <div className='pt-6 flex justify-end gap-3 border-t border-gray-200 mt-8'>
            <button
              type='button'
              onClick={() => navigate('/vessels')}
              className='px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors'
            >
              Cancel
            </button>
            <Button
              type='submit'
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white px-6 py-2.5 h-auto'
              disabled={loading || Boolean(typesError)}
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : isEditMode ? (
                'Update Vessel'
              ) : (
                'Save Vessel'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VesselForm;
