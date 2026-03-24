import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { Plus, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Permission from '../../components/common/Permission';

const RecruitmentDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institutes, setInstitutes] = useState([]);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    course_type: 'all',
    institute_id: ''
  });

  const fetchDrives = useCallback(
    async (
      page = pagination.current_page,
      limit = pagination.per_page,
      search = searchTerm,
      filterStatus = filters.status,
      filterCourseType = filters.course_type,
      filterInstituteId = filters.institute_id,
    ) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page,
          limit,
          search,
          ...(filterStatus !== 'all' && { status: filterStatus }),
          ...(filterCourseType !== 'all' && { course_type: filterCourseType }),
          ...(filterInstituteId && { institute_id: filterInstituteId }),
        });

        const response = await api.get(`/recruitment-drives?${params}`);
        setDrives(response.data.data);
        setPagination({
          current_page: response.data.page,
          per_page: response.data.limit,
          total: response.data.total,
          last_page: Math.ceil(response.data.total / response.data.limit),
        });
      } catch (error) {
        console.error('Error fetching recruitment drives:', error);
        toast.error('Failed to fetch recruitment drives');
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.current_page,
      pagination.per_page,
      searchTerm,
      filters.status,
      filters.course_type,
      filters.institute_id,
    ],
  );

  useEffect(() => {
    fetchDrives();
    fetchInstitutes();
  }, [fetchDrives]);

  const fetchInstitutes = async () => {
    try {
      const response = await api.get('/institutes?limit=1000');
      setInstitutes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching institutes:', error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Debounced search
    setTimeout(() => {
      fetchDrives(1, pagination.per_page, value);
    }, 500);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    fetchDrives(1, pagination.per_page, searchTerm, filterType === 'status' ? value : filters.status,
               filterType === 'course_type' ? value : filters.course_type,
               filterType === 'institute_id' ? value : filters.institute_id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCourseTypeColor = (courseType) => {
    return courseType === 'Deck' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recruitment Drives</h1>
        <Permission module="recruitment_drives" action="create">
          <Button onClick={() => navigate('/drives/new')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Drive
          </Button>
        </Permission>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search drives..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <select
              value={filters.course_type}
              onChange={(e) => handleFilterChange('course_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              <option value="Deck">Deck</option>
              <option value="Engine">Engine</option>
            </select>
          </div>
          <div>
            <select
              value={filters.institute_id}
              onChange={(e) => handleFilterChange('institute_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Institutes</option>
              {institutes.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.institute_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drives.map((drive) => (
          <div
            key={drive.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/drives/${drive.id}`)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {drive.drive_name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(drive.status)}`}>
                  {drive.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Institute:</span> {drive.institute_name}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCourseTypeColor(drive.course_type)}`}>
                    {drive.course_type}
                  </span>
                  <span className="text-sm text-gray-600">
                    Capacity: {drive.intake_capacity}
                  </span>
                </div>
              </div>

              {/* Progress Meter */}
              {(() => {
                const totalCadets = drive.total_cadets || 0;
                const onboarded = drive.onboarded || 0;
                const progress = totalCadets > 0 ? Math.round((onboarded / totalCadets) * 100) : 0;
                return (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{totalCadets} Uploaded</span>
                      <span>{onboarded} Onboarded</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {drives.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recruitment drives</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new recruitment drive.</p>
          <div className="mt-6">
            <Permission module="recruitment_drives" action="create">
              <Button onClick={() => navigate('/drives/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Drive
              </Button>
            </Permission>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentDrives;