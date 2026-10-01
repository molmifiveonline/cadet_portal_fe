import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  Camera,
  Image as ImageIcon,
  UserPlus
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import CadetFormFields from '../../components/cadet/CadetFormFields';
import api from '../../lib/utils/apiConfig';
import { sanitizePhoneValue } from '../../lib/utils/validationUtils';

const AddCadetForm = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

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
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let payload = { ...data };
      delete payload.declaration_accepted;
      if (payload.contact_number !== undefined) {
        payload.contact_number = sanitizePhoneValue(payload.contact_number);
      }

      let headers = {};

      if (selectedFile) {
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          if (
            payload[key] !== null &&
            payload[key] !== undefined &&
            payload[key] !== ''
          ) {
            formData.append(key, payload[key]);
          }
        });
        formData.append('photo', selectedFile);
        payload = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      await api.post('/cadets', payload, { headers });
      toast.success('Cadet added successfully');
      navigate('/cadets'); // Navigate back to the list
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to add cadet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className='py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4'
    >
      {/* Header */}
      <PageHeader
        title="Add New Cadet"
        subtitle="Enter details to register a new cadet"
        icon={UserPlus}
        backButton={
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={() => navigate('/cadets')}
            className='rounded-full hover:bg-gray-100'
          >
            <ArrowLeft size={24} className='text-gray-600' />
          </Button>
        }
      >
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/cadets')}
            className='gap-2'
            disabled={loading}
          >
            <X size={16} /> Cancel
          </Button>
          <Button
            type='submit'
            className='gap-2 bg-blue-600 hover:bg-blue-700 text-white'
            disabled={loading}
          >
            {loading ? (
              <Loader2 className='animate-spin' size={16} />
            ) : (
              <Save size={16} />
            )}
            Save Cadet
          </Button>
        </div>
      </PageHeader>

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
                className={`w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center relative cursor-pointer`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt='Preview'
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://via.placeholder.com/150?text=No+Image';
                    }}
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
              <h3 className='text-xl font-bold text-gray-800'>Cadet Photo</h3>
              <p className='text-gray-500 font-medium'>
                Upload a recent passport size photograph
              </p>
            </div>
          </div>

          {/* Common Fields */}
          <CadetFormFields
            isEditing={true}
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={loading}
          />
        </div>
      </div>
    </form>
  );
};

export default AddCadetForm;
