import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Star,
  Filter,
  FileText,
} from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import CVViewModal from './CVViewModal';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

const CadetTable = ({
  cadets,
  loading,
  pagination,
  handlePageChange,
  handlePerPageChange,
  sortConfig,
  handleSortChange,
  searchTerm,
  handleSearch,
  handleRefresh,
  selectedInstitute,
  handleInstituteChange,
  institutes,
  selectedCadets,
  onSelectionChange,
  showShortlistedOnly,
  onToggleShortlisted,
  shortlistStats,
}) => {
  const navigate = useNavigate();
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [selectedCadetForCV, setSelectedCadetForCV] = useState(null);

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

  // Check if cadet meets shortlisting criteria
  const isShortlisted = (cadet) => {
    return (
      parseFloat(cadet.tenth_percentage) >= 85 &&
      parseFloat(cadet.tenth_maths) >= 80 &&
      parseFloat(cadet.tenth_science) >= 80 &&
      parseFloat(cadet.tenth_english) >= 80 &&
      parseFloat(cadet.twelfth_percentage) >= 80 &&
      parseFloat(cadet.twelfth_english) >= 75 &&
      parseFloat(cadet.twelfth_physics) >= 75 &&
      parseFloat(cadet.twelfth_chemistry) >= 75 &&
      parseFloat(cadet.twelfth_maths) >= 75 &&
      parseInt(cadet.imu_rank) <= 3000 &&
      parseFloat(cadet.bmi) < 25
    );
  };

  const columns = [
    {
      field: 'id',
      headerName: 'Sr. No',
      width: '70px',
      sortable: false,
      renderCell: ({ index }) => (
        <span className='text-sm text-gray-500 font-medium'>
          {(pagination?.current_page - 1) * pagination?.per_page + index + 1}
        </span>
      ),
    },
    {
      field: 'shortlist_indicator',
      headerName: '',
      width: '50px',
      sortable: false,
      renderCell: ({ row }) =>
        isShortlisted(row) ? (
          <Star
            className='text-yellow-500 fill-yellow-500'
            size={18}
            title='Shortlisted'
          />
        ) : null,
    },
    {
      field: 'institute_name',
      headerName: 'Institute',
      width: '180px',
      sortable: false,
      renderCell: ({ value }) => (
        <span className='truncate block w-full' title={value}>
          {value || '-'}
        </span>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      width: '180px',
      renderCell: ({ row }) => (
        <span
          className='font-medium text-gray-900 truncate block w-full'
          title={row.name}
        >
          {row.name}
        </span>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: '200px',
      renderCell: ({ value }) => (
        <span className='truncate block w-full' title={value}>
          {value}
        </span>
      ),
    },
    { field: 'phone', headerName: 'Contact', width: '130px' },
    { field: 'gender', headerName: 'Gender', width: '80px' },
    {
      field: 'dob',
      headerName: 'DOB',
      width: '100px',
      valueGetter: (value) =>
        value ? new Date(value).toLocaleDateString() : '-',
    },
    { field: 'hometown', headerName: 'Hometown', width: '150px' },
    { field: 'blood_group', headerName: 'Blood Group', width: '100px' },
    { field: 'height', headerName: 'Height (cm)', width: '100px' },
    { field: 'weight', headerName: 'Weight (kg)', width: '100px' },
    { field: 'bmi', headerName: 'BMI', width: '80px' },

    { field: 'indos_number', headerName: 'INDoS', width: '120px' },
    { field: 'cdc_number', headerName: 'CDC Number', width: '120px' },
    { field: 'passport_number', headerName: 'Passport', width: '120px' },

    { field: 'course', headerName: 'Course', width: '120px' },
    { field: 'batch', headerName: 'Batch', width: '120px' },
    { field: 'batch_rank', headerName: 'Batch Rank', width: '100px' },
    {
      field: 'passing_out_date',
      headerName: 'Passing Out',
      width: '120px',
      valueGetter: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      field: 'age_at_passing_out',
      headerName: 'Age at Passing',
      width: '120px',
    },

    { field: 'tenth_board', headerName: '10th Board', width: '120px' },
    { field: 'tenth_year', headerName: '10th Year', width: '100px' },
    { field: 'tenth_percentage', headerName: '10th %', width: '80px' },
    { field: 'tenth_maths', headerName: '10th Maths', width: '100px' },
    { field: 'tenth_science', headerName: '10th Science', width: '100px' },
    { field: 'tenth_english', headerName: '10th English', width: '100px' },

    { field: 'twelfth_board', headerName: '12th Board', width: '120px' },
    { field: 'twelfth_year', headerName: '12th Year', width: '100px' },
    { field: 'twelfth_percentage', headerName: '12th %', width: '80px' },
    { field: 'twelfth_english', headerName: '12th English', width: '100px' },
    { field: 'twelfth_physics', headerName: '12th Physics', width: '100px' },
    { field: 'twelfth_chemistry', headerName: '12th Chem', width: '100px' },
    { field: 'twelfth_maths', headerName: '12th Maths', width: '100px' },
    { field: 'pcm_percentage', headerName: 'PCM %', width: '80px' },

    { field: 'degree_percentage', headerName: 'Degree %', width: '100px' },
    { field: 'no_of_arrears', headerName: 'Arrears', width: '80px' },

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

    {
      field: 'extra_curricular',
      headerName: 'Extra Curricular',
      width: '200px',
    },

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
      field: 'created_at',
      headerName: 'Created At',
      width: '150px',
      valueGetter: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '80px',
      align: 'right',
      sortable: false,
      sticky: 'right',
      cellClassName: 'bg-white',
      headerClassName: 'bg-white',
      renderCell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={() => navigate(`/cadets/view/${row.id}`)}
            >
              <Eye className='mr-2 h-4 w-4' />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedCadetForCV(row);
                setCvModalOpen(true);
              }}
            >
              <FileText className='mr-2 h-4 w-4' />
              View CV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
          <div className='flex items-center gap-4 w-full md:w-auto flex-1'>
            <div className='flex items-center bg-gray-50 rounded-lg px-3 border border-gray-400 w-full md:w-80'>
              <Search className='text-gray-400' size={18} />
              <input
                type='text'
                placeholder='Search cadets...'
                className='w-full p-2.5 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <Select
              value={selectedInstitute}
              onValueChange={handleInstituteChange}
            >
              <SelectTrigger className='w-[200px] bg-white border-gray-300'>
                <SelectValue placeholder='Filter by Institute' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Institutes</SelectItem>
                {institutes.map((institute) => (
                  <SelectItem
                    key={institute.id}
                    value={institute.id.toString()}
                  >
                    {institute.institute_name || institute.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex gap-2'>
            <Button
              variant={showShortlistedOnly ? 'default' : 'outline'}
              onClick={onToggleShortlisted}
              className='flex items-center gap-2 h-10'
              title={
                showShortlistedOnly
                  ? 'Show all cadets'
                  : 'Show shortlisted only'
              }
            >
              <Filter size={16} />
              <span className='hidden sm:inline'>
                {showShortlistedOnly ? 'Shortlisted' : 'All'}
              </span>
              {shortlistStats?.total_shortlisted > 0 && (
                <span className='ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold'>
                  {shortlistStats.total_shortlisted}
                </span>
              )}
            </Button>
            <Button
              variant='outline'
              onClick={handleRefresh}
              className='flex items-center gap-2 h-10'
              title='Refresh data'
            >
              <RotateCcw size={16} />
              <span className='hidden sm:inline'>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <ReusableDataTable
          columns={columns}
          rows={cadets}
          loading={loading}
          pagination={pagination}
          handlePageChange={handlePageChange}
          handlePerPageChange={handlePerPageChange}
          sortConfig={sortConfig}
          handleSortChange={handleSortChange}
          checkboxSelection={true}
          rowSelectionModel={selectedCadets}
          onRowSelectionModelChange={onSelectionChange}
          rowClassName={(row) => (isShortlisted(row) ? 'bg-green-50/50' : '')}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : showShortlistedOnly
                ? 'No shortlisted cadets found'
                : 'No cadets available'
          }
        />
      </div>

      {/* CV View Modal */}
      <CVViewModal
        cadet={selectedCadetForCV}
        isOpen={cvModalOpen}
        onClose={() => {
          setCvModalOpen(false);
          setSelectedCadetForCV(null);
        }}
      />
    </>
  );
};

export default CadetTable;
