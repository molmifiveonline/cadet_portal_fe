import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Edit,
  Eye,
  Star,
  Filter,
  Trash2,
} from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import TextModal from '../../components/common/TextModal';

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
  selectedYear,
  handleYearChange,
  selectedCadets,
  onSelectionChange,
  showShortlistedOnly,
  onToggleShortlisted,
  shortlistStats,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState({
    title: '',
    content: '',
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i);

  const handleReadMore = (title, content) => {
    setModalContent({ title, content });
    setModalOpen(true);
  };

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
      parseFloat(cadet.tenth_avg_percentage) >= 85 &&
      parseFloat(cadet.tenth_std_maths) >= 80 &&
      parseFloat(cadet.tenth_std_science) >= 80 &&
      parseFloat(cadet.tenth_std_english) >= 80 &&
      parseFloat(cadet.twelfth_pcm_avg_percentage) >= 80 &&
      parseFloat(cadet.twelfth_std_english) >= 75 &&
      parseFloat(cadet.twelfth_std_physics) >= 75 &&
      parseFloat(cadet.twelfth_std_chemistry) >= 75 &&
      parseFloat(cadet.twelfth_std_maths) >= 75 &&
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
      field: 'name_as_in_indos_cert',
      headerName: 'Name',
      width: '180px',
      renderCell: ({ row }) => (
        <span
          className='font-medium text-gray-900 truncate block w-full'
          title={row.name_as_in_indos_cert}
        >
          {row.name_as_in_indos_cert}
        </span>
      ),
    },
    {
      field: 'email_id',
      headerName: 'Email',
      width: '200px',
      renderCell: ({ value }) => (
        <span className='truncate block w-full' title={value}>
          {value}
        </span>
      ),
    },
    { field: 'contact_number', headerName: 'Contact', width: '130px' },
    { field: 'gender', headerName: 'Gender', width: '80px' },
    {
      field: 'date_of_birth',
      headerName: 'DOB',
      width: '120px',
      valueGetter: (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('en-GB');
      },
    },
    {
      field: 'home_town_or_nearby_airport',
      headerName: 'Hometown',
      width: '150px',
    },
    { field: 'blood_group', headerName: 'Blood Group', width: '100px' },
    { field: 'height_in_cms', headerName: 'Height (cm)', width: '100px' },
    { field: 'weight_in_kgs', headerName: 'Weight (kg)', width: '100px' },
    { field: 'bmi', headerName: 'BMI', width: '80px' },

    { field: 'indos_number', headerName: 'INDoS', width: '120px' },
    { field: 'cdc_number', headerName: 'CDC Number', width: '120px' },
    { field: 'passport_number', headerName: 'Passport', width: '120px' },

    { field: 'course', headerName: 'Course', width: '120px' },
    { field: 'batch', headerName: 'Batch', width: '120px' },
    {
      field: 'batch_rank_out_of_72_cadets',
      headerName: 'Batch Rank',
      width: '100px',
    },
    {
      field: 'passing_out_date',
      headerName: 'Passing Out Year',
      width: '130px',
      valueGetter: (value) => {
        if (!value) return '-';
        // Passing out date is now saved strictly as a 4-digit Year in DB
        const strVal = String(value);
        if (strVal.length >= 4) {
          return strVal.substring(0, 4);
        }
        return strVal;
      },
    },
    {
      field: 'age_when_passing_out',
      headerName: 'Age at Passing',
      width: '120px',
    },

    { field: 'tenth_std_board', headerName: '10th Board', width: '120px' },
    {
      field: 'tenth_std_pass_out_year',
      headerName: '10th Year',
      width: '100px',
    },
    { field: 'tenth_avg_percentage', headerName: '10th %', width: '80px' },
    { field: 'tenth_std_maths', headerName: '10th Maths', width: '100px' },
    { field: 'tenth_std_science', headerName: '10th Science', width: '100px' },
    { field: 'tenth_std_english', headerName: '10th English', width: '100px' },

    { field: 'twelfth_std_board', headerName: '12th Board', width: '120px' },
    {
      field: 'twelfth_std_pass_out_year',
      headerName: '12th Year',
      width: '100px',
    },
    {
      field: 'twelfth_pcm_avg_percentage',
      headerName: '12th %',
      width: '80px',
    },
    {
      field: 'twelfth_std_english',
      headerName: '12th English',
      width: '100px',
    },
    {
      field: 'twelfth_std_physics',
      headerName: '12th Physics',
      width: '100px',
    },
    { field: 'twelfth_std_chemistry', headerName: '12th Chem', width: '100px' },
    { field: 'twelfth_std_maths', headerName: '12th Maths', width: '100px' },
    { field: 'pcm_percentage', headerName: 'PCM %', width: '80px' },

    { field: 'degree_percentage', headerName: 'Degree %', width: '100px' },
    { field: 'no_of_arrears', headerName: 'Arrears', width: '80px' },

    { field: 'imu_rank', headerName: 'IMU Rank', width: '100px' },
    {
      field: 'imu_avg_all_semester_percentage',
      headerName: 'IMU Avg %',
      width: '100px',
    },
    { field: 'imu_sem_', headerName: 'Sem 1', width: '80px' },
    { field: 'imu_sem_', headerName: 'Sem 2', width: '80px' },
    { field: 'imu_sem_', headerName: 'Sem 3', width: '80px' },
    { field: 'imu_sem_', headerName: 'Sem 4', width: '80px' },
    { field: 'imu_sem_', headerName: 'Sem 5', width: '80px' },
    { field: 'imu_sem_', headerName: 'Sem 6', width: '80px' },
    { field: 'imu_sem_', headerName: 'Sem 7', width: '80px' },
    { field: 'imu_sem_', headerName: 'Sem 8', width: '80px' },

    {
      field: 'any_extra_curricular_achievement',
      headerName: 'Extra Curricular',
      width: '200px',
      renderCell: ({ value }) => {
        if (!value) return '-';
        const maxLength = 30; // Truncate after 30 characters
        if (value.length <= maxLength)
          return <span title={value}>{value}</span>;
        return (
          <div className='flex items-center'>
            <span className='truncate mr-1' title={value}>
              {value.substring(0, maxLength)}...
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReadMore('Extra Curricular', value);
              }}
              className='text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap'
            >
              Read More
            </button>
          </div>
        );
      },
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
      width: '140px',
      align: 'right',
      sortable: false,
      sticky: 'right',
      cellClassName: 'bg-white',
      headerClassName: 'bg-white',
      renderCell: ({ row }) => (
        <div className='flex items-center justify-end gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            onClick={() => navigate(`/cadets/view/${row.id}`)}
            title='View Details'
          >
            <Eye size={16} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50'
            onClick={() =>
              navigate(`/cadets/view/${row.id}`, { state: { editMode: true } })
            }
            title='Edit'
          >
            <Edit size={16} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50'
            onClick={() => onDelete(row)}
            title='Delete'
          >
            <Trash2 size={16} />
          </Button>
        </div>
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

            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className='w-[150px] bg-white border-gray-300'>
                <SelectValue placeholder='Filter by Year' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Years</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
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

      <TextModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
      />
    </>
  );
};

export default CadetTable;
