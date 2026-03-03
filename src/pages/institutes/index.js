import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { Plus, Mail, FileText } from 'lucide-react';
import InstitutesTable from './InstitutesTable';
import SendEmailModal from './SendEmailModal';
import ExtendTokenModal from './ExtendTokenModal';
import { Button } from 'components/ui/button';
import Permission from 'components/common/Permission';

const InstitutesManagement = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state?.returnState || null;

  const [searchTerm, setSearchTerm] = useState(returnState?.searchTerm || '');
  const [pagination, setPagination] = useState(
    returnState?.pagination || {
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
    },
  );
  const [sortConfig, setSortConfig] = useState(
    returnState?.sortConfig || {
      sortBy: '',
      sortOrder: '',
    },
  );
  const searchTimeoutRef = React.useRef(null);
  const [selectedInstitutes, setSelectedInstitutes] = useState([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [extendTokenInstitute, setExtendTokenInstitute] = useState(null);

  const handleExtendToken = (institute) => {
    setExtendTokenInstitute(institute);
  };

  const fetchInstitutes = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    sortBy = sortConfig.sortBy,
    sortOrder = sortConfig.sortOrder,
    search = searchTerm,
  ) => {
    try {
      setLoading(true);
      const response = await api.get('/institutes', {
        params: {
          page,
          limit,
          sortBy: sortBy || undefined,
          sortOrder: sortOrder || undefined,
          search: search || undefined,
        },
      });

      const { data, total, page: currentPage, limit: perPage } = response.data;
      setInstitutes(data);
      setPagination({
        current_page: currentPage,
        per_page: perPage,
        total: total,
        last_page: Math.ceil(total / perPage),
      });
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to fetch institutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes(
      pagination.current_page,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
    );
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    fetchInstitutes(
      newPage,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
    );
  };

  const handleLimitChange = (newLimit) => {
    fetchInstitutes(
      1,
      newLimit,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
    );
  };

  const handleSortChange = (field, order) => {
    const newSortOrder = order.toUpperCase();
    setSortConfig({ sortBy: field, sortOrder: newSortOrder });
    fetchInstitutes(1, pagination.per_page, field, newSortOrder, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchInstitutes(
        1,
        pagination.per_page,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        value,
      );
    }, 300);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSortConfig({ sortBy: '', sortOrder: '' });
    fetchInstitutes(1, pagination.per_page, '', '', '');
    toast.success('Data refreshed');
  };

  const handleEdit = (institute) => {
    navigate(`/institutes/edit/${institute.id}`, {
      state: {
        instituteData: institute,
        returnState: {
          pagination,
          sortConfig,
          searchTerm,
        },
      },
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/institutes/${id}`);
      toast.success('Institute deleted successfully');

      // If deleting the last item on current page (and not on first page), go to previous page
      if (institutes.length === 1 && pagination.current_page > 1) {
        fetchInstitutes(
          pagination.current_page - 1,
          pagination.per_page,
          sortConfig.sortBy,
          sortConfig.sortOrder,
          searchTerm,
        );
      } else {
        fetchInstitutes(
          pagination.current_page,
          pagination.per_page,
          sortConfig.sortBy,
          sortConfig.sortOrder,
          searchTerm,
        );
      }
    } catch (error) {
      console.error('Error deleting institute:', error);
      toast.error('Failed to delete institute');
    }
  };

  return (
    <div className='py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 ml-2'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Institutes</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Manage maritime training institutes and their details
          </p>
        </div>
        <div className='flex gap-2'>
          <Permission module='institutes' action='view'>
            <Button
              variant='outline'
              onClick={() => navigate('/institutes/submissions')}
              className='gap-2'
            >
              <FileText size={20} />
              View Submissions
            </Button>
          </Permission>

          {selectedInstitutes.length === 0 && (
            <Button
              variant='outline'
              onClick={() => {
                toast.error(
                  'Please select at least one institute to send an email',
                );
              }}
              className='gap-2'
            >
              <Mail size={20} />
              Send Email
            </Button>
          )}

          <Permission module='institutes' action='create'>
            <Button
              variant='default'
              onClick={() => navigate('/institutes/addNewInstitue')}
            >
              <Plus size={20} />
              Add Institute
            </Button>
          </Permission>
        </div>
      </div>

      {selectedInstitutes.length > 0 && (
        <div className='mb-4 flex items-center gap-4 bg-[#3a5f9e]/10 p-3 rounded-lg border border-[#3a5f9e]/20 animate-in fade-in slide-in-from-top-2'>
          <span className='text-sm text-[#3a5f9e] font-medium'>
            You have selected {selectedInstitutes.length} institute
            {selectedInstitutes.length !== 1 ? 's' : ''}. Choose an action:
          </span>
          <div className='flex gap-2 ml-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSelectedInstitutes([])}
              className='text-[#3a5f9e] border-[#3a5f9e]/20 hover:bg-[#3a5f9e]/10'
            >
              Clear Selection
            </Button>
            <Button
              size='sm'
              onClick={() => setIsEmailModalOpen(true)}
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white gap-2'
            >
              <Mail size={16} />
              Send Email to Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table Component */}
      <InstitutesTable
        institutes={institutes}
        loading={loading}
        searchTerm={searchTerm}
        pagination={pagination}
        sortConfig={sortConfig}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleExtendToken={handleExtendToken}
        handlePageChange={handlePageChange}
        handlePerPageChange={handleLimitChange}
        handleSortChange={handleSortChange}
        handleSearch={handleSearch}
        handleRefresh={handleRefresh}
        selectedInstitutes={selectedInstitutes}
        onSelectionChange={setSelectedInstitutes}
      />

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        selectedInstitutes={selectedInstitutes}
        onSuccess={() => setSelectedInstitutes([])}
      />

      <ExtendTokenModal
        isOpen={!!extendTokenInstitute}
        onClose={() => setExtendTokenInstitute(null)}
        institute={extendTokenInstitute}
        onSuccess={() => {
          setExtendTokenInstitute(null);
          fetchInstitutes(
            pagination.current_page,
            pagination.per_page,
            sortConfig.sortBy,
            sortConfig.sortOrder,
            searchTerm,
          );
        }}
      />
    </div>
  );
};

export default InstitutesManagement;
