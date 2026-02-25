import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Search,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  User,
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
  handleExtendToken,
  handlePageChange,
  handlePerPageChange,
  handleSortChange,
  handleSearch,
  handleRefresh,
  selectedInstitutes,
  onSelectionChange,
}) => {
  const [deleteId, setDeleteId] = React.useState(null);

  const confirmDelete = () => {
    if (deleteId) {
      handleDelete(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
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
              width: '220px',
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
              width: '190px',
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
              field: 'email_sent',
              headerName: 'Email Sent',
              width: '120px',
              sortable: false,
              renderCell: ({ row }) => {
                if (!row.temp_expiry) {
                  return (
                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500'>
                      <XCircle size={12} />
                      Not Sent
                    </span>
                  );
                }
                const expired = isExpired(row.temp_expiry);
                return expired ? (
                  <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700'>
                    <Clock size={12} />
                    Expired
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                    <CheckCircle2 size={12} />
                    Active
                  </span>
                );
              },
            },
            {
              field: 'temp_expiry',
              headerName: 'Token Expires',
              width: '120px',
              sortable: false,
              renderCell: ({ row }) => {
                if (!row.temp_expiry) {
                  return <span className='text-sm text-gray-400'>—</span>;
                }
                const expired = isExpired(row.temp_expiry);
                return (
                  <span
                    className={`text-xs font-medium ${expired ? 'text-red-600' : 'text-blue-600'}`}
                    title={row.temp_expiry}
                  >
                    {expired ? '⚠ ' : ''}
                    {formatDate(row.temp_expiry)}
                  </span>
                );
              },
            },
            {
              field: 'institute_type',
              headerName: 'Type',
              width: '90px',
              sortable: false,
             renderCell: ({ row }) => (
                <div className='truncate' title={row.institute_type}>
                  <p className='font-semibold text-gray-900 truncate'>
                    {row.institute_type}
                  </p>
                </div>
              ),
            },
            {
              field: 'contact_person',
              headerName: 'Contact Person',
              width: '150px',
              renderCell: ({ row }) => (
                <div className='flex items-center gap-2 text-sm text-gray-600 truncate'>
                  <User size={14} className='flex-shrink-0 text-gray-400' />
                  {row.contact_person ? (
                    <span className='truncate' title={row.contact_person}>
                      {row.contact_person}
                    </span>
                  ) : (
                    <span className='text-gray-400'>—</span>
                  )}
                </div>
              ),
            },
            {
              field: 'mobile_number',
              headerName: 'Mobile Number',
              width: '140px',
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
              width: '200px',
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
              width: '130px',
              align: 'right',
              sortable: false,
              sticky: 'right',
              cellClassName: 'bg-white',
              headerClassName: 'bg-white',
              renderCell: ({ row }) => (
                <div className='flex items-center justify-end gap-1'>
                  {/* Extend token – only if email has been sent */}
                  {row.temp_expiry && (
                    <Permission module='institutes' action='edit'>
                      <button
                        onClick={() => handleExtendToken(row)}
                        className='p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors'
                        title='Extend Token Expiry'
                      >
                        <Clock size={16} />
                      </button>
                    </Permission>
                  )}
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
          checkboxSelection={true}
          rowSelectionModel={selectedInstitutes}
          onRowSelectionModelChange={onSelectionChange}
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
