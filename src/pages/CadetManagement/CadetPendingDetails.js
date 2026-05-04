import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Save,
  X,
  Loader2,
  ClipboardList
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { formatDateForInput } from '../../lib/utils/dateUtils';
import CadetFormFields from '../../components/cadet/CadetFormFields';
import { useAuth } from '../../context/AuthContext';
import { getPrefixRoute } from '../../lib/utils/routeUtils';

const CadetPendingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cadet, setCadet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = React.useRef(null);

  const [returnPath] = useState(location.state?.returnPath || null);
  const [returnStatePayload] = useState(location.state?.returnState || null);

  // Default back path based on user role/intent
  const defaultBackPath = getPrefixRoute(user) || '/institute/shortlisted-cadets';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

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
            formData[field] = formatDateForInput(formData[field]);
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
      toast.success('Cadet details updated successfully');

      // Navigate back to the list
      if (returnPath) {
        navigate(returnPath, { state: { returnState: returnStatePayload } });
      } else {
        navigate(defaultBackPath);
      }
    } catch (error) {
      console.error('Error updating cadet:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update cadet details',
      );
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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[500px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='py-6 px-4 md:px-8 bg-slate-50 min-h-screen'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4'
      >
        {/* Header */}
        <PageHeader
          title="Fill Pending Details"
          subtitle={`Complete the profile for ${cadet.name_as_in_indos_cert}`}
          icon={ClipboardList}
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
                  navigate(defaultBackPath);
                }
              }}
              className='rounded-full hover:bg-gray-100'
            >
              <ArrowLeft size={24} className='text-gray-600' />
            </Button>
          }
        >
          <div className='flex gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate(defaultBackPath)}
              className='gap-2 rounded-xl border-gray-200'
              disabled={isSubmitting}
            >
              <X size={16} /> Cancel
            </Button>
            <Button
              type='submit'
              className='gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className='animate-spin' size={16} />
              ) : (
                <Save size={16} />
              )}
              Save Details
            </Button>
          </div>
        </PageHeader>

        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
          <div className='space-y-8'>
            {/* Photo Section */}
            <div className='bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center gap-6 mb-8'>
              <div className='relative group'>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept='image/*'
                  className='hidden'
                />
                <div
                  className='w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center relative cursor-pointer'
                  onClick={() => fileInputRef.current?.click()}
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
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <ImageIcon size={48} className='text-gray-400' />
                  )}

                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    <Camera className='text-white w-8 h-8' />
                  </div>
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
                  {cadet.cadet_unique_id && (
                    <span className='px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100'>
                      ID: {cadet.cadet_unique_id}
                    </span>
                  )}
                  {cadet.contact_number && (
                    <span className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100'>
                      {cadet.contact_number}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reusing existing form fields */}
            <CadetFormFields
              cadet={cadet}
              isEditing={true}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isSubmitting={isSubmitting}
              user={user}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadetPendingDetails;
