import React, { useState } from 'react';
import {
  Trash2,
  Search,
  Anchor,
  Navigation,
  Hash,
  Ship,
  Edit,
  MapPin,
  Users,
  FileText,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import Permission from '../../components/common/Permission';
import { Button } from '../../components/ui/button';

const VesselTable = ({
  vessels,
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
  const [deleteVessel, setDeleteVessel] = useState(null);

  const confirmDelete = () => {
    if (deleteVessel) {
      handleDelete(deleteVessel.id, deleteVessel.name);
      setDeleteVessel(null);
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
      field: 'name',
      headerName: 'Vessel Name',
      width: '250px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Ship size={16} className='text-blue-500 flex-shrink-0' />
          <span className='font-semibold text-gray-900'>{row.name}</span>
        </div>
      ),
    },
    {
      field: 'imo_number',
      headerName: 'IMO Number',
      width: '150px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Hash size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.imo_number}</span>
        </div>
      ),
    },
    {
      field: 'vessel_type',
      headerName: 'Type',
      width: '200px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Anchor size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.vessel_type || '-'}</span>
        </div>
      ),
    },
    {
      field: 'flag',
      headerName: 'Flag',
      width: '150px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Navigation size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.flag || '-'}</span>
        </div>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: '120px',
      sortable: true,
      renderCell: ({ value }) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold
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
      field: 'location',
      headerName: 'Location',
      width: '150px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <MapPin size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.location || '-'}</span>
        </div>
      ),
    },
    {
      field: 'total_seats',
      headerName: 'Total Seats',
      width: '120px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Users size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.total_seats || 0}</span>
        </div>
      ),
    },
    {
      field: 'voyage_ref',
      headerName: 'Voyage Ref',
      width: '150px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <FileText size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.voyage_ref || '-'}</span>
        </div>
      ),
    },
    {
      field: 'reporting_port',
      headerName: 'Reporting Port',
      width: '150px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <MapPin size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.reporting_port || '-'}</span>
        </div>
      ),
    },
    {
      field: 'joining_date',
      headerName: 'Joining Date',
      width: '130px',
      sortable: true,
      renderCell: ({ row }) => (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Calendar size={14} className='flex-shrink-0 text-gray-400' />
          <span>{row.joining_date ? new Date(row.joining_date).toLocaleDateString() : '-'}</span>
        </div>
      ),
    },
    {
      field: 'communication_details',
      headerName: 'Communication',
      width: '200px',
      sortable: false,
      renderCell: ({ row }) => (
        <div className='flex items-start gap-2 text-sm text-gray-600'>
          <MessageSquare size={14} className='flex-shrink-0 text-gray-400 mt-0.5' />
          <span className='truncate' title={row.communication_details || '-'}>
            {row.communication_details || '-'}
          </span>
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
          <Permission module='vessel-master' action='edit'>
            <Button
              variant="ghosy"
              size="icon"
              onClick={() => handleEdit(row)}
              className='p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors'
              title='Edit vessel'
            >
              <Edit size={16} />
            </Button>
          </Permission>
          <Permission module='vessel-master' action='delete'>
            <Button
              variant="ghosy"
              size="icon"
              onClick={() => setDeleteVessel(row)}
              className='p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors'
              title='Delete vessel'
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
              placeholder='Search vessels by name, IMO, type...'
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
          rows={vessels}
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
              ? `No vessels found matching "${searchTerm}"`
              : 'No vessels available in the fleet'
          }
        />
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteVessel}
        onClose={() => setDeleteVessel(null)}
        onConfirm={confirmDelete}
        title='Delete Vessel'
        message={`Are you sure you want to delete ${deleteVessel?.name}? This action cannot be undone.`}
      />
    </>
  );
};

export default VesselTable;
