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
  const fileInputRef = React.useRef(null);

  const [returnPath] = useState(location.state?.returnPath || null);
  const [returnStatePayload] = useState(location.state?.returnState || null);

  // Default back path based on user role/intent
  const defaultBackPath = getPrefixRoute(user) || '/cadets';

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
    const fetchCadetDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/cadets/${id}`);
        const data = response.data.data || response.data;
        setCadet(data);

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

  const cancelEdit = () => {
    setIsEditing(false);
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError(null);
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
                {previewUrl || cadet.photo_path ? (
                  <img
                    src={previewUrl || cadet.photo_path}
                    alt={cadet.name_as_in_indos_cert}
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
          <div>
            <SectionTitle title='Personal Information' icon={User} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem
                label='Full Name'
                value={cadet.name_as_in_indos_cert}
                name='name_as_in_indos_cert'
                required
                icon={User}
              />
              <DetailItem
                label='Email'
                value={cadet.email_id}
                name='email_id'
                type='email_id'
                required
                icon={Mail}
              />
              <DetailItem
                label='Phone'
                value={cadet.contact_number}
                name='contact_number'
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
                  cadet.date_of_birth
                    ? new Date(cadet.date_of_birth).toLocaleDateString('en-GB')
                    : '-'
                }
                name='date_of_birth'
                type='date'
                icon={Calendar}
              />
              <DetailItem
                label='Hometown'
                value={cadet.home_town_or_nearby_airport}
                name='home_town_or_nearby_airport'
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
                value={cadet.height_in_cms ? `${cadet.height_in_cms} cm` : '-'}
                name='height_in_cms'
                type='float'
                icon={Ruler}
              />
              <DetailItem
                label='Weight (kg)'
                value={cadet.weight_in_kgs ? `${cadet.weight_in_kgs} kg` : '-'}
                name='weight_in_kgs'
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
                  value={cadet.tenth_std_board}
                  name='tenth_std_board'
                  icon={School}
                />
                <DetailItem
                  label='Year'
                  value={cadet.tenth_std_pass_out_year}
                  name='tenth_std_pass_out_year'
                  type='text'
                  icon={Calendar}
                />
                <DetailItem
                  label='Percentage'
                  value={
                    cadet.tenth_avg_percentage
                      ? `${cadet.tenth_avg_percentage}%`
                      : '-'
                  }
                  name='tenth_avg_percentage'
                  type='text'
                  icon={Percent}
                />
                <DetailItem
                  label='Maths'
                  value={
                    cadet.tenth_std_maths ? `${cadet.tenth_std_maths}%` : '-'
                  }
                  name='tenth_std_maths'
                  type='text'
                  icon={Percent}
                />
                <DetailItem
                  label='Science'
                  value={
                    cadet.tenth_std_science
                      ? `${cadet.tenth_std_science}%`
                      : '-'
                  }
                  name='tenth_std_science'
                  type='text'
                  icon={Percent}
                />
                <DetailItem
                  label='English'
                  value={
                    cadet.tenth_std_english
                      ? `${cadet.tenth_std_english}%`
                      : '-'
                  }
                  name='tenth_std_english'
                  type='text'
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
                  value={cadet.twelfth_std_board}
                  name='twelfth_std_board'
                  icon={School}
                />
                <DetailItem
                  label='Year'
                  value={cadet.twelfth_std_pass_out_year}
                  name='twelfth_std_pass_out_year'
                  type='text'
                  icon={Calendar}
                />
                {/* <DetailItem
                  label='Percentage'
                  value={
                    cadet.twelfth_pcm_avg_percentage
                      ? `${cadet.twelfth_pcm_avg_percentage}%`
                      : '-'
                  }
                  name='twelfth_pcm_avg_percentage'
                  type='text'
                  icon={Percent}
                /> */}
                <DetailItem
                  label='PCM %'
                  value={
                    cadet.twelfth_pcm_avg_percentage
                      ? `${cadet.twelfth_pcm_avg_percentage}%`
                      : '-'
                  }
                  name='twelfth_pcm_avg_percentage'
                  type='text'
                  icon={Percent}
                />
                <DetailItem
                  label='Maths'
                  value={
                    cadet.twelfth_std_maths
                      ? `${cadet.twelfth_std_maths}%`
                      : '-'
                  }
                  name='twelfth_std_maths'
                  type='text'
                  icon={Percent}
                />
                <DetailItem
                  label='Physics'
                  value={
                    cadet.twelfth_std_physics
                      ? `${cadet.twelfth_std_physics}%`
                      : '-'
                  }
                  name='twelfth_std_physics'
                  type='text'
                  icon={Percent}
                />
                <DetailItem
                  label='Chemistry'
                  value={
                    cadet.twelfth_std_chemistry
                      ? `${cadet.twelfth_std_chemistry}%`
                      : '-'
                  }
                  name='twelfth_std_chemistry'
                  type='text'
                  icon={Percent}
                />
                <DetailItem
                  label='English'
                  value={
                    cadet.twelfth_std_english
                      ? `${cadet.twelfth_std_english}%`
                      : '-'
                  }
                  name='twelfth_std_english'
                  type='text'
                  icon={Percent}
                />
              </div>
            </div>
          </div>

          {/* Education & IMU */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Graduation */}
            <div>
              <SectionTitle title='Graduation / Degree' icon={Book} />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem
                  label='University'
                  value={cadet.graduation_university}
                  name='graduation_university'
                  icon={School}
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
                  type='text'
                  icon={Award}
                />
                <DetailItem
                  label='Avg %'
                  value={
                    cadet.imu_avg_all_semester_percentage
                      ? `${cadet.imu_avg_all_semester_percentage}%`
                      : '-'
                  }
                  name='imu_avg_all_semester_percentage'
                  type='text'
                  icon={Percent}
                />
                {/* Semester Wise */}
                <DetailItem
                  label='Sem 1'
                  value={
                    cadet.imu_sem_1_percentage
                      ? `${cadet.imu_sem_1_percentage}%`
                      : '-'
                  }
                  name='imu_sem_1_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 2'
                  value={
                    cadet.imu_sem_2_percentage
                      ? `${cadet.imu_sem_2_percentage}%`
                      : '-'
                  }
                  name='imu_sem_2_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 3'
                  value={
                    cadet.imu_sem_3_percentage
                      ? `${cadet.imu_sem_3_percentage}%`
                      : '-'
                  }
                  name='imu_sem_3_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 4'
                  value={
                    cadet.imu_sem_4_percentage
                      ? `${cadet.imu_sem_4_percentage}%`
                      : '-'
                  }
                  name='imu_sem_4_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 5'
                  value={
                    cadet.imu_sem_5_percentage
                      ? `${cadet.imu_sem_5_percentage}%`
                      : '-'
                  }
                  name='imu_sem_5_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 6'
                  value={
                    cadet.imu_sem_6_percentage
                      ? `${cadet.imu_sem_6_percentage}%`
                      : '-'
                  }
                  name='imu_sem_6_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 7'
                  value={
                    cadet.imu_sem_7_percentage
                      ? `${cadet.imu_sem_7_percentage}%`
                      : '-'
                  }
                  name='imu_sem_7_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 8'
                  value={
                    cadet.imu_sem_8_percentage
                      ? `${cadet.imu_sem_8_percentage}%`
                      : '-'
                  }
                  name='imu_sem_8_percentage'
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
              {/* <DetailItem
                label='Batch'
                value={cadet.batch}
                name='batch'
                icon={Hash}
              /> */}
              <DetailItem
                label='Batch Rank'
                value={cadet.batch_rank_out_of_72_cadets}
                name='batch_rank_out_of_72_cadets'
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
                label='Passing Out Year'
                value={
                  cadet.passing_out_date
                    ? new Date(cadet.passing_out_date).toLocaleDateString(
                        'en-GB',
                      )
                    : '-'
                }
                name='passing_out_date'
                type='date'
                icon={Calendar}
              />
              <DetailItem
                label='Age at Passing'
                value={cadet.age_when_passing_out}
                name='age_when_passing_out'
                type='number'
                icon={User}
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
                label='Any Relative in Marine Field'
                value={cadet.marine_relative}
                name='marine_relative'
                icon={User}
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
                value={cadet.any_extra_curricular_achievement}
                name='any_extra_curricular_achievement'
                icon={Activity}
              />
            </div>
          </div>

          {/* STCW Courses */}
          <div>
            <SectionTitle title='STCW Courses' icon={Book} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <DetailItem
                label='Elementary/Medical First Aid/Medicare'
                value={cadet.stcw_elementary_first_aid}
                name='stcw_elementary_first_aid'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={Syringe}
              />
              <DetailItem
                label='Security Training for Sea Farers'
                value={cadet.stcw_security_training}
                name='stcw_security_training'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={Book}
              />
              <DetailItem
                label='Personal Safety & Social Responsibility'
                value={cadet.stcw_personal_safety}
                name='stcw_personal_safety'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={User}
              />
              <DetailItem
                label='Petrol Tanker Familiarization'
                value={cadet.stcw_petrol_tanker}
                name='stcw_petrol_tanker'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={Book}
              />
              <DetailItem
                label='Fire Prevention and Fire Fighting'
                value={cadet.stcw_fire_prevention}
                name='stcw_fire_prevention'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={Activity}
              />
              <DetailItem
                label='Chemical Tanker Familiarization'
                value={cadet.stcw_chemical_tanker}
                name='stcw_chemical_tanker'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={Book}
              />
              <DetailItem
                label='Personal Survival Techniques'
                value={cadet.stcw_personal_survival}
                name='stcw_personal_survival'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={Activity}
              />
              <DetailItem
                label='Gas Tanker Familiarization'
                value={cadet.stcw_gas_tanker}
                name='stcw_gas_tanker'
                type='select'
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Not Done', value: 'Not Done' },
                ]}
                icon={Book}
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
