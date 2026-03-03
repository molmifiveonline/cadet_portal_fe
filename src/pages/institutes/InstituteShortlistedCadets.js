import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ListChecks, Search, RotateCcw, Eye, Edit } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { useAuth } from '../../context/AuthContext';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { Button } from '../../components/ui/button';
import TextModal from '../../components/common/TextModal';

const InstituteShortlistedCadets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc',
  });

  useEffect(() => {
    fetchShortlistedCadets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShortlistedCadets = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    search = searchTerm,
    sort = sortConfig,
  ) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search || undefined,
        sort_key: sort.key,
        sort_dir: sort.direction,
      };

      const response = await api.get('/cadets/institute-shortlisted', {
        params,
      });

      const {
        data,
        total,
        page: currentPage,
        limit: perPage,
        last_page,
      } = response.data;

      const cadetList = Array.isArray(data) ? data : data?.data || [];

      setCadets(cadetList);
      setPagination({
        current_page: currentPage || page,
        per_page: perPage || limit,
        total: total || cadetList.length,
        last_page:
          last_page ||
          Math.ceil((total || cadetList.length) / (perPage || limit)),
      });
    } catch (error) {
      console.error('Error fetching shortlisted cadets:', error);
      toast.error('Failed to load shortlisted cadets');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchShortlistedCadets(newPage, pagination.per_page, searchTerm);
  };

  const handlePerPageChange = (newLimit) => {
    fetchShortlistedCadets(1, newLimit, searchTerm);
  };

  const handleSortChange = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSort = { key, direction };
    setSortConfig(newSort);
    fetchShortlistedCadets(1, pagination.per_page, searchTerm, newSort);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    // Simple debounce if needed, but fetchShortlistedCadets is called from input onChange
  };

  const executeSearch = () => {
    fetchShortlistedCadets(1, pagination.per_page, searchTerm);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    fetchShortlistedCadets(1, pagination.per_page, '');
    toast.success('Data refreshed');
  };

  const handleReadMore = (title, content) => {
    setModalContent({ title, content });
    setModalOpen(true);
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
      field: 'status',
      headerName: 'Status',
      width: '130px',
      sortable: true,
      renderCell: ({ row }) => {
        const status = row.status || 'Shortlisted';
        return (
          <span className='px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800'>
            {status}
          </span>
        );
      },
    },
    {
      field: 'name_as_in_indos_cert',
      headerName: 'Name',
      width: '200px',
      sortable: true,
      renderCell: ({ value }) => (
        <span
          className='font-medium text-gray-900 truncate block w-full'
          title={value}
        >
          {value}
        </span>
      ),
    },
    {
      field: 'email_id',
      headerName: 'Email',
      width: '200px',
      renderCell: ({ value }) => (
        <span className='truncate block w-full text-gray-600' title={value}>
          {value || '-'}
        </span>
      ),
    },
    {
      field: 'contact_number',
      headerName: 'Contact',
      width: '130px',
      renderCell: ({ value }) => (
        <span className='text-gray-600'>{value || '-'}</span>
      ),
    },
    {
      field: 'course',
      headerName: 'Course',
      width: '120px',
      renderCell: ({ value }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value?.toLowerCase().includes('engine')
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {value || '-'}
        </span>
      ),
    },
    { field: 'tenth_avg_percentage', headerName: '10th %', width: '80px' },
    {
      field: 'twelfth_pcm_avg_percentage',
      headerName: '12th %',
      width: '80px',
    },
    { field: 'imu_rank', headerName: 'IMU Rank', width: '100px' },
    {
      field: 'any_extra_curricular_achievement',
      headerName: 'Achievements',
      width: '200px',
      renderCell: ({ value }) => {
        if (!value) return '-';
        const maxLength = 30;
        if (value.length <= maxLength)
          return <span title={value}>{value}</span>;
        return (
          <div className='flex items-center'>
            <span className='truncate mr-1 text-gray-600' title={value}>
              {value.substring(0, maxLength)}...
            </span>
            <button
              onClick={() => handleReadMore('Extra Curricular', value)}
              className='text-green-600 hover:text-green-800 text-xs font-medium whitespace-nowrap'
            >
              Read More
            </button>
          </div>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '100px',
      align: 'right',
      sortable: false,
      sticky: 'right',
      cellClassName: 'bg-white',
      headerClassName: 'bg-white',
      renderCell: ({ row }) => (
        <div className='flex justify-end gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50'
            onClick={() => navigate(`/cadets/view/${row.id}`)}
            title='View Details'
          >
            <Eye size={16} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            onClick={() =>
              navigate(`/cadets/view/${row.id}`, {
                state: {
                  editMode: true,
                  returnPath: '/institute/shortlisted-cadets',
                },
              })
            }
            title='Edit Cadet'
          >
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='py-6 px-4 md:px-8 bg-slate-50 min-h-screen'>
      {/* Header */}
      <div className='mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-green-600 rounded-lg shadow-sm'>
            <ListChecks className='text-white' size={24} />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Shortlisted Cadets
            </h1>
            <p className='text-gray-500 text-sm'>
              {user?.first_name || 'Institute Portal'} — Shortlisted cadets from
              your institute
            </p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-500 mb-1 capitalize'>
            Total Shortlisted
          </p>
          <div className='flex items-baseline gap-2'>
            <span className='text-3xl font-bold text-gray-900'>
              {pagination.total}
            </span>
            <span className='text-sm text-green-600 font-medium'>
              Qualified
            </span>
          </div>
        </div>
        <div className='h-12 w-12 bg-green-50 rounded-full flex items-center justify-center'>
          <ListChecks className='text-green-600' size={24} />
        </div>
      </div>

      {/* Search and Refresh */}
      <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
          <div className='flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 w-full md:w-96 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-300 transition-all'>
            <Search className='text-gray-400' size={18} />
            <input
              type='text'
              placeholder='Search by name or email...'
              className='w-full p-2.5 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm'
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
            />
          </div>

          <div className='flex gap-2 w-full md:w-auto'>
            <Button
              onClick={executeSearch}
              className='flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white'
            >
              Search
            </Button>
            <Button
              variant='outline'
              onClick={handleRefresh}
              className='flex items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50'
            >
              <RotateCcw size={16} />
              <span className='hidden sm:inline'>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Reusable Data Table */}
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
          emptyMessage={
            searchTerm
              ? `No cadets found matching "${searchTerm}"`
              : 'No shortlisted cadets available for your institute'
          }
        />
      </div>

      <TextModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
      />
    </div>
  );
};

export default InstituteShortlistedCadets;
