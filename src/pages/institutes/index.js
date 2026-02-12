import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { Plus, Mail, FileText } from 'lucide-react';
import InstitutesTable from './InstitutesTable';
import SendEmailModal from './SendEmailModal';
import { Button } from 'components/ui/button';
import Permission from 'components/common/Permission';

const InstitutesManagement = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: '',
    sortOrder: '',
  });
  const searchTimeoutRef = React.useRef(null);
  const [selectedInstitutes, setSelectedInstitutes] = useState([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

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
    fetchInstitutes(1); // Fetch first page on mount
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

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
      state: { instituteData: institute },
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this institute?')) {
      try {
        await api.delete(`/institutes/${id}`);
        toast.success('Institute deleted successfully');
        fetchInstitutes(
          pagination.current_page,
          pagination.per_page,
          sortConfig.sortBy,
          sortConfig.sortOrder,
          searchTerm,
        );
      } catch (error) {
        console.error('Error deleting institute:', error);
        toast.error('Failed to delete institute');
      }
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
        <div className='mb-4 flex items-center gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2'>
          <span className='text-sm text-blue-700 font-medium'>
            {selectedInstitutes.length} institute
            {selectedInstitutes.length !== 1 ? 's' : ''} selected
          </span>
          <div className='flex gap-2 ml-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSelectedInstitutes([])}
              className='text-blue-600 border-blue-200 hover:bg-blue-100'
            >
              Clear Selection
            </Button>
            <Button
              size='sm'
              onClick={() => setIsEmailModalOpen(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white gap-2'
            >
              <Mail size={16} />
              Send Email
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
        sortConfig={sortConfig} // Added to sync sort state
        handleEdit={handleEdit}
        handleDelete={handleDelete}
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
    </div>
  );
};

export default InstitutesManagement;
