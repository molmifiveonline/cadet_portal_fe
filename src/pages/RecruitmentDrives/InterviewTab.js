import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Eye, Edit, Loader2 } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';

const InterviewTab = ({ drive }) => {
  useParams();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');


  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch cadets marked for interview in this drive
      const response = await api.get(
        `/cadets?drive_id=${drive.id}&status=Eligible for Interview&limit=1000`,
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
  }, [drive.id]);

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
    {
      field: 'interview_date',
      headerName: 'Interview Date',
      width: '140px',
      sortable: true,
      renderCell: ({ row }) => (
        formatDateForDisplay(row.interview?.interview_date)
      ),
    },
    {
      field: 'panel_members',
      headerName: 'Panel Members',
      width: '160px',
      sortable: true,
      renderCell: ({ row }) => row.interview?.panel_members || '-',
    },
    {
      field: 'evaluation_score',
      headerName: 'Score',
      width: '90px',
      sortable: true,
      renderCell: ({ row }) => row.interview?.evaluation_score || '-',
    },
    {
      field: 'total_score',
      headerName: 'Total Score',
      width: '110px',
      sortable: true,
      renderCell: ({ row }) => (
        row.interview?.total_score ? (
          <span className='font-semibold'>
            {parseFloat(row.interview.total_score).toFixed(2)}
          </span>
        ) : '-'
      ),
    },
    {
      field: 'final_decision',
      headerName: 'Decision',
      width: '120px',
      sortable: true,
      renderCell: ({ row }) => {
        const decision = row.interview?.final_decision;
        if (decision === 'selected') return <span className='text-green-600 font-medium'>Selected</span>;
        if (decision === 'rejected') return <span className='text-red-600 font-medium'>Rejected</span>;
        return <span className='text-gray-500'>-</span>;
      },
    },
    {
      field: 'remarks',
      headerName: 'Remarks',
      width: '180px',
      sortable: true,
      renderCell: ({ row }) => (
        <span className='truncate block w-full' title={row.interview?.remarks}>
          {row.interview?.remarks || '-'}
        </span>
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
            onClick={() => window.open(`/interviews/${row.id}`, '_blank')}
            className='h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            title={row.interview ? 'Edit Interview' : 'Start Interview'}
          >
            {row.interview ? <Edit size={16} /> : <Plus size={16} />}
          </Button>
          {row.interview && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => window.open(`/interviews/${row.id}`, '_blank')}
              className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'
              title='View Interview'
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
          <h2 className='text-xl font-semibold text-gray-900'>Interview Management</h2>
          <p className='text-sm text-gray-600'>Manage cadet interviews for this recruitment drive</p>
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
              : 'No cadets eligible for interview'
          }
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default InterviewTab;