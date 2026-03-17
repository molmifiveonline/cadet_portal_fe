import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Edit, Loader2, Search } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import ReusableDataTable from '../../components/common/ReusableDataTable';

const CadetsTab = ({ drive, initialStatus = 'all', onStatusFilterChange }) => {
  const { id: driveId } = useParams();
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    fetchCadets();
  }, [driveId]);

  const fetchCadets = async () => {
    try {
      setLoading(true);
      // Fetch all cadets matching the drive's institute and course.
      const response = await api.get(`/cadets?course_type=${drive.course_type}&instituteId=${drive.institute_id}&limit=1000`);
      if (response.data && response.data.data) {
        setCadets(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cadets:', error);
      toast.error('Failed to load cadets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    if (onStatusFilterChange) onStatusFilterChange(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Eligible for Assessment': return 'bg-blue-100 text-blue-800';
      case 'Assessment Completed': return 'bg-green-100 text-green-800';
      case 'Assessment Failed': return 'bg-red-100 text-red-800';
      case 'Eligible for Interview': return 'bg-cyan-100 text-cyan-800';
      case 'Interview Selected': return 'bg-purple-100 text-purple-800';
      case 'Interview Failed': return 'bg-red-100 text-red-800';
      case 'Eligible for Medical': return 'bg-teal-100 text-teal-800';
      case 'Medical Completed': return 'bg-indigo-100 text-indigo-800';
      case 'Medical Failed': return 'bg-red-100 text-red-800';
      case 'CTV Assigned': return 'bg-amber-100 text-amber-800';
      case 'Onboarded': return 'bg-emerald-100 text-emerald-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCadets = useMemo(() => {
    return cadets.filter(cadet => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || (
        cadet.name_as_in_indos_cert?.toLowerCase().includes(search) ||
        cadet.cadet_unique_id?.toLowerCase().includes(search) ||
        cadet.email_id?.toLowerCase().includes(search)
      );
      
      const matchesStatus = selectedStatus === 'all' || cadet.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [cadets, searchTerm, selectedStatus]);

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
      field: 'email_id',
      headerName: 'Email',
      width: '200px',
      sortable: true,
      renderCell: ({ value }) => (
        <span className='truncate block w-full' title={value}>
          {value}
        </span>
      ),
    },
    { field: 'batch_year', headerName: 'Batch', width: '100px', sortable: true },
    { field: 'course', headerName: 'Course', width: '120px', sortable: true },
    {
      field: 'status',
      headerName: 'Status',
      width: '160px',
      sortable: true,
      renderCell: ({ value }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      field: 'calculated_score',
      headerName: 'Assessment Score',
      width: '140px',
      sortable: true,
      renderCell: ({ value }) => (value ? parseFloat(value).toFixed(2) : '-'),
    },
    {
      field: 'final_decision',
      headerName: 'Interview Status',
      width: '140px',
      sortable: true,
      renderCell: ({ value }) => (
        value ? (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'selected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value}
          </span>
        ) : '-'
      ),
    },
    {
      field: 'fit_status',
      headerName: 'Medical Status',
      width: '140px',
      sortable: true,
      renderCell: ({ value }) => (
        value ? (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'Fit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value}
          </span>
        ) : '-'
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '120px',
      sortable: false,
      sticky: 'right',
      align: 'right',
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 justify-end'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => window.open(`/cadets/view/${row.id}`, '_blank')}
            className='h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            title='View Cadet Details'
          >
            <Eye size={16} />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => window.open(`/cadets/view/${row.id}`, { state: { editMode: true } })}
            className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'
            title='Edit Cadet'
          >
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (loading && cadets.length === 0) {
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
          <h2 className='text-xl font-semibold text-gray-900'>Cadets Management</h2>
          <p className='text-sm text-gray-600'>All cadets associated with this recruitment drive</p>
        </div>
        <div className='flex items-center gap-4'>
          <Select
            value={selectedStatus}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className='w-[200px] bg-white border-gray-300'>
              <SelectValue placeholder='Filter by Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              <SelectItem value='Eligible for Assessment'>Eligible for Assessment</SelectItem>
              <SelectItem value='Assessment Failed'>Assessment Failed</SelectItem>
              <SelectItem value='Eligible for Interview'>Eligible for Interview</SelectItem>
              <SelectItem value='Interview Failed'>Interview Failed</SelectItem>
              <SelectItem value='Eligible for Medical'>Eligible for Medical</SelectItem>
              <SelectItem value='Medical Completed'>Medical Completed</SelectItem>
              <SelectItem value='Medical Failed'>Medical Failed</SelectItem>
              <SelectItem value='CTV Assigned'>CTV Assigned</SelectItem>
              <SelectItem value='Onboarded'>Onboarded</SelectItem>
            </SelectContent>
          </Select>

          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              placeholder='Search cadets...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-64 pl-10'
            />
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
        <ReusableDataTable
          columns={columns}
          rows={filteredCadets}
          loading={loading}
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : 'No cadets found for this drive'
          }
          pageSize={10}
        />
      </div>

      <div className='text-sm text-gray-600'>
        Total Cadets: {filteredCadets.length}
      </div>
    </div>
  );
};

export default CadetsTab;
