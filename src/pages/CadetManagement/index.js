import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, ListFilter, Plus, GraduationCap } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import CadetTable from './CadetTable';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import { Button } from '../../components/ui/button';
import Permission from '../../components/common/Permission';
import PageHeader from '../../components/common/PageHeader';

// Single-table logic with courseType parameter
const CadetManagement = ({
  courseType,
  initialStatus = 'all',
  pageTitle = null,
  showAssessmentScore = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state?.returnState || null;

  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedInstitute, setSelectedInstitute] = useState(
    returnState?.selectedInstitute || 'all',
  );
  const [selectedYear, setSelectedYear] = useState('all');
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

  const [selectedCadets, setSelectedCadets] = useState([]);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    cadetId: null,
    cadetName: '',
  });

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchInstitutes();
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch cadets whenever courseType changes or filters are applied
  useEffect(() => {
    // We only fetch here automatically on courseType change
    fetchCadets(
      pagination.current_page,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
      selectedInstitute,
      selectedYear,
    );
    // Reset selection when course changes
    setSelectedCadets([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseType]);

  const fetchInstitutes = async () => {
    try {
      const response = await api.get('/institutes?hasSubmissions=true');
      setFilteredInstitutes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to load institutes');
    }
  };

  const fetchCadets = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    sortBy = sortConfig.sortBy,
    sortOrder = sortConfig.sortOrder,
    search = searchTerm,
    instituteId = selectedInstitute,
    batchYear = selectedYear,
  ) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(search && { search }),
        ...(courseType && { course_type: courseType }),
        ...(initialStatus &&
          initialStatus !== 'all' && { status: initialStatus }),
      };

      if (instituteId !== 'all') params.instituteId = instituteId;
      if (batchYear !== 'all') params.batch_year = batchYear;

      const response = await api.get('/cadets', { params });

      const data = response.data;
      const cadetList = Array.isArray(data.data)
        ? data.data
        : data?.data?.data || [];

      setCadets(cadetList);
      setPagination({
        current_page: data.page || page,
        per_page: data.limit || limit,
        total: data.total || cadetList.length,
        last_page:
          data.last_page ||
          Math.ceil((data.total || cadetList.length) / (data.limit || limit)),
      });
    } catch (error) {
      console.error('Error fetching cadets:', error);
      toast.error('Failed to load cadets');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => fetchCadets(newPage);

  const handleLimitChange = (newLimit) => fetchCadets(1, newLimit);

  const handleSortChange = (field, order) => {
    const newSortOrder = order.toUpperCase();
    setSortConfig({ sortBy: field, sortOrder: newSortOrder });
    fetchCadets(1, pagination.per_page, field, newSortOrder);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchCadets(
        1,
        pagination.per_page,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        value,
      );
    }, 500);
  };

  const handleInstituteChange = (value) => {
    setSelectedInstitute(value);
    fetchCadets(
      1,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
      value,
    );
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    fetchCadets(
      1,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
      selectedInstitute,
      value,
    );
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSelectedInstitute('all');
    setSelectedYear('all');
    fetchCadets(1, pagination.per_page, '', '', '', 'all', 'all');
  };

  const handleDeleteClick = (cadet) => {
    setDeleteModal({
      isOpen: true,
      cadetId: cadet.id,
      cadetName: cadet.name_as_in_indos_cert || cadet.name,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/cadets/${deleteModal.cadetId}`);
      toast.success('Cadet deleted successfully');
      setDeleteModal({ isOpen: false, cadetId: null, cadetName: '' });

      // If deleting the last item on current page (and not on first page), go to previous page
      if (cadets.length === 1 && pagination.current_page > 1) {
        fetchCadets(pagination.current_page - 1);
      } else {
        fetchCadets(pagination.current_page);
      }
    } catch (error) {
      console.error('Error deleting cadet:', error);
      toast.error('Failed to delete cadet');
    }
  };

  return (
    <div className='py-6'>
      {/* Header */}
      <PageHeader
        title={pageTitle || (courseType ? `${courseType} Cadets` : 'Cadet Management')}
        subtitle={`Manage, track, and monitor ${courseType ? courseType.toLowerCase() : 'all'} cadets`}
        icon={GraduationCap}
      >
        <Permission module='cadets' action='create'>
          <Button
            variant='outline'
            onClick={() => navigate('/institute/submit-excel')}
            className='gap-2'
          >
            <Upload size={18} />
            Import Cadets
          </Button>
        </Permission>
      </PageHeader>

      <div className='mt-6'>
        <CadetTable
          cadets={cadets}
          loading={loading}
          pagination={pagination}
          handlePageChange={handlePageChange}
          handlePerPageChange={handleLimitChange}
          sortConfig={sortConfig}
          handleSortChange={handleSortChange}
          searchTerm={searchTerm}
          handleSearch={handleSearch}
          selectedInstitute={selectedInstitute}
          handleInstituteChange={handleInstituteChange}
          institutes={filteredInstitutes}
          selectedYear={selectedYear}
          handleYearChange={handleYearChange}
          selectedCadets={selectedCadets}
          onSelectionChange={setSelectedCadets}
          onDelete={handleDeleteClick}
          onClearAll={handleClearAll}
          showAssessmentScore={showAssessmentScore}
        />
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, cadetId: null, cadetName: '' })
        }
        onConfirm={handleConfirmDelete}
        title='Delete Cadet'
        message={`Are you sure you want to delete ${deleteModal.cadetName}? This action cannot be undone.`}
      />
    </div>
  );
};

export default CadetManagement;
