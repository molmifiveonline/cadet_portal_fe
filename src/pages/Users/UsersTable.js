import React, { useState } from 'react';
import { Edit, Trash2, Search, RotateCcw, Mail } from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import Permission from '../../components/common/Permission';
import { Button } from '../../components/ui/button';

const UsersTable = ({
  users,
  loading,
  searchTerm,
  pagination,
  sortConfig,
  handleEdit,
  handleDelete,
  handlePageChange,
  handlePerPageChange,
  handleSortChange,
  handleSearch,
  handleRefresh,
  selectedUsers,
  onSelectionChange,
}) => {
  const [deleteUser, setDeleteUser] = useState(null);

  const confirmDelete = () => {
    if (deleteUser) {
      handleDelete(deleteUser.id);
      setDeleteUser(null);
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'Sr. No',
      width: '70px',
      sortable: false,
      renderCell: ({ index }) => (
        <span className='text-sm text-gray-500 font-medium'>
          {(pagination?.current_page - 1) * pagination?.per_page + index + 1}
        </span>
      ),
    },
    {
      field: 'first_name',
      headerName: 'Full Name',
      width: '200px',
      renderCell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-semibold text-gray-900'>
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    {
      field: 'email',
      headerName: 'Email Address',
      width: '250px',
      renderCell: ({ row }) => (
        <div
          className='flex items-center gap-2 text-sm text-gray-600 truncate'
          title={row.email}
        >
          <Mail size={14} className='flex-shrink-0 text-gray-400' />
          <span className='truncate'>{row.email}</span>
        </div>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: '150px',
      renderCell: ({ value }) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${
                      value === 'SuperAdmin'
                        ? 'bg-purple-100 text-purple-700'
                        : value === 'Trainer'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                    }`}
        >
          {value}
        </span>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Joined Date',
      width: '150px',
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '90px',
      align: 'right',
      sortable: false,
      sticky: 'right',
      cellClassName: 'bg-white',
      headerClassName: 'bg-white',
      renderCell: ({ row }) => (
        <div className='flex items-center justify-end gap-2'>
          <Permission module='users' action='edit'>
            <button
              onClick={() => handleEdit(row)}
              className='p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors'
              title='Edit user'
            >
              <Edit size={16} />
            </button>
          </Permission>
          <Permission module='users' action='delete'>
            <button
              onClick={() => setDeleteUser(row)}
              className='p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors'
              title='Delete user'
            >
              <Trash2 size={16} />
            </button>
          </Permission>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center bg-gray-50 rounded-lg px-3 border border-gray-400 w-full max-w-md'>
            <Search className='text-gray-400' size={18} />
            <input
              type='text'
              placeholder='Search users by name or email...'
              className='w-full p-2.5 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm'
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleRefresh}
              className='flex items-center gap-2 h-10'
              title='Refresh data'
            >
              <RotateCcw size={16} />
              <span className='hidden sm:inline'>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <ReusableDataTable
          sortConfig={sortConfig}
          columns={columns}
          rows={users}
          loading={loading}
          pagination={pagination}
          handlePageChange={handlePageChange}
          handlePerPageChange={handlePerPageChange}
          handleSortChange={handleSortChange}
          checkboxSelection={true}
          rowSelectionModel={selectedUsers}
          onRowSelectionModelChange={onSelectionChange}
          emptyMessage={
            searchTerm
              ? `No users found matching "${searchTerm}"`
              : 'No users available'
          }
        />
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={confirmDelete}
        title='Delete User'
        message={`Are you sure you want to delete ${deleteUser?.first_name} ${deleteUser?.last_name}? This action cannot be undone.`}
      />
    </>
  );
};

export default UsersTable;
