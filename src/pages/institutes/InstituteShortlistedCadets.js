import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ListChecks, Search, Edit, Upload } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import api from '../../lib/utils/apiConfig';
import { useAuth } from '../../context/AuthContext';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import { Button } from '../../components/ui/button';

const InstituteShortlistedCadets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCadetId, setUploadingCadetId] = useState(null);
  const [selectedUploadCadet, setSelectedUploadCadet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
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

  const [pendingSummary, setPendingSummary] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('all');

  const fetchPendingSummary = async () => {
    try {
      const response = await api.get('/cadets/institute-pending-summary');
      setPendingSummary(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching pending request summary:', error);
    }
  };

  useEffect(() => {
    fetchPendingSummary();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchShortlistedCadets(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchShortlistedCadets = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    search = searchTerm,
    sort = sortConfig,
    driveId = selectedDriveId,
  ) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search || undefined,
        sort_key: sort.key,
        sort_dir: sort.direction,
        drive_id: driveId !== 'all' ? driveId : undefined,
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
  };

  const handleDriveFilterChange = (driveId) => {
    setSelectedDriveId(driveId);
    fetchShortlistedCadets(1, pagination.per_page, searchTerm, sortConfig, driveId);
  };

  const getUniqueDrivesList = () => {
    const drivesMap = new Map();
    // Add drives from pending summary
    pendingSummary.forEach(item => {
      if (item.drive_id) {
        drivesMap.set(String(item.drive_id), item.drive_name || `Drive #${item.drive_id}`);
      } else {
        drivesMap.set('null', 'Unassigned / General');
      }
    });
    // Add drives from current cadets list
    cadets.forEach(cadet => {
      if (cadet.drive_id) {
        drivesMap.set(String(cadet.drive_id), cadet.drive_name || `Drive #${cadet.drive_id}`);
      } else {
        drivesMap.set('null', 'Unassigned / General');
      }
    });

    return Array.from(drivesMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  };

  const handleUploadClick = (cadet) => {
    setSelectedUploadCadet(cadet);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleCvTemplateUpload = async (event) => {
    const file = event.target.files?.[0];
    const cadet = selectedUploadCadet;

    if (!file || !cadet) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Please upload the completed .xlsx CV template.');
      event.target.value = '';
      return;
    }

    try {
      setUploadingCadetId(cadet.id);
      const formData = new FormData();
      formData.append('file', file);
      if (cadet.drive_id) {
        formData.append('drive_id', cadet.drive_id);
      }

      const response = await api.post(
        `/cadets/${cadet.id}/cv-template-upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      toast.success(
        response.data?.message || 'Cadet CV details updated successfully',
      );
      fetchPendingSummary();
      fetchShortlistedCadets(
        pagination.current_page,
        pagination.per_page,
        searchTerm,
        sortConfig,
      );
    } catch (error) {
      const errors = error.response?.data?.errors;
      const message =
        Array.isArray(errors) && errors.length > 0
          ? errors.join('\n')
          : error.response?.data?.message || 'Failed to upload CV template';
      toast.error(message);
    } finally {
      setUploadingCadetId(null);
      setSelectedUploadCadet(null);
      event.target.value = '';
    }
  };

  const columns = [
    {
      field: 'cadet_unique_id',
      headerName: 'Cadet ID',
      width: 'auto',
      sortable: false,
      renderCell: ({ value }) => (
        <span className='text-sm text-gray-500 font-medium'>
          {value || '-'}
        </span>
      ),
    },
    {
      field: 'name_as_in_indos_cert',
      headerName: 'Name',
      width: '200px',
      sortable: true,
      renderCell: ({ value, row }) => (
        <div className='flex flex-col gap-1 w-full'>
          <span
            className='font-medium text-gray-900 truncate block w-full'
            title={value}
          >
            {value}
          </span>
          {row.has_pending_academic_request && (
            <span className='inline-flex items-center w-max px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200' title={`Data pending for drive ${row.drive_name || 'Unassigned'}`}>
              📋 Data Pending {row.drive_name ? `— ${row.drive_name}` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      field: 'drive_name',
      headerName: 'Drive',
      width: '150px',
      renderCell: ({ value }) => (
        <span className='truncate block w-full text-gray-600 font-medium' title={value || 'Unassigned'}>
          {value || 'Unassigned'}
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
      renderCell: ({ row }) => {
        const canUpload =
          row.can_edit_pending_details &&
          Number(row.institute_detail_filled || 0) !== 1;
        const isUploading = uploadingCadetId === row.id;

        return (
          <div className='flex justify-end gap-1'>
            {canUpload && (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50'
                onClick={() => handleUploadClick(row)}
                disabled={isUploading}
                title={isUploading ? 'Uploading Excel...' : 'Upload completed Excel'}
              >
                <Upload size={16} />
              </Button>
            )}
            {row.can_edit_pending_details && (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                onClick={() =>
                  navigate(`/cadets/fill-details/${row.id}`, {
                    state: {
                      returnPath: '/institute/shortlisted-cadets',
                    },
                  })
                }
                title='Edit Cadet'
              >
                <Edit size={16} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className='py-6 px-4 md:px-8 bg-slate-50 min-h-screen'>
      <input
        ref={fileInputRef}
        type='file'
        accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        className='hidden'
        onChange={handleCvTemplateUpload}
      />

      {/* Header */}
      <PageHeader
        title="Shortlisted Cadets"
        subtitle={`${user?.first_name || 'Institute Portal'} — Shortlisted cadets from your institute`}
        icon={ListChecks}
      />

      {/* Pending Academic Data Request Banners */}
      {pendingSummary.map((summary) => {
        const driveName = summary.drive_name || 'Unassigned / General';
        const driveId = summary.drive_id !== null ? String(summary.drive_id) : 'null';
        const count = summary.pending_count;

        if (count === 0) return null;

        return (
          <div
            key={driveId}
            className='mb-6 p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl flex items-center justify-between gap-3 shadow-sm'
          >
            <div className='flex items-start gap-3'>
              <span className='text-lg mt-0.5'>⚠️</span>
              <div>
                <h4 className='font-semibold text-sm text-amber-900'>Pending Request</h4>
                <p className='text-xs text-amber-700 mt-0.5'>
                  There are <strong>{count}</strong> cadet(s) with pending academic data requests in recruitment drive <strong>{driveName}</strong>. Please update cadet details.
                </p>
              </div>
            </div>
            {selectedDriveId !== driveId && (
              <Button
                variant='outline'
                size='sm'
                className='bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 text-xs font-semibold'
                onClick={() => handleDriveFilterChange(driveId)}
              >
                Filter to this Drive
              </Button>
            )}
          </div>
        );
      })}

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

      {/* Search & Filter */}
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
            />
          </div>
          <div className='flex items-center gap-2 w-full md:w-auto'>
            <label htmlFor="drive-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Recruitment Drive:
            </label>
            <select
              id="drive-filter"
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-green-100 focus:border-green-300 block p-2.5 transition-all outline-none min-w-[200px]"
              value={selectedDriveId}
              onChange={(e) => handleDriveFilterChange(e.target.value)}
            >
              <option value="all">All Drives</option>
              {getUniqueDrivesList().map(drive => (
                <option key={drive.id} value={drive.id}>
                  {drive.name}
                </option>
              ))}
            </select>
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
    </div>
  );
};

export default InstituteShortlistedCadets;
