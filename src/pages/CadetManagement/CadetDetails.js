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
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import CadetFormFields from '../../components/cadet/CadetFormFields';
import { useAuth } from '../../context/AuthContext';
import { getPrefixRoute } from '../../lib/utils/routeUtils';

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
  const fileInputRef = React.useRef(null);

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
    if (location.state?.editMode) {
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
  }, [location, navigate]);

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

        // Format dates for form
        const formData = { ...data };
        ['date_of_birth', 'passing_out_date'].forEach((field) => {
          if (formData[field]) {
            const date = new Date(formData[field]);
            if (!isNaN(date.getTime())) {
              // Convert to local YYYY-MM-DD format for HTML date input
              const localDateString = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
              const parts = localDateString.split('/');
              if (parts.length === 3) {
                formData[field] = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else {
                formData[field] = '';
              }
            } else {
              console.warn(`Invalid date for field ${field}:`, formData[field]);
              formData[field] = '';
            }
          }
        });

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
    try {
      let payload = { ...data };
      delete payload.declaration_accepted;

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
      toast.error('Failed to update cadet');
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
      <div className='flex items-center justify-center min-h-[500px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4'
    >
      {/* Header */}
      <div className='flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
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
          className='rounded-full hover:bg-gray-100'
        >
          <ArrowLeft size={24} className='text-gray-600' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Cadet Details</h1>
          <p className='text-gray-500 text-sm'>
            {isEditing
              ? `Editing ${cadet.name_as_in_indos_cert}`
              : `View full information about ${cadet.name_as_in_indos_cert}`}
          </p>
        </div>
        <div className='ml-auto flex gap-2'>
          {isEditing ? (
            <>
              <Button
                type='button'
                variant='outline'
                onClick={cancelEdit}
                className='gap-2'
                disabled={isSubmitting}
              >
                <X size={16} /> Cancel
              </Button>
              <Button
                type='submit'
                className='gap-2 bg-blue-600 hover:bg-blue-700 text-white'
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
          ) : (
            <Button
              type='button'
              onClick={() => setIsEditing(true)}
              className='gap-2'
            >
              <FileText size={16} /> Edit Cadet
            </Button>
          )}
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
        <div className='space-y-8'>
          {/* Photo Section */}
          <div className='bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center gap-6'>
            <div className='relative group'>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileChange}
                accept='image/*'
                className='hidden'
              />
              <div
                className={`w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center relative ${
                  isEditing ? 'cursor-pointer' : ''
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
                  <ImageIcon size={48} className='text-gray-400' />
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
            <div className='flex-1 text-center md:text-left'>
              <h3 className='text-xl font-bold text-gray-800'>
                {cadet.name_as_in_indos_cert}
              </h3>
              <p className='text-gray-500 font-medium'>
                {cadet.course || 'Course not specified'}
              </p>
              <div className='flex flex-wrap gap-2 mt-3 justify-center md:justify-start'>
                {cadet.contact_number && (
                  <span className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100'>
                    Mobile: {cadet.contact_number}
                  </span>
                )}
                {cadet.institute_name && (
                  <span className='px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100'>
                    Institute: {cadet.institute_name}
                  </span>
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
          />
        </div>
      </div>
    </form>
  );
};

export default CadetDetails;
