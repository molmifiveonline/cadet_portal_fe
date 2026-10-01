import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Anchor, Ban, CheckCircle2, Pencil, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import PageHeader from '../../components/common/PageHeader';
import PageLoader from '../../components/common/PageLoader';
import ReusableDataTable from '../../components/common/ReusableDataTable';
import Permission from '../../components/common/Permission';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import api from '../../lib/utils/apiConfig';

const emptyForm = { name: '', department: 'Both' };

const VesselTypeMaster = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ sortBy: '', sortOrder: 'ASC' });
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/vessels/master-types');
      setTypes(response.data.data || []);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Failed to load vessel types.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTypes(); }, [loadTypes]);

  const filteredTypes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return types.filter((type) =>
      (!term || `${type.name} ${type.department}`.toLowerCase().includes(term)) &&
      (statusFilter === 'All' || type.status === statusFilter),
    );
  }, [types, search, statusFilter]);

  const sortedTypes = useMemo(() => {
    if (!sortConfig.sortBy) return filteredTypes;
    const direction = sortConfig.sortOrder === 'DESC' ? -1 : 1;
    return [...filteredTypes].sort((first, second) =>
      String(first[sortConfig.sortBy] || '').localeCompare(
        String(second[sortConfig.sortBy] || ''), undefined,
        { numeric: true, sensitivity: 'base' },
      ) * direction,
    );
  }, [filteredTypes, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedTypes.length / rowsPerPage));
  const paginatedTypes = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedTypes.slice(start, start + rowsPerPage);
  }, [sortedTypes, currentPage, rowsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);
  useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)); }, [totalPages]);

  // const activeCount = types.filter((type) => type.status === 'Active').length;

  const openCreate = () => {
    setEditor({ mode: 'add' });
    setForm(emptyForm);
    setFormError('');
  };

  const openEdit = (type) => {
    setEditor({ mode: 'edit', item: type });
    setForm({ name: type.name, department: type.department });
    setFormError('');
  };

  const closeEditor = () => {
    if (saving) return;
    setEditor(null);
    setForm(emptyForm);
    setFormError('');
  };

  const saveType = async () => {
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (!name) {
      setFormError('Vessel Type Name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editor?.mode === 'edit') {
        await api.put(`/vessels/master-types/${editor.item.id}`, { name, department: form.department });
      } else {
        await api.post('/vessels/master-types', { name, department: form.department });
      }
      toast.success(editor?.mode === 'edit' ? 'Vessel Type updated.' : 'Vessel Type added.');
      setEditor(null);
      setForm(emptyForm);
      await loadTypes();
    } catch (error) {
      setFormError(error.response?.data?.errors?.name || error.response?.data?.message || 'Failed to save Vessel Type.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async () => {
    if (!statusAction) return;
    const status = statusAction.status === 'Active' ? 'Inactive' : 'Active';
    setUpdatingStatus(true);
    try {
      await api.patch(`/vessels/master-types/${statusAction.id}/status`, { status });
      toast.success(`Vessel Type ${status === 'Active' ? 'activated' : 'deactivated'}.`);
      setStatusAction(null);
      await loadTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update Vessel Type status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const columns = [
    {
      field: 'name', headerName: 'Vessel Type Name', width: '300px',
      renderCell: ({ value }) => <span className='font-semibold text-slate-900'>{value}</span>,
    },
    {
      field: 'department', headerName: 'Department', width: '180px',
      renderCell: ({ value }) => (
        <span className='rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700'>
          {value === 'Both' ? 'Deck & Engine' : value}
        </span>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: '140px',
      renderCell: ({ value }) => <StatusBadge status={value} />,
    },
    {
      field: 'actions', headerName: 'Actions', width: '270px', align: 'right', sortable: false,
      sticky: 'right', cellClassName: 'bg-white', headerClassName: 'bg-white',
      renderCell: ({ row }) => (
        <Permission module='vessel-master' action='edit'>
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={() => openEdit(row)}>
              <Pencil size={14} className='mr-1.5' /> Edit
            </Button>
            <Button
              type='button' variant='outline' size='sm'
              className={row.status === 'Active' ? 'text-red-700 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}
              onClick={() => setStatusAction(row)}
            >
              {row.status === 'Active'
                ? <Ban size={14} className='mr-1.5' />
                : <CheckCircle2 size={14} className='mr-1.5' />}
              {row.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </Permission>
      ),
    },
  ];

  if (loading && !types.length && !loadError) return <PageLoader />;

  return (
    <div className='py-6'>
      <PageHeader
        title='Vessel Type Master'
        subtitle='Manage the vessel types available in Vessel Master'
        icon={Anchor}
      >
        <Permission module='vessel-master' action='create'>
          <Button type='button' onClick={openCreate}>
            <Plus size={18} className='mr-2' /> Add Vessel Type
          </Button>
        </Permission>
      </PageHeader>

      <div className='mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900'>
        Active vessel types can be selected when adding a vessel. Renaming a
        type also updates linked vessels.
      </div>

      <div className='overflow-hidden rounded-xl border bg-white shadow-sm'>
        <div className='flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative w-full sm:max-w-md'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <Input
              className='pl-9'
              placeholder='Search Vessel Type...'
              aria-label='Search vessel types'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className='w-full border-slate-300 bg-white sm:w-40'
              aria-label='Filter by status'
            >
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent align='end' className='z-[100] bg-white'>
              <SelectItem value='All'>All</SelectItem>
              <SelectItem value='Active'>Active</SelectItem>
              <SelectItem value='Inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadError && (
          <div
            role='alert'
            className='border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'
          >
            {loadError}{' '}
            <button
              type='button'
              onClick={loadTypes}
              className='font-semibold underline'
            >
              Try again
            </button>
          </div>
        )}

        <ReusableDataTable
          columns={columns}
          rows={paginatedTypes}
          loading={loading}
          pageSize={rowsPerPage}
          sortConfig={sortConfig}
          handleSortChange={(field, order) => {
            setSortConfig({ sortBy: field, sortOrder: order.toUpperCase() });
            setCurrentPage(1);
          }}
          handlePageChange={setCurrentPage}
          handlePerPageChange={(value) => {
            setRowsPerPage(value);
            setCurrentPage(1);
          }}
          pagination={{
            current_page: currentPage,
            per_page: rowsPerPage,
            total: sortedTypes.length,
            last_page: totalPages,
          }}
          emptyMessage={
            search || statusFilter !== 'All'
              ? 'No Vessel Types match the selected filters.'
              : 'No Vessel Types added yet.'
          }
        />
      </div>

      <ConfirmationModal
        isOpen={Boolean(editor)}
        onClose={closeEditor}
        onConfirm={saveType}
        title={editor?.mode === 'edit' ? 'Edit Vessel Type' : 'Add Vessel Type'}
        message='This type will be available in Vessel Master when active.'
        confirmText={
          editor?.mode === 'edit' ? 'Save Changes' : 'Add Vessel Type'
        }
        isLoading={saving}
        confirmDisabled={!form.name.trim()}
      >
        <label
          className='block text-sm font-medium text-slate-700'
          htmlFor='vessel-type-name'
        >
          Vessel Type Name <span className='text-red-500'>*</span>
        </label>
        <Input
          id='vessel-type-name'
          autoFocus
          className={`mt-1 ${formError ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
          value={form.name}
          onChange={(event) => {
            setForm((current) => ({ ...current, name: event.target.value }));
            setFormError('');
          }}
          placeholder='Example: DRY Carriers'
          maxLength={100}
        />
        {formError && (
          <p role='alert' className='mt-1 text-xs text-red-600'>
            {formError}
          </p>
        )}

        <label
          className='mt-4 block text-sm font-medium text-slate-700'
          htmlFor='vessel-type-department'
        >
          Department
        </label>
        <Select
          value={form.department}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, department: value }))
          }
        >
          <SelectTrigger
            id='vessel-type-department'
            className='mt-1 w-full border-slate-300 bg-white'
          >
            <SelectValue placeholder='Select department' />
          </SelectTrigger>
          <SelectContent className='z-[100] bg-white'>
            <SelectItem value='Both'>Deck &amp; Engine</SelectItem>
            <SelectItem value='Deck'>Deck</SelectItem>
            <SelectItem value='Engine'>Engine</SelectItem>
          </SelectContent>
        </Select>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(statusAction)}
        onClose={() => {
          if (!updatingStatus) setStatusAction(null);
        }}
        onConfirm={changeStatus}
        title={`${statusAction?.status === 'Active' ? 'Deactivate' : 'Activate'} Vessel Type`}
        message={
          statusAction?.status === 'Active'
            ? `${statusAction?.name} will no longer be available for new vessels. Existing vessels keep their type.`
            : `${statusAction?.name} will be available when vessels are added or edited.`
        }
        confirmText={
          statusAction?.status === 'Active' ? 'Deactivate' : 'Activate'
        }
        confirmButtonClass={
          statusAction?.status === 'Active'
            ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
            : undefined
        }
        isLoading={updatingStatus}
      />
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status === 'Active'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-600'}`}>
    {status}
  </span>
);

export default VesselTypeMaster;
