import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import PageHeader from '../../components/common/PageHeader';
import api from '../../lib/utils/apiConfig';
import Permission from '../../components/common/Permission';
import MedicalReportTable from './MedicalReportTable';
import PageLoader from '../../components/common/PageLoader';

const MedicalReportList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
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

  const fetchReports = async (
    page = pagination.page,
    limit = pagination.limit,
    sortBy = sortConfig.sortBy,
    sortOrder = sortConfig.sortOrder,
    search = searchTerm,
  ) => {
    try {
      setLoading(true);
      const response = await api.get('/medical-reports', {
        params: {
          page,
          limit,
          sort_key: sortBy || undefined,
          sort_dir: sortOrder ? sortOrder.toLowerCase() : undefined,
          search: search || undefined,
        },
      });

      if (response.data.success) {
        setReports(response.data.data);
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
          });
        }
      }
    } catch (error) {
      toast.error('Failed to fetch medical reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    fetchReports(
      newPage,
      pagination.limit,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
    );
  };

  const handleLimitChange = (newLimit) => {
    fetchReports(
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
    fetchReports(1, pagination.limit, field, newSortOrder, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchReports(
        1,
        pagination.limit,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        value,
      );
    }, 300);
  };

  const handleEditClick = (report) => {
    navigate(`/medical-reports/edit/${report.id}`);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/medical-reports/${id}`);
      toast.success('Medical Report deleted successfully');
      fetchReports(
        pagination.page,
        pagination.limit,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        searchTerm,
      );
    } catch (error) {
      toast.error('Failed to delete medical report');
    }
  };

  return (
    <div className='py-6'>
      <PageHeader
        title="Medical Reports"
        subtitle="Manage master list of medical reports and tests configured in the system"
        icon={ClipboardList}
      >
        <Permission module='medical-centers' action='create'>
          <Button
            variant='default'
            onClick={() => navigate('/medical-reports/add')}
          >
            <Plus size={20} className='mr-2' />
            Add Medical Report
          </Button>
        </Permission>
      </PageHeader>

      {loading && reports.length === 0 ? (
        <PageLoader />
      ) : (
        <MedicalReportTable
          reports={reports}
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
      )}
    </div>
  );
};

export default MedicalReportList;
