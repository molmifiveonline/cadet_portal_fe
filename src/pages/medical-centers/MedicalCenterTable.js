import React, { useState } from 'react';
import {
  Trash2,
  Search,
  MapPin,
  Activity,
  User,
  Mail,
  Stethoscope,
  Edit,
} from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import Permission from '../../components/common/Permission';
import { Button } from '../../components/ui/button';

const MedicalCenterTable = ({
  centers,
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
}) => {
  const [deleteCenter, setDeleteCenter] = useState(null);

  const confirmDelete = () => {
    if (deleteCenter) {
      handleDelete(deleteCenter.id, deleteCenter.center_name);
      setDeleteCenter(null);
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
          {(pagination?.page - 1) * pagination?.limit + index + 1}
        </span>
      ),
    },
    {
      field: 'center_name',
      headerName: 'Center Name',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Stethoscope size={16} className='text-blue-500 flex-shrink-0' />
          <span className='font-semibold text-gray-900'>{row.center_name}</span>
        </div>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <MapPin size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.location}</span>
        </div>
      ),
    },
    {
      field: 'tests_offered',
      headerName: 'Tests Offered',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Activity size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.tests_offered || '-'}</span>
        </div>
      ),
    },
    {
      field: 'contact_person',
      headerName: 'Contact Person',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <User size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.contact_person || '-'}</span>
        </div>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      renderCell: ({ row }) => (
        <div
          className='flex items-center gap-2 text-sm text-gray-600'
          title={row.email}
        >
          <Mail size={14} className='flex-shrink-0 text-gray-400' />
          <span className='break-all'>{row.email || '-'}</span>
        </div>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '100px',
      sortable: true,
      renderCell: ({ value }) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
            ${
              value === 'Active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
        >
          {value}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '100px',
      align: 'right',
      sortable: false,
      sticky: 'right',
      cellClassName: 'bg-white',
      headerClassName: 'bg-white',
      renderCell: ({ row }) => (
        <div className='flex items-center justify-end gap-2'>
          <Permission module='medical-centers' action='edit'>
            <Button
              variant='ghosy'
              size='icon'
              onClick={() => handleEdit(row)}
              className='p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors'
              title='Edit center'
            >
              <Edit size={16} />
            </Button>
          </Permission>
          <Permission module='medical-centers' action='delete'>
            <Button
              variant='ghosy'
              size='icon'
              onClick={() => setDeleteCenter(row)}
              className='p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors'
              title='Delete center'
            >
              <Trash2 size={16} />
            </Button>
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
              placeholder='Search by center name, location, contact...'
              className='w-full p-2.5 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm'
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <ReusableDataTable
          sortConfig={sortConfig}
          columns={columns}
          rows={centers}
          loading={loading}
          pagination={{
            ...pagination,
            current_page: pagination.page,
            per_page: pagination.limit,
          }}
          handlePageChange={handlePageChange}
          handlePerPageChange={handlePerPageChange}
          handleSortChange={handleSortChange}
          checkboxSelection={false}
          emptyMessage={
            searchTerm
              ? `No medical centers found matching "${searchTerm}"`
              : 'No medical centers available'
          }
        />
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteCenter}
        onClose={() => setDeleteCenter(null)}
        onConfirm={confirmDelete}
        title='Delete Medical Center'
        message={`Are you sure you want to delete ${deleteCenter?.center_name}? This action cannot be undone.`}
      />
    </>
  );
};

export default MedicalCenterTable;
