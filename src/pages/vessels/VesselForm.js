import React, { useState, useEffect } from 'react';
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
  Calendar,
  MessageSquare,
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

const VesselForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const [formData, setFormData] = useState({
    name: '',
    imo_number: '',
    vessel_type: '',
    flag: '',
    status: 'Active',
    location: '',
    total_seats: 0,
    voyage_ref: '',
    reporting_port: '',
    joining_date: '',
    communication_details: '',
  });

  const VESSEL_TYPES = [
    'Bulk Carrier',
    'Oil Tanker',
    'Chemical Tanker',
    'Container Ship',
    'Ro-Ro Ship',
    'LNG Carrier',
    'LPG Carrier',
    'Offshore Supply Vessel',
    'General Cargo',
    'Passenger Ship',
    'Other',
  ];

  useEffect(() => {
    const fetchVessel = async () => {
      try {
        const response = await api.get(`/vessels/${id}`);
        if (response.data.success) {
          setFormData(response.data.data);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.imo_number) {
      toast.error('Please fill in all required fields');
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
      toast.error(
        error.response?.data?.message || 'Failed to save vessel details',
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
      <div className='flex items-center gap-4 mb-6'>
        <button
          onClick={() => navigate('/vessels')}
          className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>
            {isEditMode ? 'Edit Vessel' : 'Add New Vessel'}
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            {isEditMode
              ? 'Update the vessel details below'
              : 'Enter the details of the new vessel'}
          </p>
        </div>
      </div>

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
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  required
                />
              </div>
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
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  required
                />
              </div>
            </div>

            {/* Vessel Type */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Vessel Type
              </label>
              <div className='relative'>
                <Anchor className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10' />
                <Select
                  onValueChange={(val) =>
                    handleSelectChange('vessel_type', val)
                  }
                  value={formData.vessel_type}
                >
                  <SelectTrigger className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'>
                    <SelectValue placeholder='Select Type' />
                  </SelectTrigger>
                  <SelectContent>
                    {VESSEL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            {/* Joining Date */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Joining Date
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='joining_date'
                  type='date'
                  value={formData.joining_date}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                />
              </div>
            </div>
          </div>

          {/* Communication Details */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Communication Details
            </label>
            <div className='relative'>
              <MessageSquare className='absolute left-3 top-3 text-gray-400 h-4 w-4' />
              <textarea
                name='communication_details'
                placeholder='Enter communication details, contact information, etc.'
                value={formData.communication_details}
                onChange={handleInputChange}
                rows={4}
                className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 outline-none resize-vertical'
              />
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
              disabled={loading}
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
