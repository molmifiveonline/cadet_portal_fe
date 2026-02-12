import React, { useState, useEffect } from 'react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Search, RefreshCw } from 'lucide-react';
import api from '../../lib/utils/apiConfig';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    {
      field: 'id',
      headerName: 'Sr. No',
      width: '80px',
      sortable: false,
      renderCell: ({ index }) => (
        <span className='text-sm text-gray-500 font-medium'>
          {(pagination?.current_page - 1) * pagination?.per_page + index + 1}
        </span>
      ),
    },
    {
      field: 'user_name',
      headerName: 'User',
      width: '200px',
      renderCell: ({ row }) => {
        // Display user's full name if available, otherwise email, otherwise "Unknown"
        const firstName = row.first_name || '';
        const lastName = row.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const displayName = fullName || row.user_email || 'Unknown User';

        return (
          <div className='flex flex-col'>
            <span className='font-medium text-gray-900'>{displayName}</span>
            {fullName && row.user_email && (
              <span className='text-xs text-gray-500'>{row.user_email}</span>
            )}
          </div>
        );
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      width: '180px',
      renderCell: ({ value }) => (
        <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium'>
          {value}
        </span>
      ),
    },
    { field: 'details', headerName: 'Details', width: '300px' },
    {
      field: 'created_at',
      headerName: 'Timestamp',
      width: '180px',
      renderCell: ({ value }) => {
        if (!value) return '-';
        const date = new Date(value);
        return (
          <div className='flex flex-col'>
            <span className='text-sm'>{date.toLocaleDateString()}</span>
            <span className='text-xs text-gray-500'>
              {date.toLocaleTimeString()}
            </span>
          </div>
        );
      },
    },
    {
      field: 'ip_address',
      headerName: 'IP Address',
      width: '150px',
      renderCell: ({ value }) => value || '-',
    },
  ];

  const fetchLogs = async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/activity-logs/recent', {
        params: {
          page,
          limit,
          search: search.trim() !== '' ? search : undefined,
        },
      });

      const data = response.data;
      setLogs(data.data || []);
      setPagination({
        current_page: data.pagination?.page || page,
        per_page: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        last_page: data.pagination?.totalPages || 1,
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Could not load activity logs.',
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchLogs(currentPage, rowsPerPage, searchTerm);
  }, [currentPage, rowsPerPage, searchTerm]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerPageChange = (newPerPage) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchLogs(currentPage, rowsPerPage, searchTerm);
    toast.success('Activity logs refreshed');
  };

  return (
    <div className='py-6 space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>Activity Logs</h1>
          <p className='text-slate-500 mt-1'>
            View system activities from the last 3 months
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant='outline'
          className='flex items-center gap-2'
        >
          <RefreshCw className='w-4 h-4' />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <Input
            type='text'
            placeholder='Search by user name, email, action, or details...'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className='pl-10'
          />
        </div>
        {searchTerm && (
          <p className='text-sm text-gray-500 mt-2'>
            Searching for: <strong>{searchTerm}</strong>
          </p>
        )}
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
        <ReusableDataTable
          columns={columns}
          rows={logs}
          loading={loading}
          pagination={pagination}
          handlePageChange={handlePageChange}
          handlePerPageChange={handlePerPageChange}
          pageSize={rowsPerPage}
          checkboxSelection={false}
          emptyMessage={
            searchTerm
              ? 'No activity logs found matching your search.'
              : 'No activity logs found in the last 3 months.'
          }
        />
      </div>
    </div>
  );
};

export default ActivityLogs;
