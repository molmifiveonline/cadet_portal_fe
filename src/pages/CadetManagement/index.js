import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Upload, ListFilter } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import CadetTable from './CadetTable';
import CadetImportModal from './CadetImportModal';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import { Button } from '../../components/ui/button';
import Permission from '../../components/common/Permission';

const CadetManagement = () => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for filters and search
  const [selectedInstitute, setSelectedInstitute] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  // Sorting State
  const [sortConfig, setSortConfig] = useState({
    sortBy: '',
    sortOrder: '',
  });

  const [selectedCadets, setSelectedCadets] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);
  const [shortlistStats, setShortlistStats] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    cadetId: null,
    cadetName: '',
  });

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchInstitutes();
    fetchCadets(1);
    fetchShortlistStats();

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInstitutes = async () => {
    try {
      const [allResponse, filteredResponse] = await Promise.all([
        api.get('/institutes'),
        api.get('/institutes?hasSubmissions=true'),
      ]);
      setInstitutes(allResponse.data.data || []);
      setFilteredInstitutes(filteredResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to load institutes');
    }
  };

  const fetchShortlistStats = async () => {
    try {
      const response = await api.get('/cadets/shortlisted/stats');
      setShortlistStats(response.data);
    } catch (error) {
      console.error('Error fetching shortlist stats:', error);
    }
  };

  const fetchCadets = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    sortBy = sortConfig.sortBy,
    sortOrder = sortConfig.sortOrder,
    search = searchTerm,
    instituteId = selectedInstitute,
    shortlistedOnly = showShortlistedOnly,
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        search: search || undefined,
      };

      if (instituteId && instituteId !== 'all') {
        params.instituteId = instituteId;
      }

      const endpoint = shortlistedOnly ? '/cadets/shortlisted' : '/cadets';
      const response = await api.get(endpoint, { params });

      const {
        data,
        total,
        page: currentPage,
        limit: perPage,
        last_page,
      } = response.data;

      // Handle potential response structure variations
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
      console.error('Error fetching cadets:', error);
      toast.error('Failed to load cadets');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchCadets(
      newPage,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
      selectedInstitute,
    );
  };

  const handleLimitChange = (newLimit) => {
    fetchCadets(
      1,
      newLimit,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
      selectedInstitute,
    );
  };

  const handleSortChange = (field, order) => {
    const newSortOrder = order.toUpperCase();
    setSortConfig({ sortBy: field, sortOrder: newSortOrder });
    fetchCadets(
      1,
      pagination.per_page,
      field,
      newSortOrder,
      searchTerm,
      selectedInstitute,
    );
  };

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCadets(
        1,
        pagination.per_page,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        value,
        selectedInstitute,
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

  const handleRefresh = () => {
    setSearchTerm('');
    setSortConfig({ sortBy: '', sortOrder: '' });
    // Keep selected institute or reset? Typically refreshing data keeps filters but resets search/sort
    // Here resetting search/sort as per other pages
    fetchCadets(1, pagination.per_page, '', '', '', selectedInstitute);
    toast.success('Data refreshed');
  };

  const handleImportSuccess = () => {
    fetchCadets(1);
    fetchShortlistStats();
    toast.success('Cadets imported successfully');
  };

  const handleToggleShortlisted = () => {
    const newValue = !showShortlistedOnly;
    setShowShortlistedOnly(newValue);
    fetchCadets(
      1,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
      selectedInstitute,
      newValue,
    );
  };

  const handleDeleteClick = (cadet) => {
    setDeleteModal({
      isOpen: true,
      cadetId: cadet.id,
      cadetName: cadet.name,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/cadets/${deleteModal.cadetId}`);
      toast.success('Cadet deleted successfully');
      setDeleteModal({ isOpen: false, cadetId: null, cadetName: '' });
      fetchCadets(pagination.current_page); // Refresh list
    } catch (error) {
      console.error('Error deleting cadet:', error);
      toast.error('Failed to delete cadet');
    }
  };

  return (
    <div className='py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 ml-2'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Cadet Management</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Manage, track, and monitor all cadets
          </p>
        </div>
        <div className='flex gap-2'>
          <Permission module='cadets' action='create'>
            <Button
              variant='default'
              onClick={() => setShowImportModal(true)}
              className='gap-2'
            >
              <Upload size={18} />
              Import Cadets
            </Button>
          </Permission>
          <Permission module='cadets' action='view'>
            <Button
              variant='outline'
              onClick={() => navigate('/cadets/shortlist')}
              className='gap-2'
            >
              <ListFilter size={18} />
              View Shortlist
            </Button>
          </Permission>
        </div>
      </div>

      {selectedCadets.length > 0 && (
        <div className='mb-4 flex items-center gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2'>
          <span className='text-sm text-blue-700 font-medium'>
            {selectedCadets.length} cadet
            {selectedCadets.length !== 1 ? 's' : ''} selected
          </span>
          <div className='flex gap-2 ml-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSelectedCadets([])}
              className='text-blue-600 border-blue-200 hover:bg-blue-100'
            >
              Clear Selection
            </Button>
            {/* Add bulk actions here if needed */}
          </div>
        </div>
      )}

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
        handleRefresh={handleRefresh}
        selectedInstitute={selectedInstitute}
        handleInstituteChange={handleInstituteChange}
        institutes={filteredInstitutes}
        selectedCadets={selectedCadets}
        onSelectionChange={setSelectedCadets}
        showShortlistedOnly={showShortlistedOnly}
        onToggleShortlisted={handleToggleShortlisted}
        shortlistStats={shortlistStats}
        onDelete={handleDeleteClick}
      />

      <CadetImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        institutes={institutes}
        onSuccess={handleImportSuccess}
      />

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
