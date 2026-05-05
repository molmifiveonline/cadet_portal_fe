import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  FileText,
  Save,
  X,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import CadetFormFields from '../../components/cadet/CadetFormFields';
import { useAuth } from '../../context/AuthContext';
import { getPrefixRoute } from '../../lib/utils/routeUtils';
import { formatDateForInput } from '../../lib/utils/dateUtils';
import PageHeader from '../../components/common/PageHeader';
import { sanitizePhoneValue } from '../../lib/utils/validationUtils';

import StageTracker from '../../components/common/StageTracker';

const CadetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cadet, setCadet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [stageData, setStageData] = useState({
    interview: null,
    medical: null,
    assessment: null
  });
  const fileInputRef = React.useRef(null);
  const isInstituteUser = user?.role === 'Institute';

  const [returnPath] = useState(location.state?.returnPath || null);
  const [returnStatePayload] = useState(location.state?.returnState || null);

  // Default back path based on user role/intent
  const defaultBackPath = getPrefixRoute(user) || '/cadets';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    // Check if we should start in edit mode
    if (location.state?.editMode && !isInstituteUser) {
      setIsEditing(true);
      // Clear editMode so refresh doesn't keep it, but keep return routing
      navigate(location.pathname, {
        replace: true,
        state: {
          returnPath: location.state?.returnPath,
          returnState: location.state?.returnState,
        },
      });
    }
  }, [isInstituteUser, location, navigate]);

  useEffect(() => {
    setImageError(false);
  }, [cadet?.photo_path, previewUrl]);

  useEffect(() => {
    const fetchCadetDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/cadets/${id}`);
        const data = response.data.data || response.data;
        setCadet(data);
        setImageError(false);

        // Fetch additional stage data
        try {
          const [intRes, medRes, assRes] = await Promise.all([
            api.get(`/interviews/${id}`).catch(() => ({ data: { data: null } })),
            api.get(`/medical-results/${id}`).catch(() => ({ data: { data: null } })),
            api.get(`/assessments/${id}`).catch(() => ({ data: { data: null } }))
          ]);
          setStageData({
            interview: intRes.data.data,
            medical: medRes.data.data,
            assessment: assRes.data.data
          });
        } catch (err) {
          console.error('Error fetching stage data:', err);
        }

        // Format dates for form
        const formData = {
          ...data,
          date_of_birth: formatDateForInput(data.date_of_birth),
          passing_out_date: formatDateForInput(data.passing_out_date)
        };

        reset(formData);
      } catch (error) {
        console.error('Error fetching cadet details:', error);
        toast.error('Failed to load cadet details');
        if (returnPath) {
          navigate(returnPath, { state: { returnState: returnStatePayload } });
        } else {
          navigate(defaultBackPath);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCadetDetails();
    }
  }, [id, navigate, reset, returnPath, returnStatePayload, defaultBackPath]);

  const onSubmit = async (data) => {
    if (isInstituteUser) {
      toast.error('Institute users can view cadet details only');
      return;
    }

    try {
      let payload = { ...data };
      delete payload.declaration_accepted;
      if (payload.contact_number !== undefined) {
        payload.contact_number = sanitizePhoneValue(payload.contact_number);
      }

      let headers = {};

      if (selectedFile) {
        const formData = new FormData();
        // Append all data fields from sanitized payload
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formData.append(key, payload[key]);
          }
        });

        formData.append('photo', selectedFile);
        payload = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      await api.put(`/cadets/${id}`, payload, { headers });
      toast.success('Cadet updated successfully');

      // Refresh cadet data to get the new photo URL
      const response = await api.get(`/cadets/${id}`);
      setCadet(response.data.data || response.data);
      setImageError(false);

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error updating cadet:', error);
      toast.error(error.response?.data?.message || 'Failed to update cadet');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Image size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setPhotoError(null);
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setImageError(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError(null);
    setImageError(false);
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[500px] space-y-4'>
        <div className='relative w-16 h-16'>
          <div className='absolute inset-0 rounded-full border-4 border-indigo-100'></div>
          <div className='absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin'></div>
        </div>
        <p className='text-gray-500 font-medium animate-pulse'>Loading Cadet Profile...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className='py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4'
    >
      {/* Header */}
      <PageHeader
        title={
          <div className='flex items-center gap-3'>
            <span>Cadet Profile</span>
            {cadet.cadet_unique_id && (
              <span className='px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-sm uppercase'>
                {cadet.cadet_unique_id}
              </span>
            )}
          </div>
        }
        subtitle={isEditing
          ? `Update details for ${cadet.name_as_in_indos_cert}`
          : `Viewing comprehensive profile for ${cadet.name_as_in_indos_cert}`}
        icon={GraduationCap}
        backButton={
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={() => {
              if (returnPath) {
                navigate(returnPath, {
                  state: { returnState: returnStatePayload },
                });
              } else {
                navigate(-1);
              }
            }}
            className='rounded-full hover:bg-white hover:shadow-md transition-all'
          >
            <ArrowLeft size={24} className='text-gray-600' />
          </Button>
        }
      >
        <div className='flex gap-3'>
          {isEditing ? (
            <>
              <Button
                type='button'
                variant='outline'
                onClick={cancelEdit}
                className='gap-2 rounded-xl border-gray-200 hover:bg-gray-50 font-semibold'
                disabled={isSubmitting}
              >
                <X size={16} /> Cancel
              </Button>
              <Button
                type='submit'
                className='gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl shadow-lg shadow-indigo-100 font-semibold transition-all'
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className='animate-spin' size={16} />
                ) : (
                  <Save size={16} />
                )}
                Save Changes
              </Button>
            </>
          ) : !isInstituteUser ? (
            <Button
              type='button'
              onClick={() => setIsEditing(true)}
              className='gap-2 bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-6 rounded-xl shadow-sm font-semibold transition-all'
            >
              <FileText size={16} /> Edit Profile
            </Button>
          ) : null}
        </div>
      </PageHeader>

      {/* Stage Tracker - Only for Admins */}
      {user?.role?.toLowerCase() === 'superadmin' && (
        <div className='bg-white rounded-[2rem] shadow-md border border-gray-100 p-8 animate-in fade-in slide-in-from-top-4 duration-500'>
          <h2 className='text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 px-4'>Profile Progress</h2>
          <StageTracker currentStage={cadet.status} />
        </div>
      )}

      <div className='bg-white rounded-[2rem] shadow-xl shadow-indigo-100/20 border border-gray-100 p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150'>
        <div className='space-y-8'>
          {/* Photo Section */}
          <div className='bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-8 shadow-sm'>
            <div className='relative group'>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileChange}
                accept='image/*'
                className='hidden'
              />
              <div
                className={`w-36 h-36 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center relative transition-transform duration-300 ${
                  isEditing ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                }`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {(previewUrl || cadet.photo_path) && !imageError ? (
                  <img
                    src={
                      previewUrl ||
                      (cadet.photo_path
                        ? `${
                            cadet.photo_path.includes('?')
                              ? cadet.photo_path + '&'
                              : cadet.photo_path + '?'
                          }t=${new Date().getTime()}`
                        : '')
                    }
                    alt={cadet.name_as_in_indos_cert}
                    className='w-full h-full object-cover'
                    onError={() => {
                      console.error('Image load failed:', cadet.photo_path);
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div className='flex flex-col items-center gap-2'>
                    <ImageIcon size={40} className='text-gray-300' />
                    <span className='text-[10px] text-gray-400 font-bold uppercase'>No Photo</span>
                  </div>
                )}

                {isEditing && (
                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    <Camera className='text-white w-8 h-8' />
                  </div>
                )}
              </div>
              {photoError && (
                <p className='text-red-500 text-sm font-medium mt-2 text-center absolute -bottom-6 w-full whitespace-nowrap'>
                  {photoError}
                </p>
              )}
            </div>
            <div className='flex-1 text-center md:text-left space-y-2'>
              <div className='space-y-1'>
                <h3 className='text-2xl font-black text-gray-900 leading-tight'>
                  {cadet.name_as_in_indos_cert}
                </h3>
                <div className='flex items-center justify-center md:justify-start gap-2'>
                   <span className='px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded tracking-wider'>
                      {cadet.course || 'Course Not Specified'}
                   </span>
                   {cadet.status && (
                     <span className='px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded tracking-wider border border-emerald-100'>
                        {cadet.status}
                     </span>
                   )}
                </div>
              </div>
              
              <div className='flex flex-wrap gap-3 mt-4 justify-center md:justify-start'>
                {cadet.contact_number && (
                  <div className='flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-100 shadow-sm'>
                    <div className='w-2 h-2 rounded-full bg-blue-400'></div>
                    {cadet.contact_number}
                  </div>
                )}
                {cadet.institute_name && (
                  <div className='flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-100 shadow-sm'>
                    <div className='w-2 h-2 rounded-full bg-purple-400'></div>
                    {cadet.institute_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          {/* Common Fields */}
          <CadetFormFields
            cadet={cadet}
            isEditing={isEditing}
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={isSubmitting}
            interviewData={stageData.interview}
            medicalData={stageData.medical}
            assessmentData={stageData.assessment}
            user={user}
          />
        </div>
      </div>
    </form>
  );
};

export default CadetDetails;
