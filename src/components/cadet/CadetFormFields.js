import React, { useState, useEffect } from 'react';
import {
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
  Briefcase,
  Globe,
  FileText,
  Save,
  Loader2,
  ClipboardList,
  Target,
  ArrowRight,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import SectionTitle from '../common/SectionTitle';
import SharedDetailItem from '../common/DetailItem';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';

const CadetFormFields = ({
  cadet = {},
  isEditing = true,
  register,
  errors,
  watch,
  setValue,
  isSubmitting,
  interviewData = null,
  medicalData = null,
  assessmentData = null,
  user = null,
}) => {
  const navigate = useNavigate();
  const isAdmin = user?.role?.toLowerCase() === 'superadmin';
  const isCadetOrInstitute = ['cadet', 'institute'].includes(user?.role?.toLowerCase());
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);

  // Watch current address to sync with permanent when checkbox is on
  const currentAddress = watch ? watch('address') : '';

  useEffect(() => {
    if (sameAsCurrentAddress && setValue) {
      setValue('permanent_address', currentAddress || '');
    }
  }, [currentAddress, sameAsCurrentAddress, setValue]);
  const DetailItem = (props) => (
    <SharedDetailItem
      {...props}
      isEditing={isEditing}
      register={register}
      errors={errors}
    />
  );

  return (
    <div className='space-y-12'>
      {/* 1. Basic Details */}
      <section>
        <SectionTitle title='Basic Details' icon={User} />
        <div className='bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-8'>
          {/* Persona/Contact */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            <DetailItem label='Full Name' value={cadet.name_as_in_indos_cert} name='name_as_in_indos_cert' required icon={User} />
            <DetailItem label='Email' value={cadet.email_id} name='email_id' type='email' required icon={Mail} />
            <DetailItem label='Phone' value={cadet.contact_number} name='contact_number' required icon={Phone} />
            <DetailItem label='Gender' value={cadet.gender} name='gender' icon={User} />
            <DetailItem label='Date of Birth' value={formatDateForDisplay(cadet.date_of_birth)} name='date_of_birth' type='date' icon={Calendar} />
            <DetailItem label='Place of Birth' value={cadet.place_of_birth} name='place_of_birth' icon={MapPin} />
            <DetailItem label='Hometown' value={cadet.home_town_or_nearby_airport} name='home_town_or_nearby_airport' icon={MapPin} />
            <DetailItem label='Nationality' value={cadet.nationality} name='nationality' icon={Globe} />
            <DetailItem label='Languages Known' value={cadet.language_known} name='language_known' icon={Globe} />
          </div>

          {/* Physical */}
          <div className='pt-6 border-t border-gray-200'>
            <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider mb-4'>Physical Attributes</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <DetailItem label='Height (cm)' value={cadet.height_in_cms ? `${cadet.height_in_cms} cm` : '-'} name='height_in_cms' type='float' icon={Ruler} />
              <DetailItem label='Weight (kg)' value={cadet.weight_in_kgs ? `${cadet.weight_in_kgs} kg` : '-'} name='weight_in_kgs' type='float' icon={Weight} />
              <DetailItem label='Waist (cm)' value={cadet.waist_in_cm ? `${cadet.waist_in_cm} cm` : '-'} name='waist_in_cm' type='float' icon={Ruler} />
              <DetailItem label='BMI' value={cadet.bmi} name='bmi' type='float' icon={Activity} />
              <DetailItem label='Eye Color' value={cadet.eye_color} name='eye_color' icon={Eye} />
              <DetailItem
                label='Using lens or Glasses'
                value={
                  cadet.eye_vision
                    ? ['no', 'none', '-'].includes(
                        cadet.eye_vision.toLowerCase().trim(),
                      )
                      ? 'No'
                      : 'Yes'
                    : '-'
                }
                name='eye_vision'
                type='select'
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                ]}
                icon={Eye}
              />
              {((isEditing && watch('eye_vision') === 'Yes') ||
                (!isEditing &&
                  ['yes', 'true'].includes(
                    (cadet.eye_vision || '').toLowerCase().trim(),
                  ))) && (
                <>
                  <DetailItem
                    label='Left Eye Vision'
                    value={cadet.eye_vision_left}
                    name='eye_vision_left'
                    icon={Eye}
                    placeholder='e.g. 6/6'
                  />
                  <DetailItem
                    label='Right Eye Vision'
                    value={cadet.eye_vision_right}
                    name='eye_vision_right'
                    icon={Eye}
                    placeholder='e.g. 6/9'
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Address */}
          <div className='pt-6 border-t border-gray-200'>
            <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider mb-4'>Address Details</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-600'>Current Address</label>
                {isEditing ? (
                  <textarea {...register('address')} className='w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none h-24' />
                ) : (
                  <p className='text-gray-700 bg-white p-3 rounded-lg border border-gray-100 min-h-[96px]'>{cadet.address || '-'}</p>
                )}
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-semibold text-gray-600'>Permanent Address</label>
                  {isEditing && (
                    <label className='flex items-center gap-2 cursor-pointer text-xs text-indigo-600 font-medium'>
                      <input type='checkbox' checked={sameAsCurrentAddress} onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsCurrentAddress(checked);
                        if (checked && setValue) {
                          const addr = watch ? watch('address') : '';
                          setValue('permanent_address', addr || '');
                        }
                      }} className='rounded border-gray-300' />
                      Same as current
                    </label>
                  )}
                </div>
                {isEditing ? (
                  <textarea {...register('permanent_address')} disabled={sameAsCurrentAddress} className={`w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none h-24 ${sameAsCurrentAddress ? 'bg-gray-100' : ''}`} />
                ) : (
                  <p className='text-gray-700 bg-white p-3 rounded-lg border border-gray-100 min-h-[96px]'>{cadet.permanent_address || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Academic Details */}
      <section>
        <SectionTitle title='Academic Details' icon={Book} />
        <div className='bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-8'>
          {/* 10th & 12th */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div className='space-y-4'>
              <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider'>10th Standard</h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <DetailItem label='Board' value={cadet.tenth_std_board} name='tenth_std_board' icon={School} />
                <DetailItem label='Year' value={cadet.tenth_std_pass_out_year} name='tenth_std_pass_out_year' type='number' icon={Calendar} />
                <DetailItem label='Percentage' value={cadet.tenth_avg_percentage} name='tenth_avg_percentage' type='text' icon={Percent} />
                <DetailItem label='Maths' value={cadet.tenth_std_maths} name='tenth_std_maths' type='text' icon={Percent} />
                <DetailItem label='Science' value={cadet.tenth_std_science} name='tenth_std_science' type='text' icon={Percent} />
                <DetailItem label='English' value={cadet.tenth_std_english} name='tenth_std_english' type='text' icon={Percent} />
              </div>
            </div>
            <div className='space-y-4'>
              <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider'>12th Standard</h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <DetailItem label='Board' value={cadet.twelfth_std_board} name='twelfth_std_board' icon={School} />
                <DetailItem label='Year' value={cadet.twelfth_std_pass_out_year} name='twelfth_std_pass_out_year' type='text' icon={Calendar} />
                <DetailItem label='PCM %' value={cadet.twelfth_pcm_avg_percentage} name='twelfth_pcm_avg_percentage' type='text' icon={Percent} />
                <DetailItem label='Maths' value={cadet.twelfth_std_maths} name='twelfth_std_maths' type='text' icon={Percent} />
                <DetailItem label='Physics' value={cadet.twelfth_std_physics} name='twelfth_std_physics' type='text' icon={Percent} />
                <DetailItem label='Chemistry' value={cadet.twelfth_std_chemistry} name='twelfth_std_chemistry' type='text' icon={Percent} />
                <DetailItem label='English' value={cadet.twelfth_std_english} name='twelfth_std_english' type='text' icon={Percent} />
              </div>
            </div>
          </div>

          {/* Graduation & IMU */}
          <div className='pt-6 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div className='space-y-4'>
              <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider'>Graduation</h4>
              <DetailItem label='University' value={cadet.graduation_university} name='graduation_university' icon={School} />
            </div>
            <div className='space-y-4'>
              <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider'>IMU Performance</h4>
              <div className='grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4'>
                <DetailItem label='IMU Rank' value={cadet.imu_rank} name='imu_rank' type='text' icon={Award} />
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
          <div className='pt-6 border-t border-gray-200'>
            <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider mb-4'>Course & Training Details</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
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
                value={formatDateForDisplay(cadet.passing_out_date)}
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
          <div className='pt-6 border-t border-gray-200'>
            <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider mb-4'>Family & Additional Info</h4>
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
                label="Sibling's Occupation"
                value={cadet.sibling_occupation}
                name='sibling_occupation'
                icon={Briefcase}
              />
              <DetailItem
                label='Any Relative in Marine Field'
                value={cadet.marine_relative}
                name='marine_relative'
                icon={User}
              />
              <DetailItem
                label='Loan'
                value={cadet.educational_loan}
                name='educational_loan'
                icon={FileText}
              />
              <DetailItem
                type='textarea'
                label='Extra Curricular'
                value={cadet.any_extra_curricular_achievement}
                name='any_extra_curricular_achievement'
                icon={Activity}
              />
            </div>
          </div>

          {/* STCW Courses */}
          <div className='pt-6 border-t border-gray-200'>
            <h4 className='text-sm font-bold text-gray-400 uppercase tracking-wider mb-4'>STCW Courses</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <DetailItem
                label='Elementary/Medical First Aid/Medicare'
                value={cadet.stcw_elementary_first_aid}
                name='stcw_elementary_first_aid'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={Syringe}
              />
              <DetailItem
                label='Security Training for Sea Farers'
                value={cadet.stcw_security_training}
                name='stcw_security_training'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={Book}
              />
              <DetailItem
                label='Personal Safety & Social Responsibility'
                value={cadet.stcw_personal_safety}
                name='stcw_personal_safety'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={User}
              />
              <DetailItem
                label='Petrol Tanker Familiarization'
                value={cadet.stcw_petrol_tanker}
                name='stcw_petrol_tanker'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={Book}
              />
              <DetailItem
                label='Fire Prevention and Fire Fighting'
                value={cadet.stcw_fire_prevention}
                name='stcw_fire_prevention'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={Activity}
              />
              <DetailItem
                label='Chemical Tanker Familiarization'
                value={cadet.stcw_chemical_tanker}
                name='stcw_chemical_tanker'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={Book}
              />
              <DetailItem
                label='Personal Survival Techniques'
                value={cadet.stcw_personal_survival}
                name='stcw_personal_survival'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={Activity}
              />
              <DetailItem
                label='Gas Tanker Familiarization'
                value={cadet.stcw_gas_tanker}
                name='stcw_gas_tanker'
                type='select'
                options={[
                  { label: 'Not Done', value: 'Not Done' },
                  { label: 'Done', value: 'Done' },
                ]}
                icon={Book}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Medical Details */}
      {(isAdmin || !isEditing) && (
        <section>
          <SectionTitle title='Medical Details' icon={Syringe} />
          <div className='bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <DetailItem label='Blood Group' value={cadet.blood_group} name='blood_group' icon={Activity} />
              <DetailItem
                label='COVID-19 Vaccination'
                value={cadet.covid_vaccination}
                name='covid_vaccination'
                type='select'
                options={[
                  {
                    label: 'Both Dose - Covishield',
                    value: 'Both Dose - Covishield',
                  },
                  {
                    label: 'Both Dose - Covaxin',
                    value: 'Both Dose - Covaxin',
                  },
                  {
                    label: 'Single Dose - Covishield',
                    value: 'Single Dose - Covishield',
                  },
                  {
                    label: 'Single Dose - Covaxin',
                    value: 'Single Dose - Covaxin',
                  },
                  { label: 'Other', value: 'Other' },
                ]}
                icon={Syringe}
              />
              {((isEditing && watch('covid_vaccination') === 'Other') ||
                (!isEditing && cadet.covid_vaccination === 'Other')) && (
                <DetailItem
                  label='Vaccine Description'
                  value={cadet.covid_dose}
                  name='covid_dose'
                  icon={Syringe}
                  placeholder='Enter Vaccine Name/Description'
                />
              )}
            </div>
            
            {/* Medical Results Display - Admin Only */}
            {!isEditing && isAdmin && (
              <div className='mt-6 border-t border-gray-100 pt-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h4 className='text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2'>
                    <Activity size={16} className='text-blue-500' />
                    Medical Examination Result
                  </h4>
                  <Button 
                    variant='outline' 
                    size='sm' 
                    className='h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50'
                    onClick={() => navigate(`/cadets/medical/${cadet.id}`)}
                  >
                    <ArrowRight size={14} />
                    Record Result
                  </Button>
                </div>
                
                {medicalData ? (
                  <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
                     <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                        <DetailItem label='Examination Date' value={medicalData.medical_date ? formatDateForDisplay(medicalData.medical_date) : 'N/A'} icon={Calendar} />
                        <DetailItem label='Medical Center' value={medicalData.medical_center} icon={MapPin} />
                        <div className='flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100'>
                          <Activity size={20} className='text-emerald-600' />
                          <div>
                            <p className='text-[10px] text-emerald-600 font-bold uppercase tracking-wider'>Fitness Status</p>
                            <p className='text-sm font-bold text-emerald-900'>{medicalData.fit_status}</p>
                          </div>
                        </div>
                        <div className='sm:col-span-2'>
                          <DetailItem label='Medical Remarks' value={medicalData.remarks} icon={FileText} />
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className='p-8 bg-indigo-50/30 rounded-2xl border border-dashed border-indigo-200 flex flex-col items-center justify-center gap-2'>
                    <div className='w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-400'>
                      <Activity size={24} />
                    </div>
                    <p className='text-sm text-indigo-600 font-semibold'>No medical results recorded yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Documents (Vault) */}
      <section>
        <SectionTitle title='Documents (Vault)' icon={FileText} />
        <div className='bg-gray-50/50 p-6 rounded-xl border border-gray-100'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            <DetailItem label='INDoS Number' value={cadet.indos_number} name='indos_number' icon={Hash} />
            <DetailItem label='CDC Number' value={cadet.cdc_number} name='cdc_number' icon={Hash} />
            <DetailItem label='Passport Number' value={cadet.passport_number} name='passport_number' icon={Hash} />
          </div>
        </div>
      </section>

      {/* 5. Screening & Assessment Status - Admin Only */}
      {isAdmin && (
        <section>
          <SectionTitle title='Screening & Assessment' icon={ClipboardList} />
          <div className='bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem label='Current Stage' value={cadet.status} name='status' icon={Activity} />
              <DetailItem label='Shortlisted' value={cadet.is_shortlisted ? 'Yes' : 'No'} name='is_shortlisted' icon={Award} />
              {!isEditing && (
                <Button 
                  variant='outline' 
                  size='sm' 
                  className='h-10 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50'
                  onClick={() => navigate(`/cadets/assess/${cadet.id}`)}
                >
                  <ClipboardList size={14} />
                  Record Assessment
                </Button>
              )}
            </div>

            {!isEditing && assessmentData && (
              <div className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm'>
                <h4 className='text-xs font-bold text-gray-500 uppercase mb-3'>Assessment Results</h4>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                  <div className='p-3 bg-blue-50/50 rounded-lg border border-blue-100'>
                    <p className='text-[10px] text-blue-600 font-bold uppercase'>Total Score</p>
                    <p className='text-lg font-bold text-blue-900'>{parseFloat(assessmentData.calculated_score || assessmentData.ces_test).toFixed(1)}</p>
                  </div>
                  <div className='p-3 bg-indigo-50/50 rounded-lg border border-indigo-100'>
                    <p className='text-[10px] text-indigo-600 font-bold uppercase'>QA Test</p>
                    <p className='text-lg font-bold text-indigo-900'>{assessmentData.qa_test}%</p>
                  </div>
                  <div className='p-3 bg-purple-50/50 rounded-lg border border-purple-100'>
                    <p className='text-[10px] text-purple-600 font-bold uppercase'>English</p>
                    <p className='text-lg font-bold text-purple-900'>{assessmentData.english_test}%</p>
                  </div>
                  <div className='p-3 bg-emerald-50/50 rounded-lg border border-emerald-100'>
                    <p className='text-[10px] text-emerald-600 font-bold uppercase'>Interview Flag</p>
                    <p className='text-sm font-bold text-emerald-900'>{assessmentData.mark_for_interview ? 'YES' : 'NO'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. Interview Status - Admin Only */}
      {isAdmin && (
        <section>
          <SectionTitle title='Interview Status' icon={Briefcase} />
          <div className='bg-gray-50/50 p-6 rounded-xl border border-gray-100'>
            {!isEditing && (
              <div className='flex justify-end mb-4'>
                <Button 
                  variant='outline' 
                  size='sm' 
                  className='h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50'
                  onClick={() => navigate(`/cadets/interview/${cadet.id}`)}
                >
                  <ArrowRight size={14} />
                  Record Interview
                </Button>
              </div>
            )}

            {interviewData ? (
               <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <DetailItem label='Interview Date' value={interviewData.interview_date ? formatDateForDisplay(interviewData.interview_date) : 'N/A'} icon={Calendar} />
                    <DetailItem label='Interviewer' value={interviewData.interviewer_name} icon={User} />
                    
                    <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100'>
                      <Target size={20} className='text-blue-600' />
                      <div>
                        <p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Interview Score</p>
                        <p className='text-sm font-bold text-blue-900'>{interviewData.score}%</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100'>
                      <CheckCircle size={20} className='text-indigo-600' />
                      <div>
                        <p className='text-[10px] text-indigo-600 font-bold uppercase tracking-wider'>Selection Status</p>
                        <p className='text-sm font-bold text-indigo-900'>{interviewData.status}</p>
                      </div>
                    </div>

                    <div className='lg:col-span-2'>
                      <DetailItem label='Remarks' value={interviewData.remarks} icon={MessageSquare} />
                    </div>
                  </div>
               </div>
            ) : (
              <div className='p-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-3'>
                <div className='w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400'>
                  <Briefcase size={28} />
                </div>
                <p className='text-gray-500 font-medium'>Interview details are not available yet.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. CTV Assignment - Admin Only */}
      {isAdmin && (
        <section>
          <SectionTitle title='CTV Assignment' icon={Globe} />
          <div className='bg-gray-50/50 p-6 rounded-xl border border-gray-100'>
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3'>
                <Globe size={24} />
              </div>
              <p className='text-gray-500 text-sm'>Vessel allocation pending final selection.</p>
            </div>
          </div>
        </section>
      )}

      {/* Final Declaration */}
      <div className='pt-6 border-t border-gray-100'>
        {isCadetOrInstitute && (
          isEditing ? (
            <div
              className={`bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-blue-800 text-sm mb-6 ${errors.declaration_accepted ? 'border border-red-500' : ''}`}
            >
              <div className='mt-1 shrink-0'>
                <input
                  type='checkbox'
                  id='declaration'
                  {...register('declaration_accepted', {
                    required: 'You must accept the declaration to submit',
                  })}
                  className='w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer'
                />
              </div>
              <label htmlFor='declaration' className='cursor-pointer flex-1'>
                <strong>Declaration:</strong> I hereby declare that the
                information given in this application is true and correct to the
                best of my knowledge and belief.
                {errors.declaration_accepted && (
                  <span className='block text-red-500 mt-1'>
                    {errors.declaration_accepted.message}
                  </span>
                )}
              </label>
            </div>
          ) : (
            <div className='bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm mb-6'>
              <FileText className='shrink-0 mt-0.5' size={18} />
              <p>
                <strong>Declaration:</strong> I hereby declare that the
                information given in this application is true and correct to the
                best of my knowledge and belief.
              </p>
            </div>
          )
        )}

        {isEditing && (
          <div className='flex justify-end'>
            <Button
              type='submit'
              className='gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className='animate-spin' size={16} />
              ) : (
                <Save size={16} />
              )}
              {Object.keys(cadet).length === 0 ? 'Save Cadet' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadetFormFields;
