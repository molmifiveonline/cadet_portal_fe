import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Save,
  ArrowLeft,
  Calendar,
  User,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const InterviewForm = () => {
  const { cadet_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadet, setCadet] = useState(null);
  const [interviewSheetFile, setInterviewSheetFile] = useState(null);

  const [formData, setFormData] = useState({
    interview_date: new Date().toISOString().split('T')[0],
    panel_members: '',
    evaluation_score: '',
    total_score: '',
    remarks: '',
    final_decision: 'selected',
  });

  useEffect(() => {
    fetchData();
  }, [cadet_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const cadetRes = await api.get(`/cadets/${cadet_id}`);
      setCadet(cadetRes.data);

      try {
        const interviewRes = await api.get(`/interviews/${cadet_id}`);
        if (interviewRes.data.success && interviewRes.data.data) {
          const data = interviewRes.data.data;
          setFormData({
            interview_date: data.interview_date ? data.interview_date.split('T')[0] : new Date().toISOString().split('T')[0],
            panel_members: data.panel_members || '',
            evaluation_score: data.evaluation_score || '',
            total_score: data.total_score || '',
            remarks: data.remarks || '',
            final_decision: data.final_decision || 'selected',
          });
        }
      } catch (err) {
        console.log('No existing interview found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load information');
    } finally {
      setLoading(false);
    }
  };

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
        setInterviewSheetFile(null);
        return;
      }
      setInterviewSheetFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('interview_date', formData.interview_date);
      data.append('panel_members', formData.panel_members);
      data.append('evaluation_score', formData.evaluation_score);
      data.append('total_score', formData.total_score);
      data.append('remarks', formData.remarks);
      data.append('final_decision', formData.final_decision);

      if (interviewSheetFile) {
        data.append('interview_sheet', interviewSheetFile);
      }

      await api.post(`/interviews/${cadet_id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Interview recorded successfully');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to save interview');
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
      <div className='flex items-center gap-4 mb-6'>
        <button onClick={() => navigate(-1)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Interview Evaluation</h1>
          <p className='text-gray-500 text-sm mt-1'>Record outcome for {cadet?.name_as_in_indos_cert}</p>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Interview Date</label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input type='date' name='interview_date' value={formData.interview_date} onChange={handleInputChange} className='pl-10' required />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Interviewer Name / Panel</label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input name='panel_members' value={formData.panel_members} onChange={handleInputChange} placeholder='Enter names' className='pl-10' />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Interview Score (%)</label>
              <div className='relative'>
                <Star className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input type='number' name='evaluation_score' value={formData.evaluation_score} onChange={handleInputChange} placeholder='0-100' className='pl-10' />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Total Score</label>
              <div className='relative'>
                <Star className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input type='number' step='0.01' name='total_score' value={formData.total_score} onChange={handleInputChange} placeholder='Total score' className='pl-10' />
              </div>
              {formData.total_score && (
                <div className='mt-2'>
                  {parseFloat(formData.total_score) >= 60 ? (
                    <div className='flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200'>
                      <CheckCircle className='text-green-600' size={14} />
                      <span className='text-xs font-medium text-green-700'>Recommended: Selected</span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200'>
                      <XCircle className='text-red-600' size={14} />
                      <span className='text-xs font-medium text-red-700'>Recommended: Rejected</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Outcome Status</label>
              <Select value={formData.final_decision} onValueChange={(val) => setFormData(p => ({ ...p, final_decision: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder='Select result' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='selected'>Selected (Advance to Medical)</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                  <SelectItem value='waitlist'>Waitlist</SelectItem>
                </SelectContent>
              </Select>
              {formData.final_decision === 'rejected' && (
                <div className='mt-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200 flex items-start gap-2'>
                  <XCircle className='text-yellow-600 mt-0.5' size={14} />
                  <p className='text-[11px] text-yellow-700 leading-tight'>
                    <strong>Warning:</strong> This cadet will not proceed to the Medical stage and will be marked as "Interview Failed".
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Upload Interview Sheet</label>
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
            <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
              <MessageSquare size={16} className='text-gray-400' />
              Remarks / Feedback
            </label>
            <textarea
              name='remarks'
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              className='w-full rounded-xl border border-gray-300 p-4 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none'
              placeholder='Detailed feedback...'
            />
          </div>

          <div className='pt-6 flex justify-end gap-3 border-t border-gray-200'>
            <Button type='button' variant='ghost' onClick={() => navigate(-1)}>Cancel</Button>
            <Button type='submit' className='bg-blue-600 hover:bg-blue-700 text-white' disabled={saving}>
              {saving ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <Save className='w-4 h-4 mr-2' />}
              Save Interview Result
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewForm;
