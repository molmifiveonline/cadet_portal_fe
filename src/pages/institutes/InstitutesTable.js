import React from 'react';
import {
  Mail,
  MapPin,
  Edit,
  Trash2,
  Search,
  Clock,
  XCircle,
  User,
} from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import { Button } from 'components/ui/button';
import Permission from '../../components/common/Permission';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';

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
              field: 'contact_emails',
              headerName: 'Email Address',
              width: '230px',
              sortable: false,
              renderCell: ({ row }) => {
                let contacts = row.contact_emails || [];
                if (typeof contacts === 'string') {
                  try {
                    contacts = JSON.parse(contacts);
                  } catch (e) {
                    contacts = [];
                  }
                }
                const hasExtraContacts = contacts && contacts.length > 1;
                const extraCount = hasExtraContacts ? contacts.length - 1 : 0;
                const defaultContact =
                  contacts.find((c) => c.isDefault) || contacts[0];
                const displayEmail = defaultContact
                  ? defaultContact.email
                  : '—';

                return (
                  <div className='flex items-center justify-between w-full h-full pr-4'>
                    <div
                      className='flex items-center gap-2 text-sm text-gray-600 truncate max-w-[150px]'
                      title={displayEmail}
                    >
                      <Mail size={14} className='flex-shrink-0 text-gray-400' />
                      <span className='truncate'>{displayEmail}</span>
                    </div>
                    {hasExtraContacts && (
                      <span className='inline-flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0'>
                        +{extraCount}
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              field: 'temp_expiry',
              headerName: 'Token Expires',
              width: '140px',
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
                  <span
                    className='text-xs font-medium text-red-600 flex items-center gap-1 cursor-pointer'
                    title='Token Expired'
                  >
                    ⚠ {formatDateForDisplay(row.temp_expiry)}
                  </span>
                ) : (
                  <span
                    className='text-xs font-medium text-blue-600 flex items-center gap-1'
                    title={row.temp_expiry}
                  >
                    {formatDateForDisplay(row.temp_expiry)}
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
              field: 'status',
              headerName: 'Status',
              width: '100px',
              renderCell: ({ row }) => {
                const isActive = row.status !== 'inactive';
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                );
              },
            },
            {
              field: 'contact_person',
              headerName: 'Contact Person',
              width: '150px',
              renderCell: ({ row }) => {
                let contacts = row.contact_emails || [];
                if (typeof contacts === 'string') {
                  try {
                    contacts = JSON.parse(contacts);
                  } catch (e) {
                    contacts = [];
                  }
                }
                const defaultContact =
                  contacts.find((c) => c.isDefault) || contacts[0];
                const displayName =
                  defaultContact && defaultContact.name
                    ? defaultContact.name
                    : '—';
                return (
                  <div className='flex items-center gap-2 text-sm text-gray-600 truncate'>
                    <User size={14} className='flex-shrink-0 text-gray-400' />
                    <span
                      className={`truncate ${displayName === '—' ? 'text-gray-400' : ''}`}
                      title={displayName !== '—' ? displayName : ''}
                    >
                      {displayName}
                    </span>
                  </div>
                );
              },
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
                      <Button
                        variant='ghosy'
                        size='icon'
                        onClick={() => handleExtendToken(row)}
                        className='p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors'
                        title='Extend Token Expiry'
                      >
                        <Clock size={16} />
                      </Button>
                    </Permission>
                  )}
                  <Permission module='institutes' action='edit'>
                    <Button
                      variant='ghosy'
                      size='icon'
                      onClick={() => handleEdit(row)}
                      className='p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors'
                      title='Edit'
                    >
                      <Edit size={16} />
                    </Button>
                  </Permission>
                  <Permission module='institutes' action='delete'>
                    <Button
                      variant='ghosy'
                      size='icon'
                      onClick={() => setDeleteId(row.id)}
                      className='p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors'
                      title='Delete'
                    >
                      <Trash2 size={16} />
                    </Button>
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
