import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Save,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardList,
  Target,
  Languages,
  PencilLine,
  MessageSquare,
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

const AssessmentForm = () => {
  const { cadet_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadet, setCadet] = useState(null);
  const [essayFile, setEssayFile] = useState(null);

  const [formData, setFormData] = useState({
    ces_test: '',
    qa_test: '',
    english_test: '',
    essay_writing_mark: '',
    remarks: '',
    status: 'pass',
  });
  const [existingEssay, setExistingEssay] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadet_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch cadet details
      const cadetRes = await api.get(`/cadets/${cadet_id}`);
      setCadet(cadetRes.data);

      // Fetch existing assessment if any
      try {
        const assessmentRes = await api.get(`/assessments/${cadet_id}`);
        if (assessmentRes.data.success && assessmentRes.data.data) {
          const data = assessmentRes.data.data;
          setFormData({
            ces_test: data.ces_test || '',
            qa_test: data.qa_test || '',
            english_test: data.english_test || '',
            essay_writing_mark: data.essay_writing_mark || '',
            remarks: data.remarks || '',
            status: data.status || 'pass',
          });
          if (data.essay_name) {
            setExistingEssay(data.essay_name);
          }
        }
      } catch (err) {
        // Assessment might not exist, which is fine
        console.log('No existing assessment found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load cadet information');
      navigate(-1);
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
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 5MB.');
        e.target.value = '';
        setEssayFile(null);
        return;
      }
      setEssayFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = new FormData();
      data.append('ces_test', formData.ces_test);
      data.append('qa_test', formData.qa_test);
      data.append('english_test', formData.english_test);
      data.append('essay_writing_mark', formData.essay_writing_mark);
      data.append('remarks', formData.remarks);
      data.append('status', formData.status);

      if (essayFile) {
        data.append('essay', essayFile);
      }

      await api.post(`/assessments/${cadet_id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Assessment saved successfully');
      navigate(-1);
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error(error.response?.data?.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const downloadEssay = () => {
    const userStr = localStorage.getItem('user');
    let token = '';
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        token = user.token || '';
      }
      if (!token) {
        token = localStorage.getItem('token') || '';
      }
    } catch (e) {
      token = localStorage.getItem('token') || '';
    }

    if (!token) {
      toast.error('Authentication error. Please login again.');
      return;
    }

    window.open(
      `${api.defaults.baseURL}/assessments/${cadet_id}/essay/download?token=${token}`,
      '_blank',
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-[#3a5f9e]' size={40} />
      </div>
    );
  }

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none';

  return (
    <div className='py-6'>
      <div className='flex items-center gap-4 mb-6'>
        <button
          onClick={() => navigate(-1)}
          className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Cadet Assessment</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Evaluate and record test results for {cadet?.name_as_in_indos_cert}
          </p>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Test Scores Section */}
          <div>
            <h2 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
              <ClipboardList className='text-[#3a5f9e]' size={20} />
              Test Scores
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  CES Test Score
                </label>
                <div className='relative'>
                  <Target className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    name='ces_test'
                    value={formData.ces_test}
                    onChange={handleInputChange}
                    placeholder='Enter score'
                    className={inputClass}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  QA Test Score
                </label>
                <div className='relative'>
                  <ClipboardList className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    name='qa_test'
                    value={formData.qa_test}
                    onChange={handleInputChange}
                    placeholder='Enter score'
                    className={inputClass}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  English Test Score
                </label>
                <div className='relative'>
                  <Languages className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    name='english_test'
                    value={formData.english_test}
                    onChange={handleInputChange}
                    placeholder='Enter score'
                    className={inputClass}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Essay Writing Mark
                </label>
                <div className='relative'>
                  <PencilLine className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    name='essay_writing_mark'
                    type='number'
                    step='0.01'
                    value={formData.essay_writing_mark}
                    onChange={handleInputChange}
                    placeholder='Enter mark'
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-gray-100 pt-8'>
            <h2 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
              <FileText className='text-[#3a5f9e]' size={20} />
              Essay & Final Evaluation
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Upload Essay Document
                </label>
                <div className='flex items-center gap-3'>
                  <Input
                    type='file'
                    onChange={handleFileChange}
                    className='cursor-pointer rounded-xl bg-gray-50'
                    accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                  />
                  {(essayFile || existingEssay) && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={downloadEssay}
                      className='shrink-0 h-10 gap-2 bg-blue-50/30 text-blue-700 border-blue-200'
                      title='Download current essay'
                    >
                      <FileText size={18} />
                      <span className='hidden sm:inline'>
                        {essayFile ? 'Preview' : 'Current Essay'}
                      </span>
                    </Button>
                  )}
                </div>
                {existingEssay && !essayFile && (
                  <p className='text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1'>
                    <CheckCircle size={10} />
                    Existing File: {existingEssay}
                  </p>
                )}
                <p className='text-xs text-gray-400 mt-1'>
                  Supported: PDF, Word, Images (Up to 5MB)
                </p>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Overall Assessment Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, status: val }))
                  }
                >
                  <SelectTrigger className='w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'>
                    <SelectValue placeholder='Select outcome' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pass'>
                      <div className='flex items-center gap-2 text-green-600'>
                        <CheckCircle size={16} />
                        <span>Pass</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='fail'>
                      <div className='flex items-center gap-2 text-red-600'>
                        <XCircle size={16} />
                        <span>Fail</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='mt-6 space-y-2'>
              <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                <MessageSquare size={16} className='text-gray-400' />
                Remarks / Feedback
              </label>
              <textarea
                name='remarks'
                value={formData.remarks}
                onChange={handleInputChange}
                rows={4}
                className='w-full rounded-xl border border-gray-300 bg-gray-50/50 p-4 text-sm focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 outline-none resize-none'
                placeholder='Add detailed assessment remarks here...'
              />
            </div>
          </div>

          <div className='pt-6 flex justify-end gap-3 border-t border-gray-200 mt-8'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors'
            >
              Cancel
            </button>
            <Button
              type='submit'
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white px-8 py-2.5 h-auto rounded-lg shadow-sm font-medium transition-all active:scale-95'
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' />
                  Save Assessment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentForm;
