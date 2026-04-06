import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import PageHeader from '../../components/common/PageHeader';
import api from '../../lib/utils/apiConfig';
import Permission from '../../components/common/Permission';
import MedicalCenterTable from './MedicalCenterTable';

const MedicalCenterList = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([]);
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

  const fetchCenters = async (
    page = pagination.page,
    limit = pagination.limit,
    sortBy = sortConfig.sortBy,
    sortOrder = sortConfig.sortOrder,
    search = searchTerm,
  ) => {
    try {
      setLoading(true);
      const response = await api.get('/medical-centers', {
        params: {
          page,
          limit,
          sort_key: sortBy || undefined,
          sort_dir: sortOrder ? sortOrder.toLowerCase() : undefined,
          search: search || undefined,
        },
      });

      if (response.data.success) {
        setCenters(response.data.data);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch medical centers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters(1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    fetchCenters(
      newPage,
      pagination.limit,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
    );
  };

  const handleLimitChange = (newLimit) => {
    fetchCenters(
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
    fetchCenters(1, pagination.limit, field, newSortOrder, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCenters(
        1,
        pagination.limit,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        value,
      );
    }, 300);
  };

  const handleEditClick = (center) => {
    navigate(`/medical-centers/edit/${center.id}`);
  };

  const handleDelete = async (id, name) => {
    try {
      await api.delete(`/medical-centers/${id}`);
      toast.success('Medical Center deleted successfully');
      fetchCenters(
        pagination.page,
        pagination.limit,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        searchTerm,
      );
    } catch (error) {
      toast.error('Failed to delete medical center');
    }
  };

  return (
    <div className='py-6'>
      <PageHeader
        title="Medical Centers"
        subtitle="Manage approved clinics and hospitals for cadet medicals"
        icon={Stethoscope}
      >
        <Permission module='medical-centers' action='create'>
          <Button
            variant='default'
            onClick={() => navigate('/medical-centers/add')}
          >
            <Plus size={20} className='mr-2' />
            Add Medical Center
          </Button>
        </Permission>
      </PageHeader>

      <MedicalCenterTable
        centers={centers}
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
      />
    </div>
  );
};

export default MedicalCenterList;
