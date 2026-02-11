import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import UsersTable from './UsersTable';
import UserFormModal from './UserFormModal';
import api from '../../lib/utils/apiConfig';
import Permission from 'components/common/Permission';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchUsers = useCallback(async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: {
          page,
          limit,
          search,
        },
      });

      const data = response.data;
      const userList = data.data || (Array.isArray(data) ? data : []);

      setUsers(userList);
      setPagination({
        current_page: data.current_page || page,
        per_page: data.per_page || limit,
        total: data.total || userList.length,
        last_page: data.last_page || 1,
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
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(currentPage, rowsPerPage, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, rowsPerPage, searchTerm, fetchUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (val) => {
    setFormData((prev) => ({ ...prev, role: val }));
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '', // Leave password empty for editing
      role: user.role || '',
    });
    setIsEditUserOpen(true);
  };

  const handleDelete = async (userId) => {
    setSubmitLoading(true);
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers(currentPage, rowsPerPage, searchTerm);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete user',
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/users', formData);
      toast.success('User created successfully');
      setIsAddUserOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: '',
      });
      fetchUsers(currentPage, rowsPerPage, searchTerm);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to create user',
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.role
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitLoading(true);
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      await api.put(`/users/${selectedUser.id}`, updateData);

      toast.success('User updated successfully');
      setIsEditUserOpen(false);
      setSelectedUser(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: '',
      });
      fetchUsers(currentPage, rowsPerPage, searchTerm);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to update user',
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className='py-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>User Management</h1>
          <p className='text-slate-500 mt-1'>
            Manage system users and their roles.
          </p>
        </div>
        <Permission module='users' action='create'>
          <Button
            onClick={() => {
              setFormData({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                role: '',
              });
              setIsAddUserOpen(true);
            }}
            className='bg-[#3a5f9e] hover:bg-[#325186] text-white'
          >
            <Plus className='w-4 h-4 mr-2' /> Add User
          </Button>
        </Permission>
      </div>

      <UsersTable
        users={users}
        loading={loading}
        searchTerm={searchTerm}
        pagination={pagination}
        handleEdit={handleEditClick}
        handleDelete={handleDelete}
        handlePageChange={setCurrentPage}
        handlePerPageChange={(val) => {
          setRowsPerPage(val);
          setCurrentPage(1);
        }}
        handleSearch={setSearchTerm}
        handleRefresh={() => fetchUsers(currentPage, rowsPerPage, searchTerm)}
      />

      {/* Add User Modal */}
      <UserFormModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title='Add New User'
        formData={formData}
        handleInputChange={handleInputChange}
        handleRoleChange={handleRoleChange}
        handleSubmit={handleSubmit}
        submitLoading={submitLoading}
        submitButtonText='Create User'
      />

      {/* Edit User Modal */}
      <UserFormModal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        title='Edit User'
        formData={formData}
        handleInputChange={handleInputChange}
        handleRoleChange={handleRoleChange}
        handleSubmit={handleUpdateSubmit}
        submitLoading={submitLoading}
        submitButtonText='Update User'
        isEdit={true}
      />
    </div>
  );
};

export default UserManagement;
