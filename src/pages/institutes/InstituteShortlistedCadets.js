import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ListChecks, Search, RefreshCw } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

const InstituteShortlistedCadets = () => {
  const { user } = useAuth();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  useEffect(() => {
    fetchShortlistedCadets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShortlistedCadets = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    search = searchTerm,
  ) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search || undefined,
      };

      const response = await api.get('/cadets/institute-shortlisted', {
        params,
      });

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
    fetchShortlistedCadets(newPage, pagination.per_page, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setTimeout(() => {
      fetchShortlistedCadets(1, pagination.per_page, value);
    }, 500);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    fetchShortlistedCadets(1, pagination.per_page, '');
    toast.success('Data refreshed');
  };

  return (
    <div className='py-6 px-4'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='p-2 bg-green-100 rounded-lg'>
            <ListChecks className='text-green-600' size={24} />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>
              Shortlisted Cadets
            </h1>
            <p className='text-gray-500 text-sm'>
              {user?.first_name
                ? `${user.first_name} — Shortlisted cadets from your institute`
                : 'View cadets shortlisted from your institute'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Total Shortlisted</p>
            <p className='text-3xl font-bold text-green-600'>
              {pagination.total}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Institute</p>
            <p className='text-xl font-semibold text-emerald-600'>
              {user?.first_name || 'Your Institute'}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
          <div className='relative w-full md:w-80'>
            <Search
              className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
              size={18}
            />
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder='Search cadets...'
              className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none text-sm'
            />
          </div>
          <button
            onClick={handleRefresh}
            className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors'
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cadet Table */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
        {loading ? (
          <div className='p-12 text-center'>
            <div className='w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
            <p className='mt-4 text-gray-500'>Loading shortlisted cadets...</p>
          </div>
        ) : cadets.length === 0 ? (
          <div className='p-12 text-center'>
            <ListChecks className='mx-auto mb-4 text-gray-300' size={48} />
            <p className='text-gray-500 text-lg'>No shortlisted cadets found</p>
            <p className='text-gray-400 text-sm mt-1'>
              No cadets from your institute meet the shortlisting criteria yet.
            </p>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='bg-gray-50 border-b border-gray-200'>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      #
                    </th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Name
                    </th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Email
                    </th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Phone
                    </th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Course Type
                    </th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      10th %
                    </th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      12th %
                    </th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      IMU Rank
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {cadets.map((cadet, index) => (
                    <tr
                      key={cadet.id}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='px-6 py-4 text-sm text-gray-500'>
                        {(pagination.current_page - 1) * pagination.per_page +
                          index +
                          1}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {cadet.first_name} {cadet.last_name}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {cadet.email || '-'}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {cadet.phone || cadet.mobile_number || '-'}
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cadet.course_type === 'Engine'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {cadet.course_type || '-'}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {cadet.tenth_avg_percentage
                          ? `${cadet.tenth_avg_percentage}%`
                          : '-'}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {cadet.twelfth_pcm_avg_percentage
                          ? `${cadet.twelfth_pcm_avg_percentage}%`
                          : '-'}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {cadet.imu_rank || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
                <p className='text-sm text-gray-500'>
                  Showing{' '}
                  {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                  {Math.min(
                    pagination.current_page * pagination.per_page,
                    pagination.total,
                  )}{' '}
                  of {pagination.total} cadets
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page - 1)
                    }
                    disabled={pagination.current_page === 1}
                    className='px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    Previous
                  </button>
                  <span className='px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg font-medium'>
                    {pagination.current_page}
                  </span>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page + 1)
                    }
                    disabled={pagination.current_page === pagination.last_page}
                    className='px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstituteShortlistedCadets;
