import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Search,
  RotateCcw,
} from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import { Button } from 'components/ui/button';
import Permission from '../../components/common/Permission';

const InstitutesTable = ({
  institutes,
  loading,
  searchTerm,
  pagination,
  sortConfig,
  handleEdit,
  handleDelete,
  handlePageChange,
  handlePerPageChange,
  handleSortChange,
  handleSearch, // Added search handler
  handleRefresh, // Added refresh handler
}) => {
  const [deleteId, setDeleteId] = React.useState(null);

  const confirmDelete = () => {
    if (deleteId) {
      handleDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      {/* Search and Filter Section */}
      <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center bg-gray-50 rounded-lg px-3 border border-gray-400 w-full max-w-md'>
            <Search className='text-gray-400' size={20} />
            <input
              type='text'
              placeholder='Search institutes by name or location...'
              className='w-full p-2.5 bg-transparent outline-none text-gray-700 placeholder-gray-400'
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={handleRefresh}
              className='flex items-center gap-2'
              title='Refresh data'
            >
              <RotateCcw size={16} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <ReusableDataTable
          sortConfig={sortConfig}
          columns={[
            {
              field: 'id',
              headerName: 'Sr. No',
              width: '70px',
              sortable: false,
              renderCell: ({ index }) => (
                <span className='text-sm text-gray-500 font-medium'>
                  {(pagination?.current_page - 1) * pagination?.per_page +
                    index +
                    1}
                </span>
              ),
            },
            {
              field: 'institute_name',
              headerName: 'Institute Name',
              width: '250px',
              renderCell: ({ row }) => (
                <div className='truncate' title={row.institute_name}>
                  <p className='font-semibold text-gray-900 truncate'>
                    {row.institute_name}
                  </p>
                </div>
              ),
            },
            {
              field: 'institute_email',
              headerName: 'Email Address',
              width: '200px',
              renderCell: ({ row }) => (
                <div
                  className='flex items-center gap-2 text-sm text-gray-600 truncate'
                  title={row.institute_email}
                >
                  <Mail size={14} className='flex-shrink-0 text-gray-400' />
                  <span className='truncate'>{row.institute_email}</span>
                </div>
              ),
            },
            {
              field: 'mobile_number',
              headerName: 'Mobile Number',
              width: '150px',
              renderCell: ({ row }) => (
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Phone size={14} className='flex-shrink-0 text-gray-400' />
                  {row.mobile_number}
                </div>
              ),
            },
            {
              field: 'location',
              headerName: 'Location',
              width: '120px',
              renderCell: ({ row }) => (
                <div
                  className='flex items-center gap-2 text-sm text-gray-600 truncate'
                  title={row.location}
                >
                  <MapPin size={14} className='flex-shrink-0 text-gray-400' />
                  <span className='truncate'>{row.location}</span>
                </div>
              ),
            },
            {
              field: 'address',
              headerName: 'Address',
              width: '250px',
              renderCell: ({ row }) => (
                <div
                  className='text-sm text-gray-600 truncate'
                  title={row.address}
                >
                  <p className='truncate'>{row.address}</p>
                </div>
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
                  <Permission module='institutes' action='edit'>
                    <button
                      onClick={() => handleEdit(row)}
                      className='p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors'
                      title='Edit'
                    >
                      <Edit size={16} />
                    </button>
                  </Permission>
                  <Permission module='institutes' action='delete'>
                    <button
                      onClick={() => setDeleteId(row.id)}
                      className='p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors'
                      title='Delete'
                    >
                      <Trash2 size={16} />
                    </button>
                  </Permission>
                </div>
              ),
            },
          ]}
          rows={institutes}
          loading={loading}
          pagination={pagination}
          handlePageChange={handlePageChange}
          handlePerPageChange={handlePerPageChange}
          handleSortChange={handleSortChange}
          emptyMessage={
            searchTerm
              ? `No matches for "${searchTerm}"`
              : 'Get started by adding a new institute'
          }
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title='Confirm Delete'
        message='Are you sure you want to delete this institute? This action cannot be undone.'
      />
    </>
  );
};

export default InstitutesTable;
