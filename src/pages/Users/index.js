import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import UsersTable from './UsersTable';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import Permission from 'components/common/Permission';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
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

  const [selectedUsers, setSelectedUsers] = useState([]);
  const searchTimeoutRef = useRef(null);

  const fetchUsers = async (
    page = pagination.current_page,
    limit = pagination.per_page,
    sortBy = sortConfig.sortBy,
    sortOrder = sortConfig.sortOrder,
    search = searchTerm,
  ) => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: {
          page,
          limit,
          sortBy: sortBy || undefined,
          sortOrder: sortOrder || undefined,
          search: search || undefined,
        },
      });

      const {
        data,
        total,
        page: currentPage,
        limit: perPage,
        last_page,
      } = response.data;
      // Handle different response structures if necessary, similar to original code
      const userList = Array.isArray(data) ? data : data?.data || [];

      setUsers(userList);
      setPagination({
        current_page: currentPage || page,
        per_page: perPage || limit,
        total: total || userList.length,
        last_page:
          last_page ||
          Math.ceil((total || userList.length) / (perPage || limit)),
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Could not load users',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    fetchUsers(
      newPage,
      pagination.per_page,
      sortConfig.sortBy,
      sortConfig.sortOrder,
      searchTerm,
    );
  };

  const handleLimitChange = (newLimit) => {
    fetchUsers(
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
    fetchUsers(1, pagination.per_page, field, newSortOrder, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(
        1,
        pagination.per_page,
        sortConfig.sortBy,
        sortConfig.sortOrder,
        value,
      );
    }, 300);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSortConfig({ sortBy: '', sortOrder: '' });
    fetchUsers(1, pagination.per_page, '', '', '');
    toast.success('Data refreshed');
  };

  const handleEditClick = (user) => {
    navigate(`/users/edit/${user.id}`);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers(
          pagination.current_page,
          pagination.per_page,
          sortConfig.sortBy,
          sortConfig.sortOrder,
          searchTerm,
        );
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            'Failed to delete user',
        );
      }
    }
  };

  return (
    <div className='py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 ml-2'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>User Management</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Manage system users and their roles
          </p>
        </div>
        <div className='flex gap-2'>
          <Permission module='users' action='create'>
            <Button
              variant='default'
              onClick={() => navigate('/users/addUser')}
            >
              <Plus size={20} className='mr-2' />
              Add User
            </Button>
          </Permission>
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className='mb-4 flex items-center gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2'>
          <span className='text-sm text-blue-700 font-medium'>
            {selectedUsers.length} user
            {selectedUsers.length !== 1 ? 's' : ''} selected
          </span>
          <div className='flex gap-2 ml-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSelectedUsers([])}
              className='text-blue-600 border-blue-200 hover:bg-blue-100'
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <UsersTable
        users={users}
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
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
      />
    </div>
  );
};

export default UserManagement;
