import React from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';

const CVViewModal = ({ cadet, isOpen, onClose }) => {
  if (!isOpen || !cadet) return null;

  const CVSection = ({ title, children }) => (
    <div className='mb-6'>
      <h3 className='text-lg font-semibold text-gray-800 mb-3 border-b pb-2'>
        {title}
      </h3>
      <div className='grid grid-cols-2 gap-4'>{children}</div>
    </div>
  );

  const CVField = ({ label, value }) => (
    <div>
      <p className='text-sm text-gray-500 mb-1'>{label}</p>
      <p className='text-sm font-medium text-gray-900'>{value || '-'}</p>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 z-40'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='fixed inset-0 z-50 overflow-y-auto'>
        <div className='flex min-h-full items-center justify-center p-4'>
          <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <FileText size={24} />
                <div>
                  <h2 className='text-xl font-bold'>{cadet.name}</h2>
                  <p className='text-blue-100 text-sm'>{cadet.email}</p>
                </div>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={onClose}
                className='text-white hover:bg-white/20'
              >
                <X size={20} />
              </Button>
            </div>

            {/* Content */}
            <div className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
              {/* Personal Information */}
              <CVSection title='Personal Information'>
                <CVField label='Full Name' value={cadet.name} />
                <CVField label='Email' value={cadet.email} />
                <CVField label='Phone' value={cadet.phone} />
                <CVField label='Gender' value={cadet.gender} />
                <CVField
                  label='Date of Birth'
                  value={
                    cadet.dob ? new Date(cadet.dob).toLocaleDateString() : '-'
                  }
                />
                <CVField label='Hometown' value={cadet.hometown} />
                <CVField label='Nationality' value={cadet.nationality} />
                <CVField label='Blood Group' value={cadet.blood_group} />
              </CVSection>

              {/* Physical Details */}
              <CVSection title='Physical Details'>
                <CVField label='Height (cm)' value={cadet.height} />
                <CVField label='Weight (kg)' value={cadet.weight} />
                <CVField label='Waist (cm)' value={cadet.waist_in_cm} />
                <CVField label='BMI' value={cadet.bmi} />
                <CVField label='Eye Color' value={cadet.eye_color} />
                <CVField label='Eye Vision' value={cadet.eye_vision} />
              </CVSection>

              {/* Medical Information */}
              <CVSection title='Medical Information'>
                <CVField
                  label='COVID Vaccination'
                  value={cadet.covid_vaccination}
                />
                <CVField label='COVID Dose' value={cadet.covid_dose} />
                <CVField
                  label='Medical History'
                  value={cadet.medical_history}
                />
                <CVField
                  label='Family Medical History'
                  value={cadet.family_medical_history}
                />
              </CVSection>

              {/* Documents */}
              <CVSection title='Documents & IDs'>
                <CVField label='INDoS Number' value={cadet.indos_number} />
                <CVField label='INDoS No. 2' value={cadet.indos_no2} />
                <CVField label='CDC Number' value={cadet.cdc_number} />
                <CVField
                  label='Passport Number'
                  value={cadet.passport_number}
                />
              </CVSection>

              {/* Academic - 10th Standard */}
              <CVSection title='10th Standard'>
                <CVField label='Board' value={cadet.tenth_board} />
                <CVField label='Year' value={cadet.tenth_year} />
                <CVField
                  label='Percentage'
                  value={
                    cadet.tenth_percentage ? `${cadet.tenth_percentage}%` : '-'
                  }
                />
                <CVField
                  label='Mathematics'
                  value={cadet.tenth_maths ? `${cadet.tenth_maths}%` : '-'}
                />
                <CVField
                  label='Science'
                  value={cadet.tenth_science ? `${cadet.tenth_science}%` : '-'}
                />
                <CVField
                  label='English'
                  value={cadet.tenth_english ? `${cadet.tenth_english}%` : '-'}
                />
              </CVSection>

              {/* Academic - 12th Standard */}
              <CVSection title='12th Standard'>
                <CVField label='Board' value={cadet.twelfth_board} />
                <CVField label='Year' value={cadet.twelfth_year} />
                <CVField
                  label='Percentage'
                  value={
                    cadet.twelfth_percentage
                      ? `${cadet.twelfth_percentage}%`
                      : '-'
                  }
                />
                <CVField
                  label='PCM Percentage'
                  value={
                    cadet.pcm_percentage ? `${cadet.pcm_percentage}%` : '-'
                  }
                />
                <CVField
                  label='Physics'
                  value={
                    cadet.twelfth_physics ? `${cadet.twelfth_physics}%` : '-'
                  }
                />
                <CVField
                  label='Chemistry'
                  value={
                    cadet.twelfth_chemistry
                      ? `${cadet.twelfth_chemistry}%`
                      : '-'
                  }
                />
                <CVField
                  label='Mathematics'
                  value={cadet.twelfth_maths ? `${cadet.twelfth_maths}%` : '-'}
                />
                <CVField
                  label='English'
                  value={
                    cadet.twelfth_english ? `${cadet.twelfth_english}%` : '-'
                  }
                />
              </CVSection>

              {/* Graduation */}
              <CVSection title='Graduation / Degree'>
                <CVField
                  label='Course'
                  value={cadet.graduation_course || cadet.course}
                />
                <CVField
                  label='University'
                  value={cadet.graduation_university}
                />
                <CVField
                  label='Percentage'
                  value={
                    cadet.degree_percentage
                      ? `${cadet.degree_percentage}%`
                      : '-'
                  }
                />
                <CVField
                  label='CGPA (Till Last Sem)'
                  value={cadet.cgpa_till_last_semester}
                />
              </CVSection>

              {/* IMU Details */}
              <CVSection title='IMU Details'>
                <CVField label='IMU Rank' value={cadet.imu_rank} />
                <CVField
                  label='IMU Average %'
                  value={
                    cadet.imu_avg_percentage
                      ? `${cadet.imu_avg_percentage}%`
                      : '-'
                  }
                />
                <CVField label='Semester 1' value={cadet.imu_sem1} />
                <CVField label='Semester 2' value={cadet.imu_sem2} />
                <CVField label='Semester 3' value={cadet.imu_sem3} />
                <CVField label='Semester 4' value={cadet.imu_sem4} />
                <CVField label='Semester 5' value={cadet.imu_sem5} />
                <CVField label='Semester 6' value={cadet.imu_sem6} />
                <CVField label='Semester 7' value={cadet.imu_sem7} />
                <CVField label='Semester 8' value={cadet.imu_sem8} />
              </CVSection>

              {/* Course & Training */}
              <CVSection title='Course & Training Details'>
                <CVField label='Batch' value={cadet.batch} />
                <CVField label='Batch Rank' value={cadet.batch_rank} />
                <CVField
                  label='Number of Arrears'
                  value={cadet.no_of_arrears}
                />
                <CVField
                  label='Passing Out Date'
                  value={
                    cadet.passing_out_date
                      ? new Date(cadet.passing_out_date).toLocaleDateString()
                      : '-'
                  }
                />
                <CVField
                  label='Age at Passing Out'
                  value={cadet.age_at_passing_out}
                />
                <CVField
                  label='Post Applied For'
                  value={cadet.post_applied_for}
                />
              </CVSection>

              {/* Family Details */}
              <CVSection title='Family Details'>
                <CVField
                  label="Father's Occupation"
                  value={cadet.father_occupation}
                />
                <CVField
                  label="Mother's Occupation"
                  value={cadet.mother_occupation}
                />
                <CVField
                  label="Sibling's Occupation"
                  value={cadet.sibling_occupation}
                />
                <CVField
                  label='Marine Relatives'
                  value={cadet.marine_relative}
                />
              </CVSection>

              {/* Additional Information */}
              <CVSection title='Additional Information'>
                <CVField label='Languages Known' value={cadet.language_known} />
                <CVField
                  label='Educational Loan'
                  value={cadet.educational_loan}
                />
                <CVField
                  label='Extra Curricular'
                  value={cadet.extra_curricular}
                />
                <CVField label='Status' value={cadet.status} />
              </CVSection>

              {/* Address */}
              <div className='mb-6'>
                <h3 className='text-lg font-semibold text-gray-800 mb-3 border-b pb-2'>
                  Address
                </h3>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <p className='text-sm text-gray-600 mb-2'>
                    <strong>Current Address:</strong>
                  </p>
                  <p className='text-sm text-gray-900 mb-3'>
                    {cadet.address || '-'}
                  </p>
                  <p className='text-sm text-gray-600 mb-2'>
                    <strong>Permanent Address:</strong>
                  </p>
                  <p className='text-sm text-gray-900'>
                    {cadet.permanent_address || '-'}
                  </p>
                </div>
              </div>

              {/* Institute Information */}
              <CVSection title='Institute Information'>
                <CVField label='Institute' value={cadet.institute_name} />
                <CVField
                  label='Submission Date'
                  value={
                    cadet.created_at
                      ? new Date(cadet.created_at).toLocaleDateString()
                      : '-'
                  }
                />
              </CVSection>
            </div>

            {/* Footer */}
            <div className='bg-gray-50 px-6 py-4 flex justify-end border-t'>
              <Button onClick={onClose} variant='default'>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CVViewModal;
