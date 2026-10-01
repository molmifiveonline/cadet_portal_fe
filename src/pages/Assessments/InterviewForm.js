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
  PenLine,
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
import InterviewHandwritingEditor from './InterviewHandwritingEditor';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import FileUploadPanel from '../../components/common/FileUploadPanel';

const MAX_INTERVIEW_SHEETS = 10;

const InterviewForm = () => {
  const { cadet_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadet, setCadet] = useState(null);
  const [interviewAttachments, setInterviewAttachments] = useState([]);
  const [uploadingSheets, setUploadingSheets] = useState(false);
  const [deleteAttachment, setDeleteAttachment] = useState(null);
  const [deletingAttachment, setDeletingAttachment] = useState(false);
  const [handwrittenDocuments, setHandwrittenDocuments] = useState([]);
  const [deleteHandwrittenDocument, setDeleteHandwrittenDocument] = useState(null);
  const [deletingHandwritten, setDeletingHandwritten] = useState(false);
  const [isHandwritingOpen, setIsHandwritingOpen] = useState(false);
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
        }
      } catch (err) {
        console.log('No existing interview found');
      }

      try {
        const attachmentsRes = await api.get(
          `/interviews/${cadet_id}/attachments`,
        );
        setInterviewAttachments(attachmentsRes.data?.data || []);
      } catch (err) {
        console.error('Error loading interview sheets:', err);
        setInterviewAttachments([]);
      }

      try {
        const handwrittenRes = await api.get(
          `/interviews/${cadet_id}/handwritten-sheets`,
        );
        setHandwrittenDocuments(handwrittenRes.data?.data || []);
      } catch (err) {
        console.error('Error loading handwritten interview notes:', err);
        setHandwrittenDocuments([]);
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleUploadInterviewSheets = async (files) => {
    setUploadingSheets(true);
    try {
      const data = new FormData();
      files.forEach((file) => {
        data.append('interview_sheets', file);
      });
      const response = await api.post(
        `/interviews/${cadet_id}/attachments`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setInterviewAttachments(response.data?.data || []);
      toast.success(response.data?.message || 'Interview sheets uploaded');
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to upload interview sheets',
      );
      return false;
    } finally {
      setUploadingSheets(false);
    }
  };

  const handleDeleteInterviewSheet = async () => {
    if (!deleteAttachment) return;

    setDeletingAttachment(true);
    try {
      await api.delete(
        `/interviews/${cadet_id}/attachments/${deleteAttachment.id}`,
      );
      setInterviewAttachments((current) =>
        current.filter((attachment) => attachment.id !== deleteAttachment.id),
      );
      setDeleteAttachment(null);
      toast.success('Interview sheet deleted successfully');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete interview sheet',
      );
    } finally {
      setDeletingAttachment(false);
    }
  };

  const handleDeleteHandwrittenSheet = async () => {
    if (!deleteHandwrittenDocument) return;
    setDeletingHandwritten(true);
    try {
      await api.delete(
        `/interviews/${cadet_id}/handwritten-sheets/${deleteHandwrittenDocument.id}`,
      );
      setHandwrittenDocuments((current) =>
        current.filter(
          (document) => document.id !== deleteHandwrittenDocument.id,
        ),
      );
      setDeleteHandwrittenDocument(null);
      toast.success('Handwritten interview notes deleted successfully');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to delete handwritten interview notes',
      );
    } finally {
      setDeletingHandwritten(false);
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

  const handleViewSheet = async (attachmentId) => {
    await handleViewDocument(
      `/interviews/${cadet_id}/attachments/${attachmentId}`,
      'Failed to load interview sheet',
    );
  };

  const handleViewHandwrittenSheet = async (documentId) => {
    await handleViewDocument(
      `/interviews/${cadet_id}/handwritten-sheets/${documentId}`,
      'Failed to load handwritten interview notes',
    );
  };

  const handleViewDocument = async (endpoint, errorMessage) => {
    try {
      const response = await api.get(endpoint, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      window.open(url, '_blank');
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error viewing interview document:', error);
      toast.error(errorMessage);
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
      {isHandwritingOpen && (
        <InterviewHandwritingEditor
          cadetId={cadet_id}
          cadetName={cadet?.name_as_in_indos_cert}
          onClose={() => setIsHandwritingOpen(false)}
          onSaved={(document) => {
            setHandwrittenDocuments((current) => [document, ...current]);
            setIsHandwritingOpen(false);
          }}
        />
      )}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteAttachment)}
        onClose={() => {
          if (!deletingAttachment) setDeleteAttachment(null);
        }}
        onConfirm={handleDeleteInterviewSheet}
        title='Delete Interview Sheet'
        message={`Are you sure you want to delete ${
          deleteAttachment?.original_name || 'this interview sheet'
        }? This action cannot be undone.`}
      />
      <DeleteConfirmationModal
        isOpen={Boolean(deleteHandwrittenDocument)}
        onClose={() => {
          if (!deletingHandwritten) setDeleteHandwrittenDocument(null);
        }}
        onConfirm={handleDeleteHandwrittenSheet}
        title='Delete Handwritten Notes'
        message={`Are you sure you want to delete ${
          deleteHandwrittenDocument?.original_name ||
          'this handwritten interview PDF'
        }? This action cannot be undone.`}
      />
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
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none' />
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
                  <SelectItem value='rejected'>Release</SelectItem>
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

          <div className='grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 lg:grid-cols-2'>
            <div className='flex flex-wrap items-center justify-between gap-3 lg:col-start-1 lg:row-start-1'>
              <div>
                <h3 className='text-sm font-semibold text-slate-900'>
                  Write Interview Notes
                </h3>
                <p className='mt-1 text-xs text-slate-500'>
                  Write with S Pen, touch, or mouse and save as PDF.
                </p>
              </div>
              {!isViewMode ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsHandwritingOpen(true)}
                  className='h-10 gap-2 border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                >
                  <PenLine size={17} />
                  Write Notes
                </Button>
              ) : null}
            </div>

            <div className='lg:col-start-2 lg:row-span-2 lg:row-start-1'>
            <FileUploadPanel
              title='Upload Interview Sheet'
              description='Upload supporting sheets separately from the interview result.'
              files={interviewAttachments}
              showFileList={isViewMode || interviewAttachments.length > 0}
              multiple
              maxFiles={Math.max(
                1,
                MAX_INTERVIEW_SHEETS - interviewAttachments.length,
              )}
              maxSizeMB={10}
              canUpload={!isViewMode}
              canDelete={!isViewMode}
              uploadLocked={
                interviewAttachments.length >= MAX_INTERVIEW_SHEETS
              }
              uploading={uploadingSheets}
              lockMessage='Maximum of 10 interview sheets reached. Delete a sheet to upload another.'
              emptyMessage='No file uploaded.'
              onUpload={handleUploadInterviewSheets}
              onView={(attachment) => handleViewSheet(attachment.id)}
              onDelete={setDeleteAttachment}
              getFileMetadata={(attachment) => {
                const details = [
                  attachment.mime_type?.split('/').pop()?.toUpperCase() ||
                    'FILE',
                ];
                if (Number(attachment.file_size) > 0) {
                  details.push(
                    `${(Number(attachment.file_size) / 1024 / 1024).toFixed(2)} MB`,
                  );
                }
                if (attachment.created_at) {
                  details.push(
                    new Date(attachment.created_at).toLocaleString(),
                  );
                }
                return details.join(' | ');
              }}
            />
            </div>

            {(isViewMode || handwrittenDocuments.length > 0) && (
              <div className='flex h-full flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white lg:col-start-1 lg:row-start-2'>
                <div className='flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-3 py-2'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>
                    Handwritten Notes
                  </span>
                  <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700'>
                    {handwrittenDocuments.length}
                  </span>
                </div>
                <div className='flex-1 divide-y divide-slate-100'>
                  {handwrittenDocuments.length > 0 ? handwrittenDocuments.map((document) => (
                    <div
                      key={document.id}
                      className='flex items-center gap-3 p-3 hover:bg-slate-50'
                    >
                      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500'>
                        <FileText size={20} />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p
                          className='truncate text-sm font-medium text-slate-800'
                          title={document.original_name}
                        >
                          {document.original_name}
                        </p>
                        {document.created_at ? (
                          <p className='mt-0.5 text-xs text-slate-500'>
                            {new Date(document.created_at).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type='button'
                        onClick={() => handleViewHandwrittenSheet(document.id)}
                        className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                        title='View handwritten notes'
                        aria-label={`View ${document.original_name}`}
                      >
                        <Eye size={18} />
                      </button>
                      {!isViewMode ? (
                        <button
                          type='button'
                          onClick={() => setDeleteHandwrittenDocument(document)}
                          className='rounded-lg p-2 text-red-600 hover:bg-red-50'
                          title='Delete handwritten notes'
                          aria-label={`Delete ${document.original_name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : null}
                    </div>
                  )) : (
                    <div className='px-4 py-8 text-center text-sm text-slate-500'>
                      No file uploaded.
                    </div>
                  )}
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
