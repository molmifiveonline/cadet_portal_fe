import React, { useState, useEffect } from 'react';
import api from '../lib/utils/apiConfig';
import CadetHeader from '../components/cadet/CadetHeader';
import CadetTable from '../components/cadet/CadetTable';
import CadetImportModal from '../components/cadet/CadetImportModal';

const CadetManagement = () => {
  const [institutes, setInstitutes] = useState([]);
  const [cadets, setCadets] = useState([]);

  const [selectedInstitute, setSelectedInstitute] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchInstitutes();
    fetchCadets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await api.get('/institutes');
      setInstitutes(response.data.data);
    } catch (error) {
      console.error('Error fetching institutes:', error);
    }
  };

  const fetchCadets = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/cadets?page=${page}&limit=10`;

      if (selectedInstitute && selectedInstitute !== 'all') {
        url += `&instituteId=${selectedInstitute}`;
      }

      const response = await api.get(url);
      setCadets(response.data.data);
      setPagination({
        current_page: response.data.pagination.page,
        per_page: response.data.pagination.limit,
        total: response.data.pagination.total,
        last_page: response.data.pagination.pages,
      });
    } catch (error) {
      console.error('Error fetching cadets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteFilterChange = (value) => {
    setSelectedInstitute(value);
  };

  // Re-fetch when filter changes
  useEffect(() => {
    if (selectedInstitute !== 'all') {
      fetchCadets(1);
    } else if (selectedInstitute === 'all' && !loading) {
      // fetchCadets(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstitute]);

  const handlePageChange = (newPage) => {
    fetchCadets(newPage);
  };

  const handleImportSuccess = () => {
    fetchCadets(1);
  };

  return (
    <div className='p-8 bg-gray-50 min-h-screen'>
      <CadetHeader
        selectedInstitute={selectedInstitute}
        onInstituteChange={handleInstituteFilterChange}
        institutes={institutes}
        onImportClick={() => setShowImportModal(true)}
      />

      <div className='h-[calc(100vh-150px)]'>
        <CadetTable
          cadets={cadets}
          loading={loading}
          pagination={pagination}
          handlePageChange={handlePageChange}
        />
      </div>

      <CadetImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        institutes={institutes}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default CadetManagement;
