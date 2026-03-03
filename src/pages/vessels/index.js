import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import api from '../../lib/utils/apiConfig';
import Permission from '../../components/common/Permission';
import VesselTable from './VesselTable';

const VesselList = () => {
  const navigate = useNavigate();
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: '',
    sortOrder: '',
  });

  const searchTimeoutRef = useRef(null);

  const fetchVessels = async (
    page = pagination.page,
    limit = pagination.limit,
    sortBy = sortConfig.sortBy,
    sortOrder = sortConfig.sortOrder,
    search = searchTerm,
  ) => {
    try {
      setLoading(true);
      const response = await api.get('/vessels', {
        params: {
          page,
          limit,
          sort_key: sortBy || undefined,
          sort_dir: sortOrder ? sortOrder.toLowerCase() : undefined,
          search: search || undefined,
        },
      });

      if (response.data.success) {
        setVessels(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch vessels');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVessels(1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    fetchVessels(
      newPage,
      pagination.limit,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
    );
  };

  const handleLimitChange = (newLimit) => {
    fetchVessels(
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
    fetchVessels(1, pagination.limit, field, newSortOrder, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchVessels(
        1,
        pagination.limit,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        value,
      );
    }, 300);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSortConfig({ sortBy: '', sortOrder: '' });
    fetchVessels(1, pagination.limit, '', '', '');
    toast.success('Data refreshed');
  };

  const handleEditClick = (vessel) => {
    navigate(`/vessels/edit/${vessel.id}`);
  };

  const handleDelete = async (id, name) => {
    try {
      await api.delete(`/vessels/${id}`);
      toast.success('Vessel deleted successfully');
      fetchVessels(
        pagination.page,
        pagination.limit,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        searchTerm,
      );
    } catch (error) {
      toast.error('Failed to delete vessel');
    }
  };

  return (
    <div className='py-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 ml-2'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Vessel Master</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Manage all vessels in the fleet
          </p>
        </div>
        <div className='flex gap-2'>
          <Permission module='vessel-master' action='create'>
            <Button variant='default' onClick={() => navigate('/vessels/add')}>
              <Plus size={20} className='mr-2' />
              Add Vessel
            </Button>
          </Permission>
        </div>
      </div>

      <VesselTable
        vessels={vessels}
        loading={loading}
        searchTerm={searchTerm}
        pagination={pagination}
        sortConfig={sortConfig}
        handleEdit={handleEditClick}
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

export default VesselList;
