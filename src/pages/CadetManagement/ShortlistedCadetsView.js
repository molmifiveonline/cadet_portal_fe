import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ListChecks } from 'lucide-react';
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
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitute, setSelectedInstitute] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [shortlistStats, setShortlistStats] = useState(null);
  const [sendingShortlist, setSendingShortlist] = useState(false);

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
    fetchShortlistStats();
    fetchShortlistedCadets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSendShortlistEmail = async () => {
    if (!selectedInstitute || selectedInstitute === 'all') {
      toast.error('Please select a specific institute to send shortlist email');
      return;
    }

    try {
      setSendingShortlist(true);
      const response = await api.post('/institutes/send-shortlist-email', {
        instituteIds: [selectedInstitute],
      });

      const results = response.data.results || [];
      const success = results.filter((r) => r.status === 'success');
      const skipped = results.filter((r) => r.status === 'skipped');

      if (success.length > 0) {
        toast.success(
          `Shortlist email sent to ${success[0].email} (${success[0].cadetCount} cadets)`,
        );
      } else if (skipped.length > 0) {
        toast.warning(
          skipped[0].reason || 'No shortlisted cadets for this institute',
        );
      } else {
        toast.error('Failed to send shortlist email');
      }
    } catch (error) {
      console.error('Error sending shortlist email:', error);
      toast.error(
        error.response?.data?.message || 'Failed to send shortlist email',
      );
    } finally {
      setSendingShortlist(false);
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
            <h1 className='text-2xl font-bold text-gray-800'>
              Shortlisted Cadets
            </h1>
          </div>
          <p className='text-gray-500 text-sm mt-1'>
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
                {(shortlistStats?.institutes || []).map((inst) => (
                  <SelectItem
                    key={inst.institute_id}
                    value={inst.institute_id.toString()}
                  >
                    {inst.institute_name} ({inst.count})
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
              onClick={handleSendShortlistEmail}
              disabled={
                sendingShortlist ||
                !selectedInstitute ||
                selectedInstitute === 'all'
              }
              className='flex items-center gap-2 border-green-300 text-green-600 hover:bg-green-50'
            >
              <ListChecks size={18} />
              {sendingShortlist ? 'Sending...' : 'Send Shortlist Email'}
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
        selectedInstitute={selectedInstitute}
        handleInstituteChange={handleInstituteChange}
        institutes={(shortlistStats?.institutes || []).map((inst) => ({
          id: inst.institute_id,
          institute_name: inst.institute_name,
        }))}
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
