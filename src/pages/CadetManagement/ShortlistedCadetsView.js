import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import CadetTable from './CadetTable';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const ShortlistedCadetsView = () => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitute, setSelectedInstitute] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [shortlistStats, setShortlistStats] = useState(null);
  const [sending, setSending] = useState(false);

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

  const [selectedCadets, setSelectedCadets] = useState([]);

  useEffect(() => {
    fetchInstitutes();
    fetchShortlistStats();
    fetchShortlistedCadets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await api.get('/institutes');
      setInstitutes(response.data.data || []);
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

  const fetchShortlistedCadets = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    instituteId = selectedInstitute,
    search = searchTerm,
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
        search: search || undefined,
      };

      if (instituteId && instituteId !== 'all') {
        params.instituteId = instituteId;
      }

      const response = await api.get('/cadets/shortlisted', { params });

      const {
        data,
        total,
        page: currentPage,
        limit: perPage,
        last_page,
      } = response.data;

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
      console.error('Error fetching shortlisted cadets:', error);
      toast.error('Failed to load shortlisted cadets');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchShortlistedCadets(
      newPage,
      pagination.per_page,
      selectedInstitute,
      searchTerm,
    );
  };

  const handleLimitChange = (newLimit) => {
    fetchShortlistedCadets(1, newLimit, selectedInstitute, searchTerm);
  };

  const handleSortChange = (field, order) => {
    const newSortOrder = order.toUpperCase();
    setSortConfig({ sortBy: field, sortOrder: newSortOrder });
    // Note: Sorting would need backend support for shortlisted endpoint
    fetchShortlistedCadets(
      1,
      pagination.per_page,
      selectedInstitute,
      searchTerm,
    );
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setTimeout(() => {
      fetchShortlistedCadets(1, pagination.per_page, selectedInstitute, value);
    }, 500);
  };

  const handleInstituteChange = (value) => {
    setSelectedInstitute(value);
    fetchShortlistedCadets(1, pagination.per_page, value, searchTerm);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSortConfig({ sortBy: '', sortOrder: '' });
    fetchShortlistedCadets(1, pagination.per_page, selectedInstitute, '');
    fetchShortlistStats();
    toast.success('Data refreshed');
  };

  const handleSendCVFormEmail = async () => {
    if (!selectedInstitute || selectedInstitute === 'all') {
      toast.error('Please select a specific institute to send CV form emails');
      return;
    }

    try {
      setSending(true);
      const response = await api.post('/cv/send-email', {
        instituteId: selectedInstitute,
      });

      toast.success(
        response.data.message || 'CV form emails sent successfully',
      );

      // Optionally show details
      if (response.data.data) {
        const { institute_name, cadet_count } = response.data.data;
        setTimeout(() => {
          toast.info(
            `Sent CV form links for ${cadet_count} cadet${cadet_count !== 1 ? 's' : ''} to ${institute_name}`,
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error sending CV form emails:', error);
      toast.error(
        error.response?.data?.message || 'Failed to send CV form emails',
      );
    } finally {
      setSending(false);
    }
  };

  // Get stats for selected institute
  const getInstituteStats = () => {
    if (!shortlistStats || !selectedInstitute || selectedInstitute === 'all') {
      return null;
    }

    const instituteData = shortlistStats.institutes?.find(
      (inst) => inst.institute_id.toString() === selectedInstitute,
    );

    return instituteData;
  };

  const instituteStats = getInstituteStats();

  return (
    <div className='py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ml-2'>
        <div>
          <div className='flex items-center gap-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/cadets')}
              className='flex items-center gap-2'
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <h1 className='text-2xl font-bold text-gray-800'>
              Shortlisted Cadets
            </h1>
          </div>
          <p className='text-gray-500 text-sm mt-1 ml-12'>
            View cadets who meet shortlisting criteria
          </p>
        </div>
      </div>

      {/* Stats Card */}
      {shortlistStats && (
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Total Shortlisted</p>
              <p className='text-3xl font-bold text-blue-600'>
                {shortlistStats.total_shortlisted}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-1'>
                Institutes with Candidates
              </p>
              <p className='text-3xl font-bold text-indigo-600'>
                {shortlistStats.institutes?.length || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Institute Selector and Export */}
      <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
          <div className='flex items-center gap-4 w-full md:w-auto'>
            <Select
              value={selectedInstitute}
              onValueChange={handleInstituteChange}
            >
              <SelectTrigger className='w-[280px] bg-white border-gray-300'>
                <SelectValue placeholder='Select Institute' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Institutes</SelectItem>
                {institutes.map((institute) => (
                  <SelectItem
                    key={institute.id}
                    value={institute.id.toString()}
                  >
                    {institute.institute_name || institute.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {instituteStats && (
              <div className='px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg'>
                <span className='text-sm font-medium text-blue-700'>
                  {instituteStats.count} candidate
                  {instituteStats.count !== 1 ? 's' : ''} shortlisted
                </span>
              </div>
            )}
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleSendCVFormEmail}
              disabled={
                sending || !selectedInstitute || selectedInstitute === 'all'
              }
              className='flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50'
            >
              <Mail size={18} />
              {sending ? 'Sending...' : 'Send CV Form Email'}
            </Button>
          </div>
        </div>
      </div>

      {/* Cadet Table */}
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
        institutes={institutes}
        selectedCadets={selectedCadets}
        onSelectionChange={setSelectedCadets}
        showShortlistedOnly={true}
        onToggleShortlisted={() => {}}
        shortlistStats={shortlistStats}
      />
    </div>
  );
};

export default ShortlistedCadetsView;
