import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Eye, Edit, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import ReusableDataTable from '../../components/common/ReusableDataTable';

const AssessmentTab = ({ drive }) => {
  useParams();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');


  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch cadets eligible for assessment in this drive
      const response = await api.get(
        `/cadets?course_type=${drive.course_type}&instituteId=${drive.institute_id}&status=Eligible for Assessment&limit=1000`,
      );
      if (response.data && response.data.data) {
        setCadets(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cadets:', error);
      toast.error('Failed to load cadets');
    } finally {
      setLoading(false);
    }
  }, [drive.course_type, drive.institute_id]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets]);

  const filteredCadets = React.useMemo(() => {
    return cadets.filter(cadet => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || (
        cadet.name_as_in_indos_cert?.toLowerCase().includes(search) ||
        cadet.cadet_unique_id?.toLowerCase().includes(search)
      );
      
      return matchesSearch;
    });
  }, [cadets, searchTerm]);

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
      field: 'name_as_in_indos_cert',
      headerName: 'Name',
      width: '180px',
      sortable: true,
      renderCell: ({ row }) => (
        <span className='font-medium text-gray-900 truncate block w-full' title={row.name_as_in_indos_cert}>
          {row.name_as_in_indos_cert}
        </span>
      ),
    },
    { field: 'ces_test', headerName: 'CES1', width: '80px', sortable: true },
    { field: 'qa_test', headerName: 'QA', width: '80px', sortable: true },
    { field: 'ces_test_2', headerName: 'CES2', width: '80px', sortable: true },
    { field: 'english_test', headerName: 'English', width: '80px', sortable: true },
    { field: 'essay_writing_mark', headerName: 'Essay', width: '80px', sortable: true },
    {
      field: 'calculated_score',
      headerName: 'Total',
      width: '100px',
      sortable: true,
      renderCell: ({ value }) => (value ? parseFloat(value).toFixed(2) : '-'),
    },
    {
      field: 'assessment_remarks',
      headerName: 'Remarks',
      width: '180px',
      sortable: true,
      renderCell: ({ value }) => (
        <span className='truncate block w-full' title={value}>
          {value || '-'}
        </span>
      ),
    },
    {
      field: 'mark_for_interview',
      headerName: 'Interview?',
      width: '100px',
      sortable: true,
      align: 'center',
      renderCell: ({ value }) => (
        value ? (
          <CheckCircle className='text-green-600' size={20} />
        ) : (
          <XCircle className='text-red-600' size={20} />
        )
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '120px',
      sortable: false,
      sticky: 'right',
      cellClassName: 'bg-white',
      align: 'right',
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 justify-end'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => window.open(`/assessments/${row.id}`, '_blank')}
            className='h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            title={row.calculated_score ? 'Edit Assessment' : 'Start Assessment'}
          >
            {row.calculated_score ? <Edit size={16} /> : <Plus size={16} />}
          </Button>
          {row.calculated_score && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => window.open(`/assessments/${row.id}`, '_blank')}
              className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'
              title='View Assessment'
            >
              <Eye size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-[#3a5f9e]' size={40} />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>Assessment Management</h2>
          <p className='text-sm text-gray-600'>Manage cadet assessments for this recruitment drive</p>
        </div>
        <div className='flex items-center gap-4'>
          <Input
            placeholder='Search cadets...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-64'
          />
        </div>
      </div>

      <div className='bg-white shadow-sm overflow-hidden'>
        <ReusableDataTable
          columns={columns}
          rows={filteredCadets}
          loading={loading}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : 'No cadets eligible for assessment'
          }
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default AssessmentTab;