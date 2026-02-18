import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  MapPin,
  Hash,
  School,
  Percent,
  Book,
  Activity,
  Award,
  Ruler,
  Weight,
  Eye,
  Syringe,
  Home,
  Briefcase,
  Globe,
  Image as ImageIcon,
  FileText,
  Save,
  X,
  Loader2,
  Camera,
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import SectionTitle from '../../components/common/SectionTitle';
import SharedDetailItem from '../../components/common/DetailItem';

const CadetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cadet, setCadet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = React.useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    // Check if we should start in edit mode
    if (location.state?.editMode) {
      setIsEditing(true);
      // Clear state so refresh doesn't keep it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchCadetDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/cadets/${id}`);
        const data = response.data.data || response.data;
        setCadet(data);

        // Format dates for form
        const formData = { ...data };
        ['dob', 'passing_out_date'].forEach((field) => {
          if (formData[field]) {
            const date = new Date(formData[field]);
            if (!isNaN(date.getTime())) {
              formData[field] = date.toISOString().split('T')[0];
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
        navigate('/cadets');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCadetDetails();
    }
  }, [id, navigate, reset]);

  const onSubmit = async (data) => {
    try {
      let payload = data;
      let headers = {};

      if (selectedFile) {
        const formData = new FormData();
        // Append all data fields
        Object.keys(data).forEach((key) => {
          if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
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
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[500px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  // Wrapper to inject form props
  const DetailItem = (props) => (
    <SharedDetailItem
      {...props}
      isEditing={isEditing}
      register={register}
      errors={errors}
    />
  );

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
          onClick={() => navigate('/cadets')}
          className='rounded-full hover:bg-gray-100'
        >
          <ArrowLeft size={24} className='text-gray-600' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Cadet Details</h1>
          <p className='text-gray-500 text-sm'>
            {isEditing
              ? `Editing ${cadet.name}`
              : `View full information about ${cadet.name}`}
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
                {previewUrl || cadet.photo_path ? (
                  <img
                    src={previewUrl || cadet.photo_path}
                    alt={cadet.name}
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

                {isEditing && (
                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    <Camera className='text-white w-8 h-8' />
                  </div>
                )}
              </div>
            </div>
            <div className='flex-1 text-center md:text-left'>
              <h3 className='text-xl font-bold text-gray-800'>{cadet.name}</h3>
              <p className='text-gray-500 font-medium'>
                {cadet.course || 'Course not specified'}
              </p>
              <div className='flex flex-wrap gap-2 mt-3 justify-center md:justify-start'>
                {cadet.phone && (
                  <span className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100'>
                    Mobile: {cadet.phone}
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
          <div>
            <SectionTitle title='Personal Information' icon={User} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem
                label='Full Name'
                value={cadet.name}
                name='name'
                required
                icon={User}
              />
              <DetailItem
                label='Email'
                value={cadet.email}
                name='email'
                type='email'
                required
                icon={Mail}
              />
              <DetailItem
                label='Phone'
                value={cadet.phone}
                name='phone'
                required
                icon={Phone}
              />
              <DetailItem
                label='Gender'
                value={cadet.gender}
                name='gender'
                icon={User}
              />
              <DetailItem
                label='Date of Birth'
                value={
                  cadet.dob ? new Date(cadet.dob).toLocaleDateString() : '-'
                }
                name='dob'
                type='date'
                icon={Calendar}
              />
              <DetailItem
                label='Hometown'
                value={cadet.hometown}
                name='hometown'
                icon={MapPin}
              />
              <DetailItem
                label='Nationality'
                value={cadet.nationality}
                name='nationality'
                icon={Globe}
              />
              <DetailItem
                label='Blood Group'
                value={cadet.blood_group}
                name='blood_group'
                icon={Activity}
              />
            </div>
          </div>

          {/* Physical Details */}
          <div>
            <SectionTitle title='Physical Details' icon={Activity} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem
                label='Height (cm)'
                value={cadet.height ? `${cadet.height} cm` : '-'}
                name='height'
                type='float'
                icon={Ruler}
              />
              <DetailItem
                label='Weight (kg)'
                value={cadet.weight ? `${cadet.weight} kg` : '-'}
                name='weight'
                type='float'
                icon={Weight}
              />
              <DetailItem
                label='Waist (cm)'
                value={cadet.waist_in_cm ? `${cadet.waist_in_cm} cm` : '-'}
                name='waist_in_cm'
                type='float'
                icon={Ruler}
              />
              <DetailItem
                label='BMI'
                value={cadet.bmi}
                name='bmi'
                type='float'
                icon={Activity}
              />
              <DetailItem
                label='Eye Color'
                value={cadet.eye_color}
                name='eye_color'
                icon={Eye}
              />
              <DetailItem
                label='Eye Vision'
                value={cadet.eye_vision}
                name='eye_vision'
                icon={Eye}
              />
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <SectionTitle title='Medical Information' icon={Syringe} />
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <DetailItem
                label='COVID Vaccination'
                value={cadet.covid_vaccination}
                name='covid_vaccination'
                icon={Syringe}
              />
              <DetailItem
                label='COVID Dose'
                value={cadet.covid_dose}
                name='covid_dose'
                icon={Syringe}
              />
              <DetailItem
                label='Medical History'
                value={cadet.medical_history}
                name='medical_history'
                icon={Activity}
              />
              <DetailItem
                label='Family Medical History'
                value={cadet.family_medical_history}
                name='family_medical_history'
                icon={Activity}
              />
            </div>
          </div>

          {/* Documents */}
          <div>
            <SectionTitle title='Documents & IDs' icon={Hash} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem
                label='INDoS Number'
                value={cadet.indos_number}
                name='indos_number'
                icon={Hash}
              />
              <DetailItem
                label='CDC Number'
                value={cadet.cdc_number}
                name='cdc_number'
                icon={Hash}
              />
              <DetailItem
                label='Passport Number'
                value={cadet.passport_number}
                name='passport_number'
                icon={Hash}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* 10th Standard */}
            <div>
              <SectionTitle title='10th Standard' icon={School} />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem
                  label='Board'
                  value={cadet.tenth_board}
                  name='tenth_board'
                  icon={School}
                />
                <DetailItem
                  label='Year'
                  value={cadet.tenth_year}
                  name='tenth_year'
                  type='number'
                  icon={Calendar}
                />
                <DetailItem
                  label='Percentage'
                  value={
                    cadet.tenth_percentage ? `${cadet.tenth_percentage}%` : '-'
                  }
                  name='tenth_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Maths'
                  value={cadet.tenth_maths ? `${cadet.tenth_maths}%` : '-'}
                  name='tenth_maths'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Science'
                  value={cadet.tenth_science ? `${cadet.tenth_science}%` : '-'}
                  name='tenth_science'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='English'
                  value={cadet.tenth_english ? `${cadet.tenth_english}%` : '-'}
                  name='tenth_english'
                  type='float'
                  icon={Percent}
                />
              </div>
            </div>

            {/* 12th Standard */}
            <div>
              <SectionTitle title='12th Standard' icon={School} />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem
                  label='Board'
                  value={cadet.twelfth_board}
                  name='twelfth_board'
                  icon={School}
                />
                <DetailItem
                  label='Year'
                  value={cadet.twelfth_year}
                  name='twelfth_year'
                  type='number'
                  icon={Calendar}
                />
                <DetailItem
                  label='Percentage'
                  value={
                    cadet.twelfth_percentage
                      ? `${cadet.twelfth_percentage}%`
                      : '-'
                  }
                  name='twelfth_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='PCM %'
                  value={
                    cadet.pcm_percentage ? `${cadet.pcm_percentage}%` : '-'
                  }
                  name='pcm_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Maths'
                  value={cadet.twelfth_maths ? `${cadet.twelfth_maths}%` : '-'}
                  name='twelfth_maths'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Physics'
                  value={
                    cadet.twelfth_physics ? `${cadet.twelfth_physics}%` : '-'
                  }
                  name='twelfth_physics'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Chemistry'
                  value={
                    cadet.twelfth_chemistry
                      ? `${cadet.twelfth_chemistry}%`
                      : '-'
                  }
                  name='twelfth_chemistry'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='English'
                  value={
                    cadet.twelfth_english ? `${cadet.twelfth_english}%` : '-'
                  }
                  name='twelfth_english'
                  type='float'
                  icon={Percent}
                />
              </div>
            </div>
          </div>

          {/* Higher Education & IMU */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Graduation */}
            <div>
              <SectionTitle title='Graduation / Degree' icon={Book} />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem
                  label='Course'
                  value={cadet.graduation_course || cadet.course}
                  name='graduation_course'
                  icon={Book}
                />
                <DetailItem
                  label='University'
                  value={cadet.graduation_university}
                  name='graduation_university'
                  icon={School}
                />
                <DetailItem
                  label='Percentage'
                  value={
                    cadet.degree_percentage
                      ? `${cadet.degree_percentage}%`
                      : '-'
                  }
                  name='degree_percentage'
                  type='float'
                  icon={Percent}
                />
              </div>
            </div>

            {/* IMU Details */}
            <div>
              <SectionTitle title='IMU Performance' icon={Award} />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem
                  label='IMU Rank'
                  value={cadet.imu_rank}
                  name='imu_rank'
                  type='number'
                  icon={Award}
                />
                <DetailItem
                  label='Avg %'
                  value={
                    cadet.imu_avg_percentage
                      ? `${cadet.imu_avg_percentage}%`
                      : '-'
                  }
                  name='imu_avg_percentage'
                  type='float'
                  icon={Percent}
                />
              </div>
            </div>
          </div>

          {/* Course & Training */}
          <div>
            <SectionTitle title='Course & Training Details' icon={Briefcase} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem
                label='Batch'
                value={cadet.batch}
                name='batch'
                icon={Hash}
              />
              <DetailItem
                label='Batch Rank'
                value={cadet.batch_rank}
                name='batch_rank'
                icon={Award}
              />
              <DetailItem
                label='Arrears'
                value={cadet.no_of_arrears}
                name='no_of_arrears'
                type='number'
                icon={Book}
              />
              <DetailItem
                label='Passing Out Date'
                value={
                  cadet.passing_out_date
                    ? new Date(cadet.passing_out_date).toLocaleDateString()
                    : '-'
                }
                name='passing_out_date'
                type='date'
                icon={Calendar}
              />
              <DetailItem
                label='Age at Passing'
                value={cadet.age_at_passing_out}
                name='age_at_passing_out'
                type='number'
                icon={User}
              />
              <DetailItem
                label='Post Applied For'
                value={cadet.post_applied_for}
                name='post_applied_for'
                icon={Briefcase}
              />
            </div>
          </div>

          {/* Family & Additional */}
          <div>
            <SectionTitle title='Family & Additional Info' icon={Home} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem
                label="Father's Occupation"
                value={cadet.father_occupation}
                name='father_occupation'
                icon={Briefcase}
              />
              <DetailItem
                label="Mother's Occupation"
                value={cadet.mother_occupation}
                name='mother_occupation'
                icon={Briefcase}
              />
              <DetailItem
                label='Languages'
                value={cadet.language_known}
                name='language_known'
                icon={Globe}
              />
              <DetailItem
                label='Loan'
                value={cadet.educational_loan}
                name='educational_loan'
                icon={FileText}
              />
              <DetailItem
                label='Extra Curricular'
                value={cadet.extra_curricular}
                name='extra_curricular'
                icon={Activity}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <SectionTitle title='Address' icon={MapPin} />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 bg-gray-50 rounded-lg border border-gray-100'>
                <h4 className='font-semibold text-gray-700 mb-2'>
                  Current Address
                </h4>
                {isEditing ? (
                  <textarea
                    {...register('address')}
                    className='w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all'
                    rows={3}
                  />
                ) : (
                  <p className='text-gray-600 text-sm whitespace-pre-wrap'>
                    {cadet.address || '-'}
                  </p>
                )}
              </div>
              <div className='p-4 bg-gray-50 rounded-lg border border-gray-100'>
                <h4 className='font-semibold text-gray-700 mb-2'>
                  Permanent Address
                </h4>
                {isEditing ? (
                  <textarea
                    {...register('permanent_address')}
                    className='w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all'
                    rows={3}
                  />
                ) : (
                  <p className='text-gray-600 text-sm whitespace-pre-wrap'>
                    {cadet.permanent_address || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CadetDetails;
