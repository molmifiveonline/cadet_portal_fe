import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
  Trash2,
  Upload,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Permission from '../../components/common/Permission';

const InstituteSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [importingId, setImportingId] = useState(null);

  // Pagination State
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: null, // 'import', 'delete', 'bulk-delete', 'bulk-import'
    id: null,
    data: null,
  });

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchSubmissions(1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubmissions = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    search = searchTerm,
  ) => {
    setLoading(true);
    try {
      const response = await api.get('/institutes/submissions', {
        params: { page, limit, search },
      });
      const { data, total, page: currentPage, limit: perPage } = response.data;

      setSubmissions(data || []);
      setPagination({
        current_page: currentPage || page,
        per_page: perPage || limit,
        total: total || (data ? data.length : 0),
        last_page: Math.ceil((total || 0) / (perPage || limit)),
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSubmissions(1, pagination.per_page, value);
    }, 500);
  };

  const handlePageChange = (newPage) => {
    fetchSubmissions(newPage);
  };

  const handlePerPageChange = (newLimit) => {
    fetchSubmissions(1, newLimit);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    fetchSubmissions(1, pagination.per_page, '');
    toast.success('Refreshed');
  };

  // Actions
  const handleImportClick = (id) => {
    setConfirmationModal({
      isOpen: true,
      type: 'import',
      id,
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      id,
    });
  };

  const handleBulkDeleteClick = () => {
    setConfirmationModal({
      isOpen: true,
      type: 'bulk-delete',
      data: selectedSubmissions,
    });
  };

  const handleBulkImportClick = () => {
    // Filter out already imported submissions if needed, strictly speaking backend handles it but good to warn?
    // Backend returns status for each.
    setConfirmationModal({
      isOpen: true,
      type: 'bulk-import',
      data: selectedSubmissions,
    });
  };

  const handleConfirm = async () => {
    const { type, id, data } = confirmationModal;
    setConfirmationModal((prev) => ({ ...prev, isLoading: true }));

    try {
      if (type === 'import') {
        setImportingId(id); // For row spinner if needed, though modal covers it
        const response = await api.post(`/institutes/submissions/${id}/import`);
        const { stats } = response.data;
        if (stats) {
          toast.success(
            `Import Processed: ${stats.success} successful, ${stats.failed} failed`,
          );
        } else {
          toast.success(response.data.message);
        }
      } else if (type === 'delete') {
        await api.delete(`/institutes/submissions/${id}`);
        toast.success('Submission deleted');
      } else if (type === 'bulk-delete') {
        const response = await api.delete('/institutes/submissions/bulk', {
          data: { ids: data },
        });
        toast.success(response.data.message);
        setSelectedSubmissions([]);
      } else if (type === 'bulk-import') {
        const response = await api.post('/institutes/submissions/bulk-import', {
          ids: data,
        });
        const { results } = response.data;
        const successCount = results.filter(
          (r) => r.status === 'success',
        ).length;
        const failures = results.filter((r) => r.status === 'failed');

        if (successCount > 0) {
          toast.success(`Bulk Import: ${successCount} successful`);
        }

        if (failures.length > 0) {
          const reasons = {};
          failures.forEach((f) => {
            const msg = f.reason || 'Unknown error';
            reasons[msg] = (reasons[msg] || 0) + 1;
          });

          Object.entries(reasons).forEach(([reason, count]) => {
            toast.error(`${count} submission(s) failed: ${reason}`);
          });
        }

        setSelectedSubmissions([]);
      }

      fetchSubmissions();
      setConfirmationModal({ isOpen: false, type: null, id: null, data: null });
    } catch (error) {
      console.error(`Error in ${type}:`, error);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setImportingId(null);
      setConfirmationModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      field: 'institute_name',
      headerName: 'Institute',
      minWidth: 200,
      flex: 1,
      renderCell: ({ row }) => (
        <span className='font-medium text-gray-900'>
          {row.institute_name || `ID: ${row.institute_id?.substring(0, 8)}...`}
        </span>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: ({ value }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'imported'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      field: 'original_name',
      headerName: 'File Name',
      minWidth: 250,
      flex: 1,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <FileSpreadsheet className='w-4 h-4 text-green-600 flex-shrink-0' />
          <span className='truncate' title={row.original_name}>
            {row.original_name}
          </span>
        </div>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Date',
      width: 110,
      renderCell: ({ value }) => (
        <div className='flex flex-col'>
          <span>{new Date(value).toLocaleDateString()}</span>
          <span className='text-xs text-gray-400'>
            {new Date(value).toLocaleTimeString()}
          </span>
        </div>
      ),
    },

    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      align: 'right',
      sticky: 'right',
      cellClassName: 'bg-white',
      headerClassName: 'bg-white',
      renderCell: ({ row }) => (
        <div className='flex justify-end gap-2'>
          <a
            href={`${api.defaults.baseURL}/institutes/submissions/${row.id}/download?token=${localStorage.getItem('token')}`}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8 w-8'
            title='Download'
          >
            <Download className='w-4 h-4' />
          </a>

          <Permission module='institutes' action='edit'>
            {row.status !== 'imported' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleImportClick(row.id)}
                disabled={importingId === row.id}
                className='h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700'
                title='Import'
              >
                {importingId === row.id ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Upload className='w-4 h-4' />
                )}
              </Button>
            )}
          </Permission>

          <Permission module='institutes' action='delete'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleDeleteClick(row.id)}
              className='h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50'
              title='Delete'
            >
              <Trash2 className='w-4 h-4' />
            </Button>
          </Permission>
        </div>
      ),
    },
  ];

  const getModalContent = () => {
    switch (confirmationModal.type) {
      case 'import':
        return {
          title: 'Import Submission',
          message:
            'Are you sure you want to import this submission? It will add cadets to the database.',
          confirmText: 'Import',
          confirmClass: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'delete':
        return {
          title: 'Delete Submission',
          message:
            'Are you sure you want to delete this submission? This action cannot be undone.',
          confirmText: 'Delete',
          confirmClass: 'bg-red-600 hover:bg-red-700',
        };
      case 'bulk-delete':
        return {
          title: 'Bulk Delete',
          message: `Are you sure you want to delete ${selectedSubmissions.length} submissions?`,
          confirmText: 'Delete All',
          confirmClass: 'bg-red-600 hover:bg-red-700',
        };
      case 'bulk-import':
        return {
          title: 'Bulk Import',
          message: `Are you sure you want to import ${selectedSubmissions.length} submissions?`,
          confirmText: 'Import All',
          confirmClass: 'bg-blue-600 hover:bg-blue-700',
        };
      default:
        return {};
    }
  };

  const modalContent = getModalContent();

  return (
    <div className='p-6'>
      <div className='space-y-6'>
        <div className='flex flex-col '>
          <h1 className='text-2xl font-bold text-gray-800'>
            Institute Submissions
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            Review and import Excel submissions from institutes
          </p>
        </div>

        <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <div className='flex items-center gap-2 w-full md:w-auto flex-1'>
              <div className='relative w-full md:w-80'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Search by institute or file name...'
                  className='w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              {selectedSubmissions.length > 0 && (
                <div className='flex gap-2 animate-in fade-in slide-in-from-left-2'>
                  <Permission module='institutes' action='edit'>
                    <Button
                      size='sm'
                      variant='default'
                      onClick={handleBulkImportClick}
                      className='gap-2'
                    >
                      <Upload className='w-4 h-4' />
                      Import ({selectedSubmissions.length})
                    </Button>
                  </Permission>
                  <Permission module='institutes' action='delete'>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={handleBulkDeleteClick}
                      className='gap-2'
                    >
                      <Trash2 className='w-4 h-4' />
                      Delete ({selectedSubmissions.length})
                    </Button>
                  </Permission>
                </div>
              )}
            </div>
            <Button variant='outline' onClick={handleRefresh} title='Refresh'>
              <RotateCcw className='w-4 h-4' />
            </Button>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <ReusableDataTable
            columns={columns}
            rows={submissions}
            loading={loading}
            pagination={pagination}
            handlePageChange={handlePageChange}
            handlePerPageChange={handlePerPageChange}
            checkboxSelection={true}
            rowSelectionModel={selectedSubmissions}
            onRowSelectionModelChange={setSelectedSubmissions}
            emptyMessage='No submissions found'
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal({
            isOpen: false,
            type: null,
            id: null,
            data: null,
          })
        }
        onConfirm={handleConfirm}
        title={modalContent.title}
        message={modalContent.message}
        confirmText={modalContent.confirmText}
        confirmButtonClass={modalContent.confirmClass}
        isLoading={confirmationModal.isLoading}
      />
    </div>
  );
};

export default InstituteSubmissions;
