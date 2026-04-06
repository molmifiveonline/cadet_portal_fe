import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Save,
  ArrowLeft,
  Calendar,
  Activity,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const MedicalResultForm = () => {
  const { cadet_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadet, setCadet] = useState(null);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [reportFile, setReportFile] = useState(null);

  const [formData, setFormData] = useState({
    medical_date: new Date().toISOString().split('T')[0],
    medical_time: '',
    medical_center_id: '',
    fit_status: 'fit',
    remarks: '',
  });


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cadetRes = await api.get(`/cadets/${cadet_id}`);
      setCadet(cadetRes.data);

      // Fetch medical centers
      const centersRes = await api.get('/medical-centers');
      if (centersRes.data.success) {
        setMedicalCenters(centersRes.data.data);
      }

      try {
        const medicalRes = await api.get(`/medical-results/${cadet_id}`);
        if (medicalRes.data.success && medicalRes.data.data) {
          const data = medicalRes.data.data;
          setFormData({
            medical_date: data.medical_date
              ? data.medical_date.split('T')[0]
              : new Date().toISOString().split('T')[0],
            medical_time: data.medical_time || '',
            medical_center_id: data.medical_center_id || '',
            fit_status: data.fit_status || 'fit',
            remarks: data.remarks || '',
          });
        }
      } catch (err) {
        console.log('No existing medical result found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load information');
    } finally {
      setLoading(false);
    }
  }, [cadet_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 10MB.');
        e.target.value = '';
        setReportFile(null);
        return;
      }
      setReportFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('medical_date', formData.medical_date);
      data.append('medical_time', formData.medical_time);
      data.append('medical_center_id', formData.medical_center_id);
      data.append('fit_status', formData.fit_status);
      data.append('remarks', formData.remarks);

      if (reportFile) {
        data.append('report', reportFile);
      }

      await api.post(`/medical-results/${cadet_id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Medical result recorded successfully');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to save medical result');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-blue-600' size={40} />
      </div>
    );
  }

  return (
    <div className='py-6'>
      <PageHeader
        title="Medical Examination Result"
        subtitle={`Record outcome for ${cadet?.name_as_in_indos_cert}`}
        icon={Activity}
        backButton={
          <button
            onClick={() => navigate(-1)}
            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
        }
      />

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Examination Date
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='date'
                  name='medical_date'
                  value={formData.medical_date}
                  onChange={handleInputChange}
                  className='pl-10'
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Examination Time
              </label>
              <div className='relative'>
                <Activity className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='time'
                  name='medical_time'
                  value={formData.medical_time}
                  onChange={handleInputChange}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Medical Center
              </label>
              <Select
                value={formData.medical_center_id}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, medical_center_id: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select medical center' />
                </SelectTrigger>
                <SelectContent>
                  {medicalCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.center_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Fitness Outcome
              </label>
              <Select
                value={formData.fit_status}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, fit_status: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='fit'>Fit for Sea Service</SelectItem>
                  <SelectItem value='unfit'>Unfit</SelectItem>
                  <SelectItem value='fit_with_rest'>
                    Fit with Restrictions
                  </SelectItem>
                  <SelectItem value='pending'>Pending Investigation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            {' '}
            <label className='text-sm font-medium text-gray-700'>
              Upload Medical Report
            </label>
            <Input
              type='file'
              onChange={handleFileChange}
              className='cursor-pointer rounded-xl bg-gray-50'
              accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
            />
            <p className='text-xs text-gray-400 mt-1'>
              Supported: PDF, Word, Images (Up to 10MB)
            </p>
          </div>

          <div className='space-y-2'>
            {' '}
            <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
              <MessageSquare size={16} className='text-gray-400' />
              Medical Remarks / Notes
            </label>
            <textarea
              name='remarks'
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              className='w-full rounded-xl border border-gray-300 p-4 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none'
              placeholder='Add specific medical observations...'
            />
          </div>

          <div className='pt-6 flex justify-end gap-3 border-t border-gray-200'>
            <Button type='button' variant='ghost' onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-blue-600 hover:bg-blue-700 text-white'
              disabled={saving}
            >
              {saving ? (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              ) : (
                <Save className='w-4 h-4 mr-2' />
              )}
              Save Medical Result
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalResultForm;
