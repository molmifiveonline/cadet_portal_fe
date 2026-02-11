import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { Plus, Search, Filter, RotateCcw } from 'lucide-react';
import InstitutesTable from './InstitutesTable';
import { Button } from 'components/ui/button';

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
        <Button
          variant='default'
          onClick={() => navigate('/institutes/addNewInstitue')}
        >
          <Plus size={20} />
          Add Institute
        </Button>
      </div>

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
      />
    </div>
  );
};

export default InstitutesManagement;
