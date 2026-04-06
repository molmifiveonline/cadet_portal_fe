import React, { useState, useEffect, useCallback } from 'react';
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
  FileText,
  Eye,
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

const InterviewForm = () => {
  const { cadet_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadet, setCadet] = useState(null);
  const [interviewSheetFile, setInterviewSheetFile] = useState(null);
  const [existingSheetName, setExistingSheetName] = useState('');
  const [existingSheetMimeType, setExistingSheetMimeType] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [formData, setFormData] = useState({
    interview_date: new Date().toISOString().split('T')[0],
    panel_members: '',
    evaluation_score: '',
    total_score: '',
    remarks: '',
    final_decision: 'selected',
  });


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cadetRes = await api.get(`/cadets/${cadet_id}`);
      setCadet(cadetRes.data);

      try {
        const interviewRes = await api.get(`/interviews/${cadet_id}`);
        if (interviewRes.data.success && interviewRes.data.data) {
          const data = interviewRes.data.data;
          setFormData({
            interview_date: data.interview_date
              ? data.interview_date.split('T')[0]
              : new Date().toISOString().split('T')[0],
            panel_members: data.panel_members || '',
            evaluation_score: data.evaluation_score || '',
            total_score: data.total_score || '',
            remarks: data.remarks || '',
            final_decision: data.final_decision ? data.final_decision.toLowerCase() : 'selected',
          });
          // Match 'waitlisted' from DB to 'waitlist' in FE
          if (data.final_decision && data.final_decision.toLowerCase() === 'waitlisted') {
            setFormData(prev => ({ ...prev, final_decision: 'waitlist' }));
          }
          setExistingSheetName(data.interview_sheet_name || '');
          setExistingSheetMimeType(data.interview_sheet_mime_type || '');
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
  }, [cadet_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load preview if it's an image
  useEffect(() => {
    const loadPreview = async () => {
      if (existingSheetName && existingSheetMimeType?.startsWith('image/')) {
        try {
          setPreviewLoading(true);
          const response = await api.get(`/interviews/${cadet_id}/sheet`, {
            responseType: 'blob',
          });
          const url = URL.createObjectURL(response.data);
          setPreviewUrl(url);
        } catch (error) {
          console.error('Error loading preview:', error);
        } finally {
          setPreviewLoading(false);
        }
      }
    };
    loadPreview();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [existingSheetName, existingSheetMimeType, cadet_id]);

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

  const handleViewSheet = async () => {
    try {
      const response = await api.get(`/interviews/${cadet_id}/sheet`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      window.open(url, '_blank');
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error viewing sheet:', error);
      toast.error('Failed to load interview sheet');
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
        title="Interview Evaluation"
        subtitle={`Record outcome for ${cadet?.name_as_in_indos_cert}`}
        icon={Calendar}
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
                Interview Date
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='date'
                  name='interview_date'
                  value={formData.interview_date}
                  onChange={handleInputChange}
                  className='pl-10'
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Interviewer Name / Panel
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  name='panel_members'
                  value={formData.panel_members}
                  onChange={handleInputChange}
                  placeholder='Enter names'
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Interview Score (%)
              </label>
              <div className='relative'>
                <Star className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='number'
                  name='evaluation_score'
                  value={formData.evaluation_score}
                  onChange={handleInputChange}
                  placeholder='0-100'
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Total Score
              </label>
              <div className='relative'>
                <Star className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='number'
                  step='0.01'
                  name='total_score'
                  value={formData.total_score}
                  onChange={handleInputChange}
                  placeholder='Total score'
                  className='pl-10'
                />
              </div>
              {formData.total_score && (
                <div className='mt-2'>
                  {parseFloat(formData.total_score) >= 60 ? (
                    <div className='flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200'>
                      <CheckCircle className='text-green-600' size={14} />
                      <span className='text-xs font-medium text-green-700'>
                        Recommended: Selected
                      </span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200'>
                      <XCircle className='text-red-600' size={14} />
                      <span className='text-xs font-medium text-red-700'>
                        Recommended: Rejected
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Outcome Status
              </label>
              <Select
                value={formData.final_decision}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, final_decision: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select result' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='selected'>
                    Selected (Advance to Medical)
                  </SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                  <SelectItem value='waitlist'>Waitlist</SelectItem>
                </SelectContent>
              </Select>
              {formData.final_decision === 'rejected' && (
                <div className='mt-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200 flex items-start gap-2'>
                  <XCircle className='text-yellow-600 mt-0.5' size={14} />
                  <p className='text-[11px] text-yellow-700 leading-tight'>
                    <strong>Warning:</strong> This cadet will not proceed to the
                    Medical stage and will be marked as "Interview Failed".
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                {existingSheetName ? 'Upload New Interview Sheet' : 'Upload Interview Sheet'}
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

            {existingSheetName && (
              <div className='group relative p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300'>
                <div className='flex items-start gap-4'>
                  {/* Preview Section */}
                  <div 
                    onClick={handleViewSheet}
                    className='relative w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white cursor-pointer group-hover:shadow-md transition-all'
                  >
                    {previewLoading ? (
                      <div className='absolute inset-0 flex items-center justify-center bg-gray-50'>
                        <Loader2 className='animate-spin text-blue-400' size={20} />
                      </div>
                    ) : previewUrl ? (
                      <img src={previewUrl} alt='Preview' className='w-full h-full object-cover' />
                    ) : existingSheetMimeType === 'application/pdf' ? (
                      <div className='absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-500'>
                        <FileText size={24} />
                        <span className='text-[10px] font-bold mt-1'>PDF</span>
                      </div>
                    ) : (
                      <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400'>
                        <FileText size={24} />
                        <span className='text-[10px] font-bold mt-1'>FILE</span>
                      </div>
                    )}
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity'>
                      <Eye className='text-white' size={20} />
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className='flex-1 py-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded tracking-wider'>
                        Current Attachment
                      </span>
                    </div>
                    <p className='text-sm text-gray-700 font-bold truncate max-w-[180px]' title={existingSheetName}>
                      {existingSheetName}
                    </p>
                    <p className='text-[11px] text-gray-400 mt-1 uppercase font-medium'>
                      {existingSheetMimeType.split('/')[1] || 'Document'}
                    </p>
                    
                    <button
                      type='button'
                      onClick={handleViewSheet}
                      className='mt-2 flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:text-blue-700 hover:underline transition-all'
                    >
                      <Eye size={14} />
                      Open Full Document
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              Save Interview Result
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewForm;
