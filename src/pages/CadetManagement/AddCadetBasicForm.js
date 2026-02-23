import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
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
  Globe,
  FileText,
  Save,
  X,
  Loader2,
  Briefcase,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import SectionTitle from '../../components/common/SectionTitle';
import SharedDetailItem from '../../components/common/DetailItem';

const DetailItem = (props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <SharedDetailItem
      {...props}
      isEditing={true}
      register={register}
      errors={errors}
    />
  );
};

const AddCadetBasicForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLateralEntry, setIsLateralEntry] = useState(false);

  const methods = useForm();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  // Watch fields for PCM calculation
  const physics = watch('twelfth_physics');
  const chemistry = watch('twelfth_chemistry');
  const maths = watch('twelfth_maths');

  // Watch fields for IMU Average calculation
  const imu_sem1 = watch('imu_sem1');
  const imu_sem2 = watch('imu_sem2');
  const imu_sem3 = watch('imu_sem3');
  const imu_sem4 = watch('imu_sem4');
  const imu_sem5 = watch('imu_sem5');
  const imu_sem6 = watch('imu_sem6');
  const imu_sem7 = watch('imu_sem7');
  const imu_sem8 = watch('imu_sem8');

  React.useEffect(() => {
    if (isLateralEntry) return;

    if (physics && chemistry && maths) {
      const p = parseFloat(physics);
      const c = parseFloat(chemistry);
      const m = parseFloat(maths);

      if (!isNaN(p) && !isNaN(c) && !isNaN(m)) {
        const average = ((p + c + m) / 3).toFixed(2);
        setValue('pcm_percentage', average.toString());
      } else {
        setValue('pcm_percentage', '');
      }
    } else {
      setValue('pcm_percentage', '');
    }
  }, [physics, chemistry, maths, setValue, isLateralEntry]);

  React.useEffect(() => {
    const sems = [
      imu_sem1,
      imu_sem2,
      imu_sem3,
      imu_sem4,
      imu_sem5,
      imu_sem6,
      imu_sem7,
      imu_sem8,
    ];

    let sum = 0;
    let count = 0;

    sems.forEach((sem) => {
      if (sem && sem !== 'Lateral Entry') {
        const val = parseFloat(sem);
        if (!isNaN(val)) {
          sum += val;
          count += 1;
        }
      }
    });

    if (count > 0) {
      const avg = (sum / count).toFixed(2);
      setValue('imu_avg_percentage', avg.toString());
    } else {
      setValue('imu_avg_percentage', '');
    }
  }, [
    imu_sem1,
    imu_sem2,
    imu_sem3,
    imu_sem4,
    imu_sem5,
    imu_sem6,
    imu_sem7,
    imu_sem8,
    setValue,
  ]);

  React.useEffect(() => {
    if (isLateralEntry) {
      setValue('twelfth_board', 'Lateral Entry');
      setValue('twelfth_year', 'Lateral Entry');
      setValue('twelfth_percentage', 'Lateral Entry');
      setValue('pcm_percentage', 'Lateral Entry');
      setValue('twelfth_maths', 'Lateral Entry');
      setValue('twelfth_physics', 'Lateral Entry');
      setValue('twelfth_chemistry', 'Lateral Entry');
      setValue('twelfth_english', 'Lateral Entry');

      setValue('imu_rank', 'Lateral Entry');
      setValue('imu_sem1', 'Lateral Entry');
      setValue('imu_sem2', 'Lateral Entry');
    } else {
      setValue('twelfth_board', '');
      setValue('twelfth_year', '');
      setValue('twelfth_percentage', '');
      setValue('pcm_percentage', '');
      setValue('twelfth_maths', '');
      setValue('twelfth_physics', '');
      setValue('twelfth_chemistry', '');
      setValue('twelfth_english', '');

      setValue('imu_rank', '');
      setValue('imu_sem1', '');
      setValue('imu_sem2', '');
    }
  }, [isLateralEntry, setValue]);

  const onSubmit = async (data) => {
    // UI Only implementation for now
    setLoading(true);
    try {
      console.log('Form Submitted', data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      toast.success(
        'Basic Form submitted (UI Only). Backend integration pending.',
      );
      // connect to backend later
    } catch (error) {
      console.error('Error', error);
      toast.error('Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
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
            <h1 className='text-2xl font-bold text-gray-900'>
              Add New Cadet (Basic)
            </h1>
            <p className='text-gray-500 text-sm'>
              Enter basic details to register a new cadet
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
            {/* Personal Information */}
            <div>
              <SectionTitle title='Personal Information' icon={User} />
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <DetailItem
                  label='Full Name'
                  name='name'
                  placeholder='e.g., John Doe'
                  required
                  icon={User}
                />
                <DetailItem
                  label='Email'
                  name='email'
                  type='email'
                  placeholder='e.g., john.doe@example.com'
                  required
                  icon={Mail}
                />
                <DetailItem
                  label='Phone'
                  name='phone'
                  placeholder='e.g., 9876543210'
                  required
                  icon={Phone}
                />
                <DetailItem
                  label='Gender'
                  name='gender'
                  icon={User}
                  type='select'
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                  ]}
                />
                <DetailItem
                  label='Date of Birth'
                  name='dob'
                  type='date'
                  icon={Calendar}
                />
                <DetailItem label='Hometown' name='hometown' icon={MapPin} />
                <DetailItem
                  label='Nationality'
                  name='nationality'
                  icon={Globe}
                />
              </div>
            </div>

            {/* Physical Details */}
            <div>
              <SectionTitle title='Physical Details' icon={Activity} />
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <DetailItem
                  label='Height (cm)'
                  name='height'
                  placeholder='e.g., 175.5'
                  type='float'
                  icon={Activity}
                />
                <DetailItem
                  label='Weight (kg)'
                  name='weight'
                  placeholder='e.g., 68.2'
                  type='float'
                  icon={Activity}
                />
                <DetailItem
                  label='Waist (cm)'
                  name='waist_in_cm'
                  placeholder='e.g., 82.5'
                  type='float'
                  icon={Activity}
                />
                <DetailItem
                  label='BMI'
                  name='bmi'
                  placeholder='e.g., 22.4'
                  type='float'
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
                  placeholder='e.g., 12GL3456'
                  icon={Hash}
                />
                <DetailItem
                  label='CDC Number'
                  name='cdc_number'
                  placeholder='e.g., MUM123456'
                  icon={Hash}
                />
                <DetailItem
                  label='Passport Number'
                  name='passport_number'
                  placeholder='e.g., Z1234567'
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
                    name='tenth_board'
                    placeholder='e.g., CBSE'
                    icon={School}
                  />
                  <DetailItem
                    label='Year'
                    name='tenth_year'
                    placeholder='e.g., 2018'
                    type='number'
                    icon={Calendar}
                  />
                  <DetailItem
                    label='Percentage'
                    name='tenth_percentage'
                    placeholder='e.g., 85.5'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='Maths'
                    name='tenth_maths'
                    placeholder='e.g., 90'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='Science'
                    name='tenth_science'
                    placeholder='e.g., 88'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='English'
                    name='tenth_english'
                    placeholder='e.g., 82'
                    type='float'
                    icon={Percent}
                  />
                </div>
              </div>

              {/* 12th Standard & Lateral Entry */}
              <div className='flex flex-col gap-6'>
                <div className='bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between'>
                  <div>
                    <h2 className='text-lg font-semibold text-blue-900'>
                      Lateral Entry (Diploma)
                    </h2>
                    <p className='text-sm text-blue-700/80'>
                      Toggle this if the cadet is a Lateral Entry candidate.
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setIsLateralEntry(!isLateralEntry)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      isLateralEntry ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isLateralEntry ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {!isLateralEntry ? (
                  <div>
                    <SectionTitle title='12th Standard' icon={School} />
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <DetailItem
                        label='Board'
                        name='twelfth_board'
                        placeholder='e.g., CBSE'
                        icon={School}
                      />
                      <DetailItem
                        label='Year'
                        name='twelfth_year'
                        placeholder='e.g., 2020'
                        type='number'
                        icon={Calendar}
                      />
                      <DetailItem
                        label='Percentage'
                        name='twelfth_percentage'
                        placeholder='e.g., 82.0'
                        type='float'
                        icon={Percent}
                      />
                      <DetailItem
                        label='Maths'
                        name='twelfth_maths'
                        placeholder='e.g., 88'
                        type='float'
                        icon={Percent}
                      />
                      <DetailItem
                        label='Physics'
                        name='twelfth_physics'
                        placeholder='e.g., 82'
                        type='float'
                        icon={Percent}
                      />
                      <DetailItem
                        label='Chemistry'
                        name='twelfth_chemistry'
                        placeholder='e.g., 86'
                        type='float'
                        icon={Percent}
                      />
                      <DetailItem
                        label='English'
                        name='twelfth_english'
                        placeholder='e.g., 80'
                        type='float'
                        icon={Percent}
                      />
                      <DetailItem
                        label='PCM %'
                        name='pcm_percentage'
                        placeholder='Auto-calculated'
                        type='float'
                        icon={Percent}
                        disabled={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='bg-gray-50 border border-gray-100 rounded-xl p-6 text-center text-gray-500 font-medium'>
                    12th Standard details are not required for Lateral Entry
                    candidates.
                    <input type='hidden' {...register('twelfth_board')} />
                    <input type='hidden' {...register('twelfth_year')} />
                    <input type='hidden' {...register('twelfth_percentage')} />
                    <input type='hidden' {...register('pcm_percentage')} />
                    <input type='hidden' {...register('twelfth_maths')} />
                    <input type='hidden' {...register('twelfth_physics')} />
                    <input type='hidden' {...register('twelfth_chemistry')} />
                    <input type='hidden' {...register('twelfth_english')} />
                  </div>
                )}
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
                    type='select'
                    icon={Book}
                    options={[
                      { value: 'Deck', label: 'Deck' },
                      { value: 'Engine', label: 'Engine' },
                    ]}
                  />
                  <DetailItem
                    label='University'
                    name='graduation_university'
                    placeholder='e.g., Mumbai University'
                    icon={School}
                  />
                </div>
              </div>

              {/* IMU Details */}
              <div>
                <SectionTitle title='IMU Performance' icon={Award} />
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {/* Semester Wise */}
                  {!isLateralEntry ? (
                    <div className='col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <DetailItem
                        label='Sem 1'
                        name='imu_sem1'
                        placeholder='e.g., 80.2'
                        type='float'
                        icon={Percent}
                      />
                      <DetailItem
                        label='Sem 2'
                        name='imu_sem2'
                        placeholder='e.g., 76.8'
                        type='float'
                        icon={Percent}
                      />
                    </div>
                  ) : (
                    <div className='hidden'>
                      <input type='hidden' {...register('imu_sem1')} />
                      <input type='hidden' {...register('imu_sem2')} />
                    </div>
                  )}
                  <DetailItem
                    label='Sem 3'
                    name='imu_sem3'
                    placeholder='e.g., 78.0'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='Sem 4'
                    name='imu_sem4'
                    placeholder='e.g., 75.5'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='Sem 5'
                    name='imu_sem5'
                    placeholder='e.g., 79.1'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='Sem 6'
                    name='imu_sem6'
                    placeholder='e.g., 81.0'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='Sem 7'
                    name='imu_sem7'
                    placeholder='e.g., 77.4'
                    type='float'
                    icon={Percent}
                  />
                  <DetailItem
                    label='Sem 8'
                    name='imu_sem8'
                    placeholder='e.g., 82.5'
                    type='float'
                    icon={Percent}
                  />
                  {!isLateralEntry ? (
                    <DetailItem
                      label='IMU Rank'
                      name='imu_rank'
                      placeholder='e.g., 1250'
                      type='number'
                      icon={Award}
                    />
                  ) : (
                    <div className='hidden'>
                      <input type='hidden' {...register('imu_rank')} />
                    </div>
                  )}
                  <DetailItem
                    label='Avg %'
                    name='imu_avg_percentage'
                    placeholder='Auto-calculated'
                    type='float'
                    icon={Percent}
                    disabled={true}
                  />
                </div>
              </div>
            </div>

            {/* Course & Training */}
            <div>
              <SectionTitle
                title='Course & Training Details'
                icon={Briefcase}
              />
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <DetailItem
                  label='Batch'
                  name='batch'
                  placeholder='e.g., 2024'
                  icon={Hash}
                />
                <DetailItem
                  label='Batch Rank'
                  name='batch_rank'
                  placeholder='e.g., 5'
                  icon={Award}
                />
                <DetailItem
                  label='Arrears'
                  name='no_of_arrears'
                  placeholder='e.g., 0'
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
                  name='age_at_passing_out'
                  placeholder='e.g., 22'
                  type='number'
                  icon={User}
                />
                <DetailItem
                  label='Post Applied For'
                  name='post_applied_for'
                  placeholder='e.g., Engine Cadet'
                  icon={Briefcase}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <SectionTitle title='Additional Info' icon={FileText} />
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <DetailItem
                  label='Languages'
                  name='language_known'
                  placeholder='e.g., English, Hindi, Marathi'
                  icon={Globe}
                />
                <DetailItem
                  label='Loan'
                  name='educational_loan'
                  placeholder='e.g., SBI Education Loan'
                  icon={FileText}
                />
                <DetailItem
                  label='Extra Curricular'
                  name='extra_curricular'
                  placeholder='e.g., College Football Team Captain'
                  icon={Activity}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default AddCadetBasicForm;
