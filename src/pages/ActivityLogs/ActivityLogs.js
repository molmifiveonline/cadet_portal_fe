import React, { useState, useEffect } from 'react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Search, History } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';
import PageHeader from '../../components/common/PageHeader';

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
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

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
      field: 'display_name',
      headerName: 'User',
      width: '200px',
      renderCell: ({ row }) => {
        // The backend merges Admin names and Institute names into 'display_name'
        // If it's missing, fallback to the raw pieces or email
        const firstName = row.first_name || '';
        const lastName = row.last_name || '';
        const fallbackName = `${firstName} ${lastName}`.trim();
        const displayName =
          row.display_name ||
          row.user_name ||
          fallbackName ||
          row.user_email ||
          'Unknown User';

        return (
          <div className='flex flex-col'>
            <span className='font-medium text-gray-900'>{displayName}</span>
            {row.user_email && (
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
            <span className='text-sm'>{formatDateForDisplay(value)}</span>
            <span className='text-xs text-gray-500'>
              {date.toLocaleTimeString()}
            </span>
          </div>
        );
      },
    },
  ];

  const fetchLogs = React.useCallback(
    async (
      page = 1,
      limit = 10,
      search = '',
      sortBy = sortConfig.sortBy,
      sortOrder = sortConfig.sortOrder,
    ) => {
      setLoading(true);
      try {
        const response = await api.get('/activity-logs/recent', {
          params: {
            page,
            limit,
            search: search.trim() !== '' ? search : undefined,
            sortBy,
            sortOrder,
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
    },
    [sortConfig.sortBy, sortConfig.sortOrder],
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchLogs(
      currentPage,
      rowsPerPage,
      searchTerm,
      sortConfig.sortBy,
      sortConfig.sortOrder,
    );
  }, [
    currentPage,
    rowsPerPage,
    searchTerm,
    sortConfig.sortBy,
    sortConfig.sortOrder,
    fetchLogs,
  ]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerPageChange = (newPerPage) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    const newSortOrder = order.toUpperCase();
    setSortConfig({ sortBy: field, sortOrder: newSortOrder });
    setCurrentPage(1); // Optionally reset to page 1 on sort
  };

  return (
    <div className='py-6 space-y-6'>
      <PageHeader
        title="Activity Logs"
        subtitle="View system activities from the last 3 months"
        icon={History}
      />

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
          sortConfig={sortConfig}
          handleSortChange={handleSortChange}
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
