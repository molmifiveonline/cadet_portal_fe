import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Edit,
  Eye,
  Filter,
  Trash2,
  ClipboardCheck,
} from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { Button } from '../../components/ui/button';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';
import {
  getShortlistCriteriaStatus,
  meetsShortlistCriteria,
} from '../../lib/utils/shortlistCriteria';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

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
  selectedInstitute = 'all',
  handleInstituteChange = () => {},
  institutes = [],
  selectedDrive = 'all',
  handleDriveChange = () => {},
  drives = [],
  selectedCourse = 'all',
  handleCourseChange = () => {},
  selectedYear = 'all',
  handleYearChange = () => {},
  selectedCadets = [],
  onSelectionChange = () => {},
  showShortlistedOnly = false,
  onToggleShortlisted = () => {},
  shortlistStats = null,
  onDelete = () => {},
  onStatusChange = () => {},
  showAssessmentScore = false,
}) => {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i);


  // Check if cadet meets shortlisting criteria
  const isShortlisted = (cadet) => meetsShortlistCriteria(cadet);

  const columns = [
    {
      field: 'cadet_unique_id',
      headerName: 'Cadet ID',
      width: '120px',
      sortable: true,
      renderCell: ({ value }) => (
        <span className='px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100 uppercase'>
          {value || '-'}
        </span>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '140px',
      sortable: true,
      renderCell: ({ row }) => {
        const effectiveStatus =
          row.status || (isShortlisted(row) ? 'Shortlisted' : undefined);
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={effectiveStatus}
              onValueChange={(val) =>
                onStatusChange && onStatusChange(row.id, val)
              }
            >
              <SelectTrigger className='h-8 w-full text-xs shrink-0'>
                <SelectValue placeholder='Select Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Shortlisted'>Shortlisted</SelectItem>
                <SelectItem value='Assessment'>Assessment</SelectItem>
                <SelectItem value='Interviewed'>Interviewed</SelectItem>
                <SelectItem value='Selected'>Selected</SelectItem>
                <SelectItem value='Rejected'>Rejected</SelectItem>
                <SelectItem value='CTV Assigned'>CTV Assigned</SelectItem>
                <SelectItem value='Onboarded'>Onboarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
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
    ...(showAssessmentScore
      ? [
          {
            field: 'assessment_score',
            headerName: 'Assessment Score',
            width: '140px',
            sortable: true,
            renderCell: ({ row }) => {
              const score = row.assessment_score ?? row.calculated_score;
              return score || score === 0 ? (
                <span className='px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold'>
                  {Number(score).toFixed(2)}
                </span>
              ) : (
                '-'
              );
            },
          },
        ]
      : []),
    { field: 'contact_number', headerName: 'Contact', width: '130px' },
    { field: 'gender', headerName: 'Gender', width: '80px' },
    {
      field: 'date_of_birth',
      headerName: 'DOB',
      width: '120px',
      valueGetter: (value) => formatDateForDisplay(value),
    },
    {
      field: 'place_of_birth',
      headerName: 'POB',
      width: '150px',
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

    { field: 'course', headerName: 'Course', width: '120px' },
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
      width: '130px',
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
    {
      field: 'twelfth_pcm_avg_percentage',
      headerName: 'PCM %',
      width: '130px',
    },

    { field: 'no_of_arrears', headerName: 'Arrears', width: '80px' },

    { field: 'imu_rank', headerName: 'IMU Rank', width: '100px' },
    {
      field: 'imu_avg_all_semester_percentage',
      headerName: 'IMU Avg %',
      width: '100px',
    },
    { field: 'imu_sem_1_percentage', headerName: 'Sem 1', width: '80px' },
    { field: 'imu_sem_2_percentage', headerName: 'Sem 2', width: '80px' },
    { field: 'imu_sem_3_percentage', headerName: 'Sem 3', width: '80px' },
    { field: 'imu_sem_4_percentage', headerName: 'Sem 4', width: '80px' },
    { field: 'imu_sem_5_percentage', headerName: 'Sem 5', width: '80px' },
    { field: 'imu_sem_6_percentage', headerName: 'Sem 6', width: '80px' },
    { field: 'imu_sem_7_percentage', headerName: 'Sem 7', width: '80px' },
    { field: 'imu_sem_8_percentage', headerName: 'Sem 8', width: '80px' },

    {
      field: 'created_at',
      headerName: 'Created At',
      width: '150px',
      valueGetter: (val) => formatDateForDisplay(val),
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
            onClick={() =>
              navigate(`/cadets/view/${row.id}`, {
                state: {
                  returnPath: window.location.pathname,
                  returnState: {
                    pagination,
                    sortConfig,
                    searchTerm,
                    selectedInstitute,
                    selectedYear,
                    showShortlistedOnly,
                  },
                },
              })
            }
            title='View Details'
          >
            <Eye size={16} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50'
            onClick={() =>
              navigate(`/cadets/view/${row.id}`, {
                state: {
                  editMode: true,
                  returnPath: window.location.pathname,
                  returnState: {
                    pagination,
                    sortConfig,
                    searchTerm,
                    selectedInstitute,
                    selectedYear,
                    showShortlistedOnly,
                  },
                },
              })
            }
            title='Edit'
          >
            <Edit size={16} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50'
            onClick={() => navigate(`/cadets/assess/${row.id}`)}
            title='Assess Cadet'
          >
            <ClipboardCheck size={16} />
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
          <div className='flex flex-wrap items-center gap-3 w-full md:w-auto flex-1'>
            <div className='flex items-center bg-gray-50 rounded-lg px-3 border border-gray-400 w-full lg:w-80'>
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
              <SelectTrigger className='w-full sm:w-[200px] bg-white border-gray-300'>
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
              <SelectTrigger className='w-full sm:w-[140px] bg-white border-gray-300'>
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
          rowSelectionModel={selectedCadets}
          onRowSelectionModelChange={onSelectionChange}
          getRowClassName={(row) => getShortlistCriteriaStatus(row).rowClassName}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : showShortlistedOnly
                ? 'No shortlisted cadets found'
                : 'No cadets available'
          }
        />
      </div>
    </>
  );
};

export default CadetTable;
