import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Save,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Star,
  MessageSquare,
  XCircle,
  Loader2,
  FileText,
  Eye,
  Plus,
  Trash2,
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
import {
  errorTextClass,
  getInvalidFieldClass,
} from '../../lib/utils/formStyles';

const InterviewForm = () => {
  const { cadet_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadet, setCadet] = useState(null);
  const [interviewSheetFile, setInterviewSheetFile] = useState(null);
  const [existingSheetName, setExistingSheetName] = useState('');
  const [existingSheetMimeType, setExistingSheetMimeType] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isViewMode = new URLSearchParams(location.search).get('view') === 'true';

  const [formData, setFormData] = useState({
    interview_date: new Date().toISOString().split('T')[0],
    interview_time: '',
    interviewers: [{ name: '', designation: '' }],
    panel_members: '',
    evaluation_parameters: {
      appearance: '',
      communication: '',
      conduct_manners: '',
      general_questions: '',
    },
    evaluation_score: '',
    total_score: '',
    remarks: '',
    comments: '',
    final_decision: 'selected',
  });

  const handleParamChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      evaluation_parameters: {
        ...prev.evaluation_parameters,
        [field]: value,
      },
    }));
    if (errors[`param_${field}`]) {
      setErrors((prev) => ({ ...prev, [`param_${field}`]: '' }));
    }
  };

  const handleInterviewerChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.interviewers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, interviewers: updated };
    });
  };

  const addInterviewer = () => {
    setFormData((prev) => ({
      ...prev,
      interviewers: [...prev.interviewers, { name: '', designation: '' }],
    }));
  };

  const removeInterviewer = (index) => {
    setFormData((prev) => ({
      ...prev,
      interviewers: prev.interviewers.filter((_, idx) => idx !== index),
    }));
  };

  const returnPath = location.state?.returnPath || null;
  const returnStatePayload = location.state?.returnState || null;
  const queryReturnTo = new URLSearchParams(location.search).get('returnTo');
  const defaultBackPath = '/interviews';

  const handleBack = useCallback(() => {
    if (returnPath) {
      navigate(returnPath, {
        state: returnStatePayload || undefined,
      });
      return;
    }

    if (queryReturnTo) {
      navigate(queryReturnTo);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(defaultBackPath);
  }, [defaultBackPath, navigate, queryReturnTo, returnPath, returnStatePayload]);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cadetRes = await api.get(`/cadets/${cadet_id}`);
      setCadet(cadetRes.data?.data || null);

      try {
        const interviewRes = await api.get(`/interviews/${cadet_id}`);
        if (interviewRes.data.success && interviewRes.data.data) {
          const data = interviewRes.data.data;

          let interviewersList = [{ name: '', designation: '' }];
          if (data.interviewers) {
            try {
              interviewersList = typeof data.interviewers === 'string'
                ? JSON.parse(data.interviewers)
                : data.interviewers;
            } catch (e) {
              console.error('Error parsing interviewers:', e);
            }
          } else if (data.panel_members) {
            interviewersList = data.panel_members.split(',').map((name) => ({
              name: name.trim(),
              designation: '',
            }));
          }

          let evalParams = {
            appearance: '',
            communication: '',
            conduct_manners: '',
            general_questions: '',
          };
          if (data.evaluation_parameters) {
            try {
              evalParams = typeof data.evaluation_parameters === 'string'
                ? JSON.parse(data.evaluation_parameters)
                : data.evaluation_parameters;
            } catch (e) {
              console.error('Error parsing evaluation_parameters:', e);
            }
          }

          setFormData({
            interview_date: data.interview_date
              ? data.interview_date.split('T')[0]
              : new Date().toISOString().split('T')[0],
            interview_time: data.interview_time || '',
            interviewers: interviewersList,
            panel_members: data.panel_members || '',
            evaluation_parameters: {
              appearance: evalParams.appearance ?? '',
              communication: evalParams.communication ?? '',
              conduct_manners: evalParams.conduct_manners ?? '',
              general_questions: evalParams.general_questions ?? '',
            },
            evaluation_score: data.evaluation_score || '',
            total_score: data.total_score || '',
            remarks: data.remarks || '',
            comments: data.comments || '',
            final_decision: data.final_decision ? data.final_decision.toLowerCase() : 'selected',
          });
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
    let objectUrl = null;

    const loadPreview = async () => {
      if (existingSheetName && existingSheetMimeType?.startsWith('image/')) {
        try {
          setPreviewLoading(true);
          const response = await api.get(`/interviews/${cadet_id}/sheet`, {
            responseType: 'blob',
          });
          objectUrl = URL.createObjectURL(response.data);
          setPreviewUrl(objectUrl);
        } catch (error) {
          console.error('Error loading preview:', error);
        } finally {
          setPreviewLoading(false);
        }
      }
    };
    loadPreview();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [existingSheetName, existingSheetMimeType, cadet_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
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

    // Validation
    const requiredFields = [
      { key: 'interview_date', name: 'Interview Date' },
      { key: 'interview_time', name: 'Interview Time' },
      { key: 'evaluation_score', name: 'Interview Score (%)' },
      { key: 'total_score', name: 'Total Score' },
      { key: 'comments', name: 'Comments' },
      { key: 'remarks', name: 'Remarks / Feedback' },
    ];

    const newErrors = {};
    let hasError = false;

    for (const field of requiredFields) {
      if (
        formData[field.key] === '' ||
        formData[field.key] === null ||
        formData[field.key] === undefined
      ) {
        newErrors[field.key] = `${field.name} is required`;
        hasError = true;
      }
    }

    const paramFields = [
      { key: 'appearance', name: 'Appearance' },
      { key: 'communication', name: 'Communication' },
      { key: 'conduct_manners', name: 'Conduct / Manners' },
      { key: 'general_questions', name: 'General Questions' },
    ];
    for (const param of paramFields) {
      const val = formData.evaluation_parameters[param.key];
      if (val === '' || val === null || val === undefined) {
        newErrors[`param_${param.key}`] = `${param.name} score is required`;
        hasError = true;
      } else {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 100) {
          newErrors[`param_${param.key}`] = `${param.name} score must be between 0 and 100`;
          hasError = true;
        }
      }
    }

    // Check if at least one interviewer has a name
    const validInterviewers = formData.interviewers.filter((i) => i.name.trim() !== '');
    if (validInterviewers.length === 0) {
      newErrors.interviewers = 'At least one interviewer name is required';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      toast.error(newErrors.interviewers || 'Please fill in all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const panelNames = validInterviewers.map((i) => i.name.trim()).join(', ');

      const data = new FormData();
      data.append('interview_date', formData.interview_date);
      data.append('interview_time', formData.interview_time);
      data.append('panel_members', panelNames);
      data.append('interviewers', JSON.stringify(formData.interviewers));
      data.append('evaluation_parameters', JSON.stringify(formData.evaluation_parameters));
      data.append('evaluation_score', formData.evaluation_score);
      data.append('total_score', formData.total_score);
      data.append('remarks', formData.remarks);
      data.append('comments', formData.comments);
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
      handleBack();
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
            type='button'
            onClick={handleBack}
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
                Interview Date <span className="text-red-500">*</span>
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='date'
                  name='interview_date'
                  value={formData.interview_date}
                  onChange={handleInputChange}
                  invalid={!!errors.interview_date}
                  className='pl-10'
                  required
                  disabled={isViewMode}
                />
              </div>
              {errors.interview_date && <p className={errorTextClass}>{errors.interview_date}</p>}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Interview Time <span className="text-red-500">*</span>
              </label>
              <div className='relative'>
                <Clock className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='time'
                  name='interview_time'
                  value={formData.interview_time}
                  onChange={handleInputChange}
                  invalid={!!errors.interview_time}
                  className='pl-10'
                  disabled={isViewMode}
                />
              </div>
              {errors.interview_time && <p className={errorTextClass}>{errors.interview_time}</p>}
            </div>

            <div className='md:col-span-2 space-y-4 border-b pb-6 mb-2'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-gray-900'>Interview Panel <span className="text-red-500">*</span></h3>
                {!isViewMode && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addInterviewer}
                    className='h-8 text-xs font-semibold gap-1 border-blue-200 text-blue-700 hover:bg-blue-50'
                  >
                    <Plus size={14} /> Add Interviewer
                  </Button>
                )}
              </div>

              <div className='space-y-3'>
                {formData.interviewers.map((interviewer, index) => (
                  <div key={index} className='flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 relative'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 flex-1'>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-gray-500'>Interviewer Name</label>
                        <div className='relative'>
                          <User className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                          <Input
                            value={interviewer.name}
                            onChange={(e) => handleInterviewerChange(index, 'name', e.target.value)}
                            placeholder='Enter name'
                            className='pl-10 bg-white'
                            disabled={isViewMode}
                          />
                        </div>
                      </div>

                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-gray-500'>Designation</label>
                        <Input
                          value={interviewer.designation}
                          onChange={(e) => handleInterviewerChange(index, 'designation', e.target.value)}
                          placeholder='e.g. Captain, Chief Engineer'
                          className='bg-white'
                          disabled={isViewMode}
                        />
                      </div>
                    </div>

                    {!isViewMode && formData.interviewers.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeInterviewer(index)}
                        className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6 self-start'
                        title='Remove interviewer'
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.interviewers && <p className={errorTextClass}>{errors.interviewers}</p>}
            </div>

            <div className='md:col-span-2 space-y-4 border-b pb-6 mb-2'>
              <h3 className='text-sm font-semibold text-gray-900'>Evaluation Parameters (Score out of 100)</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Appearance <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    value={formData.evaluation_parameters.appearance}
                    onChange={(e) => handleParamChange('appearance', e.target.value)}
                    placeholder='0-100'
                    invalid={!!errors.param_appearance}
                    disabled={isViewMode}
                  />
                  {errors.param_appearance && <p className={errorTextClass}>{errors.param_appearance}</p>}
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Communication <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    value={formData.evaluation_parameters.communication}
                    onChange={(e) => handleParamChange('communication', e.target.value)}
                    placeholder='0-100'
                    invalid={!!errors.param_communication}
                    disabled={isViewMode}
                  />
                  {errors.param_communication && <p className={errorTextClass}>{errors.param_communication}</p>}
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Conduct / Manners <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    value={formData.evaluation_parameters.conduct_manners}
                    onChange={(e) => handleParamChange('conduct_manners', e.target.value)}
                    placeholder='0-100'
                    invalid={!!errors.param_conduct_manners}
                    disabled={isViewMode}
                  />
                  {errors.param_conduct_manners && <p className={errorTextClass}>{errors.param_conduct_manners}</p>}
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    General Questions <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    value={formData.evaluation_parameters.general_questions}
                    onChange={(e) => handleParamChange('general_questions', e.target.value)}
                    placeholder='0-100'
                    invalid={!!errors.param_general_questions}
                    disabled={isViewMode}
                  />
                  {errors.param_general_questions && <p className={errorTextClass}>{errors.param_general_questions}</p>}
                </div>
              </div>
            </div>



            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Interview Score (%) <span className="text-red-500">*</span>
              </label>
              <div className='relative'>
                <Star className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='number'
                  name='evaluation_score'
                  value={formData.evaluation_score}
                  onChange={handleInputChange}
                  placeholder='0-100'
                  invalid={!!errors.evaluation_score}
                  className='pl-10'
                  disabled={isViewMode}
                />
              </div>
              {errors.evaluation_score && <p className={errorTextClass}>{errors.evaluation_score}</p>}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Total Score <span className="text-red-500">*</span>
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
                  invalid={!!errors.total_score}
                  className='pl-10'
                  disabled={isViewMode}
                />
              </div>
              {errors.total_score && <p className={errorTextClass}>{errors.total_score}</p>}
              {formData.total_score ? (
                <p className='mt-2 text-xs text-slate-500'>
                  Recommendation remains manual until the final interview formula is provided.
                </p>
              ) : null}
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
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select result' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='selected'>
                    Selected (Advance to Medical)
                  </SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                  <SelectItem value='waitlisted'>Waitlisted</SelectItem>
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
              {formData.final_decision === 'waitlisted' && (
                <div className='mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-700'>
                  Waitlisted cadets remain in the interview stage and do not move to medical until selected.
                </div>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            {!isViewMode && (
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
            )}

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
              Comments <span className="text-red-500">*</span>
            </label>
            <textarea
              name='comments'
              value={formData.comments}
              onChange={handleInputChange}
              rows={3}
              aria-invalid={errors.comments ? true : undefined}
              className={`w-full rounded-xl border border-gray-300 p-4 text-sm outline-none resize-none focus:ring-4 focus:ring-blue-100 ${getInvalidFieldClass(errors.comments)}`}
              placeholder='Panel comments and observations...'
              disabled={isViewMode}
            />
            {errors.comments && <p className={errorTextClass}>{errors.comments}</p>}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
              <MessageSquare size={16} className='text-gray-400' />
              Remarks / Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              name='remarks'
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              aria-invalid={errors.remarks ? true : undefined}
              className={`w-full rounded-xl border border-gray-300 p-4 text-sm outline-none resize-none focus:ring-4 focus:ring-blue-100 ${getInvalidFieldClass(errors.remarks)}`}
              placeholder='Detailed feedback...'
              disabled={isViewMode}
            />
            {errors.remarks && <p className={errorTextClass}>{errors.remarks}</p>}
          </div>

          {!isViewMode && (
            <div className='pt-6 flex justify-end gap-3 border-t border-gray-200'>
              <Button type='button' variant='ghost' onClick={handleBack}>
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
          )}
        </form>
      </div>
    </div>
  );
};

export default InterviewForm;
