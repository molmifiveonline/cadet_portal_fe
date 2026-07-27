import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Save,
  ArrowLeft,
  Calendar,
  Activity,
  MessageSquare,
  Loader2,
  X,
  Plus,
  Eye,
  FileText
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import ConfirmationModal from '../../components/common/ConfirmationModal';
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
import StageInviteModal from '../RecruitmentDrives/StageInviteModal';


const MultiSelectDropdown = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];
  
  return (
    <div className="relative">
      <div 
        onClick={() => setOpen(!open)}
        className="flex min-h-[40px] w-full cursor-pointer flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {selectedValues.length === 0 ? (
          <span className="text-gray-500">{placeholder || "Select..."}</span>
        ) : (
          <span className="truncate">{selectedValues.length} selected</span>
        )}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute z-[60] mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <div
              className="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                 if (selectedValues.length === options.length && options.length > 0) {
                   onChange([]);
                 } else {
                   onChange(options.map(o => o.value));
                 }
              }}
            >
              <input type="checkbox" checked={selectedValues.length === options.length && options.length > 0} readOnly className="mr-2" />
              <span className="font-medium">Select All</span>
            </div>
            {options.map(option => (
              <div
                key={option.value}
                className="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => {
                  if (selectedValues.includes(option.value)) {
                    onChange(selectedValues.filter(v => v !== option.value));
                  } else {
                    onChange([...selectedValues, option.value]);
                  }
                }}
              >
                <input type="checkbox" checked={selectedValues.includes(option.value)} readOnly className="mr-2" />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const MedicalResultForm = () => {
  const { cadet_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const returnPath = location.state?.returnPath;
    const returnState = location.state?.returnState;
    if (returnPath) {
      navigate(returnPath, { state: returnState });
    } else {
      navigate(-1);
    }
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadet, setCadet] = useState(null);
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [assignedReports, setAssignedReports] = useState([]);
  const [reportFiles, setReportFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRetestModal, setShowRetestModal] = useState(false);
  const [sendingRetest, setSendingRetest] = useState(false);

  const [formData, setFormData] = useState({
    appointments: [{ medical_date: new Date().toISOString().split('T')[0], medical_time: '', medical_center_id: '', medical_reports: [] }],
    final_decision: 'pass',
    retest_reports: [],
    remarks: '',
    report_results: [],
  });


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cadetRes = await api.get(`/cadets/${cadet_id}`);
      setCadet(cadetRes.data?.data || null);

      const [centersRes, reportsRes] = await Promise.all([
        api.get('/medical-centers'),
        api.get('/medical-reports')
      ]);

      if (centersRes.data.success) {
        setMedicalCenters(centersRes.data.data);
      }
      
      const allReports = reportsRes.data?.data || [];
      setMedicalReports(allReports);

      try {
        const medicalRes = await api.get(`/medical-results/${cadet_id}`);
        if (medicalRes.data.success && medicalRes.data.data) {
          const data = medicalRes.data.data;
          let parsedAppointments = [];
          try {
            parsedAppointments = typeof data.appointments === 'string' ? JSON.parse(data.appointments) : (data.appointments || []);
          } catch(e) {}
          
          let parsedReportResults = [];
          try {
            parsedReportResults = typeof data.report_results === 'string' ? JSON.parse(data.report_results) : (data.report_results || []);
          } catch(e) {}

          const assignedReportIds = new Set();
          parsedAppointments.forEach(app => {
            (app.medical_reports || []).forEach(rId => assignedReportIds.add(rId));
          });
          
          const initialReportResults = Array.from(assignedReportIds).map(rId => {
            const existing = parsedReportResults.find(r => String(r.report_id) === String(rId));
            return existing || { report_id: rId, status: 'pending', remarks: '' };
          });
          
          parsedReportResults.forEach(pr => {
             if (!assignedReportIds.has(String(pr.report_id))) {
               initialReportResults.push(pr);
             }
          });

          const assignedList = initialReportResults.map(r => {
             const reportDef = allReports.find(mr => String(mr.id) === String(r.report_id));
             return { id: r.report_id, name: reportDef ? reportDef.name : r.report_id };
          });
          setAssignedReports(assignedList);

          setFormData({
            appointments: parsedAppointments.length > 0 ? parsedAppointments : [{ medical_date: new Date().toISOString().split('T')[0], medical_time: '', medical_center_id: '', medical_reports: [] }],
            final_decision: data.final_decision || 'pass',
            remarks: data.remarks || '',
            report_results: initialReportResults,
          });
          setExistingFiles(data.files || []);
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

  useEffect(() => {
    // Dynamically update assigned reports list when appointments change
    const assignedReportIds = new Set();
    formData.appointments.forEach(app => {
      (app.medical_reports || []).forEach(rId => assignedReportIds.add(rId));
    });
    
    const assignedList = Array.from(assignedReportIds).map(rId => {
       const reportDef = medicalReports.find(mr => String(mr.id) === String(rId));
       return { id: rId, name: reportDef ? reportDef.name : rId };
    });
    setAssignedReports(assignedList);
  }, [formData.appointments, medicalReports]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    let hasError = false;
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        hasError = true;
      } else {
        validFiles.push(file);
      }
    }
    if (hasError) toast.error('Some files are too large. Maximum size is 10MB.');
    setReportFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.appointments.some(a => !a.medical_date || !a.medical_time || !a.medical_center_id)) {
      toast.error('All appointments must have a date, time, and medical center.');
      return;
    }
    if (cadet && !Number(cadet.institute_detail_filled || 0)) {
      setShowConfirmModal(true);
    } else {
      saveMedicalResult();
    }
  };

  const handleRetestClick = () => {
    if (formData.retest_reports.length === 0) {
      toast.error('Please select at least one medical report for retest.');
      return;
    }
    setShowRetestModal(true);
  };

  const handleSendRetestInvite = async (modalFormData, submissions) => {
    try {
      setSendingRetest(true);
      const payload = {
        cadets: submissions.map(sub => ({
          cadet_id: sub.cadet_id,
          remarks: sub.remarks,
          appointments: sub.appointments.map(app => ({
            ...app,
            medical_reports: app.medical_reports || []
          }))
        }))
      };

      await api.post(`/medical-results/${cadet_id}/send-retest-invite`, payload);
      toast.success('Retest invite sent successfully');
      setShowRetestModal(false);
      handleBack();
    } catch (error) {
      toast.error('Failed to send retest invite');
    } finally {
      setSendingRetest(false);
    }
  };

  const medicalCenterOptions = medicalCenters.map((center) => ({
    label: center.center_name,
    value: center.id,
  }));

  const saveMedicalResult = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append('final_decision', formData.final_decision);
      data.append('remarks', formData.remarks);
      data.append('appointments', JSON.stringify(formData.appointments));

      reportFiles.forEach(file => {
        data.append('reports', file);
      });

      if (formData.report_results && formData.report_results.length > 0) {
        // filter report results to only include those that are currently assigned
        const assignedReportIds = new Set();
        formData.appointments.forEach(app => {
          (app.medical_reports || []).forEach(rId => assignedReportIds.add(rId));
        });
        const activeResults = formData.report_results.filter(r => assignedReportIds.has(r.report_id));
        data.append('report_results', JSON.stringify(activeResults));
      }

      await api.post(`/medical-results/${cadet_id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Medical result recorded successfully');
      handleBack();
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
            onClick={handleBack}
            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
        }
      />

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='space-y-6'>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
            </div>
            
            <div className="space-y-4">
              {formData.appointments.map((appt, index) => (
                <div key={index} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4 pt-8">
                  {appt.is_retest && (
                    <span className="absolute left-4 top-2.5 rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-850">
                      Retest
                    </span>
                  )}
                  {formData.appointments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newAppts = [...formData.appointments];
                        newAppts.splice(index, 1);
                        setFormData(p => ({ ...p, appointments: newAppts }));
                      }}
                      className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Medical Center <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={appt.medical_center_id}
                        onValueChange={(val) => {
                          const newAppts = [...formData.appointments];
                          newAppts[index].medical_center_id = val;
                          setFormData(p => ({ ...p, appointments: newAppts }));
                        }}
                        required
                      >
                        <SelectTrigger className="bg-white">
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
                        Examination Date <span className="text-red-500">*</span>
                      </label>
                      <div className='relative'>
                        <Input
                          type='date'
                          value={appt.medical_date}
                          onChange={(e) => {
                            const newAppts = [...formData.appointments];
                            newAppts[index].medical_date = e.target.value;
                            setFormData(p => ({ ...p, appointments: newAppts }));
                          }}
                          className='pl-10 bg-white'
                          required
                        />
                        <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none' />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Examination Time <span className="text-red-500">*</span>
                      </label>
                      <div className='relative'>
                        <Activity className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none' />
                        <Input
                          type='time'
                          value={appt.medical_time}
                          onChange={(e) => {
                            const newAppts = [...formData.appointments];
                            newAppts[index].medical_time = e.target.value;
                            setFormData(p => ({ ...p, appointments: newAppts }));
                          }}
                          className='pl-10 bg-white'
                          required
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Medical Reports
                      </label>
                      <MultiSelectDropdown
                        options={medicalReports.map(r => ({ label: r.name, value: r.id }))}
                        value={appt.medical_reports}
                        onChange={(val) => {
                          const newAppts = [...formData.appointments];
                          newAppts[index].medical_reports = val;
                          setFormData(p => ({ ...p, appointments: newAppts }));
                        }}
                        placeholder="Select medical reports"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(p => ({
                    ...p,
                    appointments: [
                      ...p.appointments,
                      { medical_date: new Date().toISOString().split('T')[0], medical_time: '', medical_center_id: '', medical_reports: [] }
                    ]
                  }));
                }}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" /> Add More Appointments
              </Button>
            </div>
          </div>

          {assignedReports.length > 0 && (
            <div className='space-y-4 rounded-xl border border-blue-100 bg-blue-50/30 p-6'>
              <h3 className='text-sm font-bold uppercase tracking-wider text-blue-800'>
                Individual Report Outcomes
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {assignedReports.map((report) => {
                  const resultIdx = formData.report_results.findIndex(r => String(r.report_id) === String(report.id));
                  const result = resultIdx >= 0 ? formData.report_results[resultIdx] : { status: 'pending', remarks: '' };

                  return (
                    <div key={report.id} className='rounded-lg border border-white bg-white/60 p-4 shadow-sm'>
                      <label className='text-sm font-medium text-slate-800 mb-2 block'>
                        {report.name}
                      </label>
                      <Select
                        value={result.status}
                        onValueChange={(val) => {
                          const newResults = [...formData.report_results];
                          if (resultIdx >= 0) {
                            newResults[resultIdx] = { ...newResults[resultIdx], status: val };
                          } else {
                            newResults.push({ report_id: report.id, status: val, remarks: '' });
                          }
                          setFormData(p => ({ ...p, report_results: newResults }));
                        }}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='pending'>Pending</SelectItem>
                          <SelectItem value='pass'>Pass</SelectItem>
                          <SelectItem value='fail'>Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className='space-y-2'>
            {' '}
            <label className='text-sm font-medium text-gray-700'>
              Upload Medical Report
            </label>
            <Input
              type='file'
              multiple
              onChange={handleFileChange}
              className='cursor-pointer rounded-xl bg-gray-50'
              accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
            />
            {reportFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">New Reports to Upload:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {reportFiles.map((file, i) => {
                    const isImage = file.type.startsWith('image/');
                    const fileUrl = isImage ? URL.createObjectURL(file) : null;
                    return (
                      <div key={i} className="group relative flex flex-col items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all h-36">
                        {isImage ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                            <img src={fileUrl} alt={file.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                            <FileText size={32} />
                          </div>
                        )}
                        <span className="text-xs text-gray-600 truncate w-full text-center mt-2" title={file.name}>
                          {file.name}
                        </span>
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                          {isImage && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                              title="View File"
                            >
                              <Eye size={18} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setReportFiles(p => p.filter((_, idx) => idx !== i))}
                            className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                            title="Remove File"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {existingFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Previously Uploaded Reports:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {existingFiles.map((file, i) => {
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.file_name);
                    const fileUrl = `${process.env.REACT_APP_API_URL?.replace('/api', '') || ''}${file.file_path}`;
                    return (
                      <div key={i} className="group relative flex flex-col items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all h-36">
                        {isImage ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                            <img src={fileUrl} alt={file.file_name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                            <FileText size={32} />
                          </div>
                        )}
                        <span className="text-xs text-gray-600 truncate w-full text-center mt-2" title={file.file_name}>
                          {file.file_name}
                        </span>
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                            title="View File"
                          >
                            <Eye size={18} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
            <p className='text-xs text-slate-500'>
              Cadets marked `Pass` move to the selected stage. Cadets marked `Fail` stop here.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Final Decision
              </label>
              <Select
                value={formData.final_decision}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, final_decision: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select final decision' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='pass'>Pass</SelectItem>
                  <SelectItem value='fail'>Fail</SelectItem>
                  <SelectItem value='retest'>Retest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.final_decision === 'retest' && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Medical Reports for Retest
                </label>
                <div className='flex items-center gap-3'>
                  <div className='flex-1'>
                    <MultiSelectDropdown
                      options={medicalReports.map(r => ({ label: r.name, value: r.id }))}
                      value={formData.retest_reports}
                      onChange={(val) => setFormData(p => ({ ...p, retest_reports: val }))}
                      placeholder="Select reports"
                    />
                  </div>
                  <Button
                    type='button'
                    className='bg-orange-600 hover:bg-orange-700 text-white shrink-0 h-[40px]'
                    onClick={handleRetestClick}
                  >
                    <MessageSquare className='w-4 h-4 mr-2' />
                    Retest Action
                  </Button>
                </div>
              </div>
            )}
          </div>

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
              Save Medical Result
            </Button>
          </div>
        </form>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          saveMedicalResult();
        }}
        title="Pending Institute Details"
        message={`Cadet ${cadet?.name_as_in_indos_cert}'s institute details are pending. Do you want to proceed and save the medical result anyway?`}
        confirmText="Yes"
        cancelText="No"
      />

      <StageInviteModal
        isOpen={showRetestModal}
        onClose={() => setShowRetestModal(false)}
        onSubmit={handleSendRetestInvite}
        title="Send Retest Invites"
        description="Set the medical center, appointment schedule, and remarks for the retest."
        cadets={cadet ? [cadet] : []}
        loading={sendingRetest}
        fields={[
          {
            key: "appointments",
            label: "Appointments",
            type: "repeater",
            addLabel: "Appointment",
            subFields: [
              {
                key: "medical_date",
                label: "Medical Date",
                type: "date",
                required: true,
              },
              {
                key: "medical_time",
                label: "Medical Time",
                type: "time",
                required: true,
              },
              {
                key: "medical_center_id",
                label: "Medical Center",
                type: "select",
                required: true,
                options: medicalCenterOptions,
                placeholder: "Select medical center",
              },
              {
                key: "medical_reports",
                label: "Medical Reports",
                type: "multiselect",
                required: true,
                getOptions: (block) => {
                  const selectedCenter = medicalCenters.find(c => String(c.id) === String(block.medical_center_id));
                  let centerReportIds = [];
                  if (selectedCenter && selectedCenter.medical_reports) {
                    try {
                      centerReportIds = typeof selectedCenter.medical_reports === 'string'
                        ? JSON.parse(selectedCenter.medical_reports)
                        : selectedCenter.medical_reports;
                    } catch (e) {
                      console.error("Error parsing medical reports from center:", e);
                    }
                  }
                  return medicalReports
                    .filter(r => centerReportIds.includes(r.id) || centerReportIds.includes(String(r.id)))
                    .map(r => ({ label: r.name, value: r.id }));
                },
                placeholder: "Select medical reports",
              }
            ]
          },
          {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Add medical instructions or remarks",
          },
        ]}
      />
    </div>
  );
};

export default MedicalResultForm;
