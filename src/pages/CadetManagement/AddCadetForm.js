import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import SectionTitle from '../../components/common/SectionTitle';
import SharedDetailItem from '../../components/common/DetailItem';
// import api from '../../lib/utils/apiConfig'; // API not used yet as per request

const AddCadetForm = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const onSubmit = async (data) => {
    // UI Only implementation for now
    setLoading(true);
    try {
      console.log('Form Submitted', data, selectedFile);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      toast.success('Form submitted (UI Only). Backend integration pending.');
      // connect to backend later
    } catch (error) {
      console.error('Error', error);
      toast.error('Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  const DetailItem = (props) => (
    <SharedDetailItem
      {...props}
      isEditing={true} // Always in edit mode for new form
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
          <h1 className='text-2xl font-bold text-gray-900'>Add New Cadet</h1>
          <p className='text-gray-500 text-sm'>
            Enter details to register a new cadet
          </p>
        </div>
        <div className='ml-auto flex gap-2'>
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
                className={`w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center relative cursor-pointer`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt='Preview'
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <ImageIcon size={48} className='text-gray-400' />
                )}

                <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Camera className='text-white w-8 h-8' />
                </div>
              </div>
            </div>
            <div className='flex-1 text-center md:text-left'>
              <h3 className='text-xl font-bold text-gray-800'>Cadet Photo</h3>
              <p className='text-gray-500 font-medium'>
                Upload a recent passport size photograph
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <SectionTitle title='Personal Information' icon={User} />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem label='Full Name' name='name_as_in_indos_cert' required icon={User} />
              <DetailItem
                label='Email'
                name='email_id'
                type='email_id'
                required
                icon={Mail}
              />
              <DetailItem label='Phone' name='contact_number' required icon={Phone} />
              <DetailItem
                label='Gender'
                name='gender'
                icon={User}
                type='select'
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <DetailItem
                label='Date of Birth'
                name='date_of_birth'
                type='date'
                icon={Calendar}
              />
              <DetailItem label='Hometown' name='home_town_or_nearby_airport' icon={MapPin} />
              <DetailItem label='Nationality' name='nationality' icon={Globe} />
              <DetailItem
                label='Blood Group'
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
                name='height_in_cms'
                type='float'
                icon={Ruler}
              />
              <DetailItem
                label='Weight (kg)'
                name='weight_in_kgs'
                type='float'
                icon={Weight}
              />
              <DetailItem
                label='Waist (cm)'
                name='waist_in_cm'
                type='float'
                icon={Ruler}
              />
              <DetailItem label='BMI' name='bmi' type='float' icon={Activity} />
              <DetailItem label='Eye Color' name='eye_color' icon={Eye} />
              <DetailItem label='Eye Vision' name='eye_vision' icon={Eye} />
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <SectionTitle title='Medical Information' icon={Syringe} />
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <DetailItem
                label='COVID Vaccination'
                name='covid_vaccination'
                icon={Syringe}
              />
              <DetailItem label='COVID Dose' name='covid_dose' icon={Syringe} />
              <DetailItem
                label='Medical History'
                name='medical_history'
                icon={Activity}
              />
              <DetailItem
                label='Family Medical History'
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
                name='indos_number'
                icon={Hash}
              />
              <DetailItem label='CDC Number' name='cdc_number' icon={Hash} />
              <DetailItem
                label='Passport Number'
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
                <DetailItem label='Board' name='tenth_std_board' icon={School} />
                <DetailItem
                  label='Year'
                  name='tenth_std_pass_out_year'
                  type='number'
                  icon={Calendar}
                />
                <DetailItem
                  label='Percentage'
                  name='tenth_avg_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Maths'
                  name='tenth_std_maths'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Science'
                  name='tenth_std_science'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='English'
                  name='tenth_std_english'
                  type='float'
                  icon={Percent}
                />
              </div>
            </div>

            {/* 12th Standard */}
            <div>
              <SectionTitle title='12th Standard' icon={School} />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem label='Board' name='twelfth_std_board' icon={School} />
                <DetailItem
                  label='Year'
                  name='twelfth_std_pass_out_year'
                  type='number'
                  icon={Calendar}
                />
                <DetailItem
                  label='Percentage'
                  name='twelfth_pcm_avg_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='PCM %'
                  name='pcm_percentage'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Maths'
                  name='twelfth_std_maths'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Physics'
                  name='twelfth_std_physics'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Chemistry'
                  name='twelfth_std_chemistry'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='English'
                  name='twelfth_std_english'
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
                  name='graduation_course'
                  icon={Book}
                />
                <DetailItem
                  label='University'
                  name='graduation_university'
                  icon={School}
                />
                <DetailItem
                  label='Percentage'
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
                  name='imu_rank'
                  type='number'
                  icon={Award}
                />
                <DetailItem
                  label='Avg %'
                  name='imu_avg_all_semester_percentage'
                  type='float'
                  icon={Percent}
                />
                {/* Semester Wise */}
                <DetailItem
                  label='Sem 1'
                  name='imu_sem_'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 2'
                  name='imu_sem_'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 3'
                  name='imu_sem_'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 4'
                  name='imu_sem_'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 5'
                  name='imu_sem_'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 6'
                  name='imu_sem_'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 7'
                  name='imu_sem_'
                  type='float'
                  icon={Percent}
                />
                <DetailItem
                  label='Sem 8'
                  name='imu_sem_'
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
              <DetailItem label='Batch' name='batch' icon={Hash} />
              <DetailItem label='Batch Rank' name='batch_rank_out_of_72_cadets' icon={Award} />
              <DetailItem
                label='Arrears'
                name='no_of_arrears'
                type='number'
                icon={Book}
              />
              <DetailItem
                label='Passing Out Date'
                name='passing_out_date'
                type='date'
                icon={Calendar}
              />
              <DetailItem
                label='Age at Passing'
                name='age_when_passing_out'
                type='number'
                icon={User}
              />
              <DetailItem
                label='Post Applied For'
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
                name='father_occupation'
                icon={Briefcase}
              />
              <DetailItem
                label="Mother's Occupation"
                name='mother_occupation'
                icon={Briefcase}
              />
              <DetailItem
                label='Languages'
                name='language_known'
                icon={Globe}
              />
              <DetailItem
                label='Loan'
                name='educational_loan'
                icon={FileText}
              />
              <DetailItem
                label='Extra Curricular'
                name='any_extra_curricular_achievement'
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
                <textarea
                  {...register('address')}
                  className='w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all'
                  rows={3}
                />
              </div>
              <div className='p-4 bg-gray-50 rounded-lg border border-gray-100'>
                <h4 className='font-semibold text-gray-700 mb-2'>
                  Permanent Address
                </h4>
                <textarea
                  {...register('permanent_address')}
                  className='w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all'
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddCadetForm;
