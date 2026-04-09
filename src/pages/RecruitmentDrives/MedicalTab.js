import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Eye, Edit, Loader2, Users, FileText, Send } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';

const MedicalTab = ({ drive }) => {
  const { id: driveId } = useParams();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');


  const fetchCadets = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch cadets eligible for medical in this drive
      const response = await api.get(
        `/cadets?drive_id=${drive.id}&status=Eligible for Medical&limit=1000`,
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
      field: 'medical_date',
      headerName: 'Medical Date',
      width: '140px',
      sortable: true,
      renderCell: ({ row }) => (
        formatDateForDisplay(row.medical_result?.medical_date)
      ),
    },
    {
      field: 'medical_time',
      headerName: 'Time',
      width: '100px',
      sortable: true,
      renderCell: ({ row }) => row.medical_result?.medical_time || '-',
    },
    {
      field: 'medical_center_name',
      headerName: 'Medical Center',
      width: '180px',
      sortable: true,
      renderCell: ({ row }) => row.medical_result?.medical_center_name || '-',
    },
    {
      field: 'fit_status',
      headerName: 'Fitness Status',
      width: '140px',
      sortable: true,
      renderCell: ({ row }) => {
        const status = row.medical_result?.fit_status;
        if (status === 'fit') return <span className='text-green-600 font-medium'>Fit</span>;
        if (status === 'unfit') return <span className='text-red-600 font-medium'>Unfit</span>;
        return <span className='text-gray-500'>-</span>;
      },
    },
    {
      field: 'remarks',
      headerName: 'Remarks',
      width: '180px',
      sortable: true,
      renderCell: ({ row }) => (
        <span className='truncate block w-full' title={row.medical_result?.remarks}>
          {row.medical_result?.remarks || '-'}
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
            onClick={() => window.open(`/medical-results/${row.id}`, '_blank')}
            className='h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            title={row.medical_result ? 'Edit Medical' : 'Start Medical'}
          >
            {row.medical_result ? <Edit size={16} /> : <Plus size={16} />}
          </Button>
          {row.medical_result && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => window.open(`/medical-results/${row.id}`, '_blank')}
              className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'
              title='View Medical'
            >
              <Eye size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleConfirmCandidates = async () => {
    try {
      // Bulk action: Confirm candidates
      await api.post(`/medical-results/bulk/confirm`, { drive_id: driveId });
      toast.success('Candidates confirmed successfully');
      fetchCadets();
    } catch (error) {
      toast.error('Failed to confirm candidates');
    }
  };

  const handleCollectAcademicData = async () => {
    try {
      // Bulk action: Collect academic data
      await api.post(`/medical-results/bulk/collect-academic`, { drive_id: driveId });
      toast.success('Academic data collection initiated');
    } catch (error) {
      toast.error('Failed to initiate academic data collection');
    }
  };

  const handleCollectDocuments = async () => {
    try {
      // Bulk action: Collect documents
      await api.post(`/medical-results/bulk/collect-documents`, { drive_id: driveId });
      toast.success('Document collection initiated');
    } catch (error) {
      toast.error('Failed to initiate document collection');
    }
  };


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
          <h2 className='text-xl font-semibold text-gray-900'>Medical Management</h2>
          <p className='text-sm text-gray-600'>Manage cadet medical examinations for this recruitment drive</p>
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

      {/* Bulk Action Buttons */}
      <div className='bg-white rounded-lg border border-gray-200 p-4'>
        <div className='flex items-center gap-4'>
          <Button
            onClick={handleConfirmCandidates}
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700'
          >
            <Users size={16} />
            Confirm Candidates
          </Button>
          <Button
            onClick={handleCollectAcademicData}
            variant='outline'
            className='flex items-center gap-2'
          >
            <FileText size={16} />
            Collect Academic Data
          </Button>
          <Button
            onClick={handleCollectDocuments}
            variant='outline'
            className='flex items-center gap-2'
          >
            <Send size={16} />
            Collect Documents
          </Button>
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
              : 'No cadets eligible for medical examination'
          }
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default MedicalTab;