import React from 'react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { Button } from '../../components/ui/button';

const CadetTable = ({ cadets, loading, pagination, handlePageChange }) => {
  const getCurrentStageLabel = (stage) => {
    const stageLabels = {
      imported: 'Imported',
      cv_pending: 'CV Pending',
      cv_submitted: 'CV Submitted',
      initial_screening: 'Initial Screening',
      test_scheduled: 'Test Scheduled',
      test_completed: 'Test Completed',
      interview_scheduled: 'Interview Scheduled',
      interview_completed: 'Interview Completed',
      final_evaluation: 'Final Evaluation',
      medical_scheduled: 'Medical Scheduled',
      medical_completed: 'Medical Completed',
      selected: 'Selected',
      standby: 'Standby',
      rejected: 'Rejected',
      joined: 'Joined',
    };
    return stageLabels[stage] || stage;
  };

  const getStageBadgeClass = (stage) => {
    const baseClass =
      'px-3 py-1 rounded-full text-xs font-semibold inline-block';
    if (stage === 'selected' || stage === 'joined')
      return `${baseClass} bg-green-100 text-green-800`;
    if (stage === 'rejected') return `${baseClass} bg-red-100 text-red-800`;
    if (stage && stage.includes('completed'))
      return `${baseClass} bg-cyan-100 text-cyan-800`;
    if (stage && stage.includes('scheduled'))
      return `${baseClass} bg-yellow-100 text-yellow-800`;
    return `${baseClass} bg-gray-200 text-gray-700`;
  };

  const columns = [
    {
      field: 'id',
      headerName: 'S.No',
      width: '70px',
      renderCell: ({ index }) => index + 1,
    },
    {
      field: 'institute_name',
      headerName: 'Institute',
      width: '180px',
      renderCell: ({ value }) => value || '-',
    },
    {
      field: 'name',
      headerName: 'Name',
      width: '180px',
      cellClassName: 'font-medium text-gray-900',
    },
    { field: 'email', headerName: 'Email', width: '200px' },
    { field: 'phone', headerName: 'Contact', width: '130px' },
    { field: 'gender', headerName: 'Gender', width: '80px' },
    {
      field: 'dob',
      headerName: 'DOB',
      width: '100px',
      valueGetter: (value) =>
        value ? new Date(value).toLocaleDateString() : '-',
    },
    { field: 'course', headerName: 'Course', width: '120px' },
    { field: 'batch', headerName: 'Batch', width: '120px' },
    { field: 'indos_number', headerName: 'INDoS', width: '100px' },
    { field: 'tenth_percentage', headerName: '10th %', width: '80px' },
    { field: 'twelfth_percentage', headerName: '12th %', width: '80px' },
    { field: 'pcm_percentage', headerName: 'PCM %', width: '80px' },

    // Extended Fields
    { field: 'hometown', headerName: 'Hometown', width: '150px' },
    { field: 'passing_out_date', headerName: 'Passing Out', width: '120px' },
    { field: 'age_at_passing_out', headerName: 'Age', width: '80px' },
    { field: 'batch_rank', headerName: 'Rank', width: '80px' },
    { field: 'no_of_arrears', headerName: 'Arrears', width: '80px' },

    { field: 'tenth_board', headerName: '10th Board', width: '120px' },
    { field: 'tenth_year', headerName: '10th Year', width: '100px' },
    { field: 'tenth_maths', headerName: '10th Maths', width: '100px' },
    { field: 'tenth_science', headerName: '10th Science', width: '100px' },
    { field: 'tenth_english', headerName: '10th English', width: '100px' },

    { field: 'twelfth_board', headerName: '12th Board', width: '120px' },
    { field: 'twelfth_year', headerName: '12th Year', width: '100px' },
    { field: 'twelfth_english', headerName: '12th English', width: '100px' },
    { field: 'twelfth_physics', headerName: '12th Physics', width: '100px' },
    {
      field: 'twelfth_chemistry',
      headerName: '12th Chemistry',
      width: '100px',
    },
    { field: 'twelfth_maths', headerName: '12th Maths', width: '100px' },

    { field: 'imu_rank', headerName: 'IMU Rank', width: '100px' },
    { field: 'imu_avg_percentage', headerName: 'IMU Avg %', width: '100px' },
    { field: 'imu_sem1', headerName: 'Sem 1', width: '80px' },
    { field: 'imu_sem2', headerName: 'Sem 2', width: '80px' },
    { field: 'imu_sem3', headerName: 'Sem 3', width: '80px' },
    { field: 'imu_sem4', headerName: 'Sem 4', width: '80px' },
    { field: 'imu_sem5', headerName: 'Sem 5', width: '80px' },
    { field: 'imu_sem6', headerName: 'Sem 6', width: '80px' },
    { field: 'imu_sem7', headerName: 'Sem 7', width: '80px' },
    { field: 'imu_sem8', headerName: 'Sem 8', width: '80px' },

    { field: 'bmi', headerName: 'BMI', width: '80px' },
    { field: 'extra_curricular', headerName: 'Activities', width: '200px' },
    {
      field: 'current_stage',
      headerName: 'Current Stage',
      width: '160px',
      renderCell: ({ value }) => (
        <span className={getStageBadgeClass(value)}>
          {getCurrentStageLabel(value)}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '100px',
      renderCell: () => (
        <Button variant='outline' size='sm' className='h-8 text-xs'>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <ReusableDataTable
          columns={columns}
          rows={cadets}
          loading={loading}
          title='Cadets List'
          pageSize={10}
          checkboxSelection={true}
          emptyMessage='No cadets found'
          pagination={pagination}
          handlePageChange={handlePageChange}
          className='h-full border-none'
        />
      </div>
    </div>
  );
};

export default CadetTable;
