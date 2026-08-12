import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Layers3,
  ListChecks,
  Plus,
  Search,
  Ship,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { usePermission } from '../../hooks/usePermission';

const currentYear = new Date().getFullYear();

const toNumber = (value) => Number(value || 0);

const getCycleStage = (cycle) => {
  const finalizedCount = [cycle.deck_status, cycle.engine_status].filter(
    (status) => status === 'Finalized',
  ).length;
  if (finalizedCount === 2) return 'Finalized';
  if (finalizedCount === 1) return 'In Progress';
  return 'Draft';
};

const Allocations = () => {
  const navigate = useNavigate();
  const { hasPermission: canCreate } = usePermission('allocations', 'create');
  const { hasPermission: canEdit } = usePermission('allocations', 'edit');
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear);
  const [yearError, setYearError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteCycle, setDeleteCycle] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const cycleResponse = await api.get('/allocations');
      setCycles(cycleResponse.data.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to load allocation cycles',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const candidates = cycles.reduce(
      (total, cycle) => total + toNumber(cycle.candidate_count),
      0,
    );
    const allocated = cycles.reduce(
      (total, cycle) => total + toNumber(cycle.allocated_count),
      0,
    );
    const finalizedLists = cycles.reduce(
      (total, cycle) =>
        total +
        [cycle.deck_status, cycle.engine_status].filter(
          (status) => status === 'Finalized',
        ).length,
      0,
    );
    return { candidates, allocated, finalizedLists };
  }, [cycles]);

  const filteredCycles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cycles.filter((cycle) => {
      const matchesSearch =
        !term ||
        String(cycle.allocation_number || '').toLowerCase().includes(term) ||
        String(cycle.allocation_year || '').includes(term);
      const matchesStatus =
        statusFilter === 'All' || getCycleStage(cycle) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cycles, search, statusFilter]);

  const openCreateModal = () => {
    setYear(currentYear);
    setYearError('');
    setShowCreate(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setShowCreate(false);
    setYearError('');
  };

  const updateYear = (value) => {
    setYear(value);
    setYearError('');
  };

  const create = async () => {
    const allocationYear = Number(year);
    if (
      !Number.isInteger(allocationYear) ||
      allocationYear < 2000 ||
      allocationYear > 2100
    ) {
      setYearError('Enter a valid allocation year between 2000 and 2100.');
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/allocations', {
        year: allocationYear,
      });
      toast.success(`${response.data.data.allocation_number} created`);
      navigate(`/allocations/${response.data.data.id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to create allocation cycle',
      );
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCycle) return;
    try {
      setDeleting(true);
      await api.delete(`/allocations/${deleteCycle.id}`);
      toast.success(`${deleteCycle.allocation_number} deleted`);
      setDeleteCycle(null);
      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete allocation cycle',
      );
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
  };

  return (
    <div className="py-6">
      <PageHeader
        title="CTV Vessel Allocation"
        subtitle="Create, monitor, and finalize annual Deck and Engine allocation cycles"
        icon={Anchor}
      >
        {canCreate && (
          <Button onClick={openCreateModal} className="shadow-sm">
            <Plus size={18} className="mr-2" />
            Create Allocation
          </Button>
        )}
      </PageHeader>

      <section
        aria-label="Allocation summary"
        className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label="Allocation Cycles"
          value={cycles.length}
          helper="Annual allocation records"
          icon={Layers3}
          tone="blue"
        />
        <SummaryCard
          label="Total Cadets"
          value={summary.candidates}
          helper="Across all cycles"
          icon={Users}
          tone="violet"
        />
        <SummaryCard
          label="Vessel Allocated"
          value={summary.allocated}
          helper={`${summary.candidates ? Math.round((summary.allocated / summary.candidates) * 100) : 0}% of all cadets`}
          icon={Ship}
          tone="emerald"
        />
        <SummaryCard
          label="Finalized Lists"
          value={`${summary.finalizedLists}/${cycles.length * 2}`}
          helper="Deck and Engine lists"
          icon={ListChecks}
          tone="amber"
        />
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Allocation Cycles</h2>
            <p className="text-sm text-slate-500">
              Open a cycle to manage candidates, assessments, ranks, and vessels.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ID or year..."
                aria-label="Search allocation cycles"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-full bg-white sm:w-44"
                aria-label="Filter allocation cycles by status"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent align="end" className="z-[100] bg-white">
                <SelectItem value="All">All statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <CycleCardSkeleton key={item} />
          ))}
        </div>
      ) : filteredCycles.length ? (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredCycles.map((cycle) => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              canEdit={canEdit}
              onOpen={() => navigate(`/allocations/${cycle.id}`)}
              onDelete={() => setDeleteCycle(cycle)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          filtered={Boolean(search || statusFilter !== 'All')}
          canCreate={canCreate}
          onClear={clearFilters}
          onCreate={openCreateModal}
        />
      )}

      <ConfirmationModal
        isOpen={showCreate}
        onClose={closeCreateModal}
        onConfirm={create}
        title="Create CTV Allocation"
        message="Create the annual Deck and Engine allocation workspace."
        confirmText="Create Allocation"
        isLoading={creating}
        confirmDisabled={!String(year).trim()}
        maxWidthClass="max-w-md"
      >
        <label className="block text-sm font-semibold text-slate-700">
          Allocation Year <span className="text-red-500">*</span>
          <Input
            autoFocus
            className="mt-1"
            type="number"
            min="2000"
            max="2100"
            value={year}
            invalid={Boolean(yearError)}
            onChange={(event) => updateYear(event.target.value)}
            placeholder="Example: 2026"
          />
          {yearError && (
            <span className="mt-1 block text-xs font-normal text-red-600">
              {yearError}
            </span>
          )}
        </label>
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
          Active Assessment Types will be available for the Admin to select
          separately for each cadet.
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(deleteCycle)}
        onClose={() => {
          if (!deleting) setDeleteCycle(null);
        }}
        onConfirm={confirmDelete}
        title="Delete CTV Vessel Allocation"
        message={`Delete ${deleteCycle?.allocation_number || 'this allocation'}? All Draft candidates, selected assessments, ranks, and vessel assignments in this cycle will be permanently removed.`}
        confirmText="Delete Allocation"
        confirmButtonClass="bg-red-600 hover:bg-red-700 shadow-red-600/20"
        isLoading={deleting}
      />
    </div>
  );
};

const SummaryCard = ({ label, value, helper, icon: Icon, tone }) => {
  const tones = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl border p-2.5 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{helper}</p>
    </div>
  );
};

const CycleCard = ({ cycle, canEdit, onOpen, onDelete }) => {
  const candidates = toNumber(cycle.candidate_count);
  const allocated = toNumber(cycle.allocated_count);
  const progress = candidates
    ? Math.min(100, Math.round((allocated / candidates) * 100))
    : 0;
  const stage = getCycleStage(cycle);
  const deletionBlocked =
    cycle.deck_status === 'Finalized' || cycle.engine_status === 'Finalized';

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-600">
              <Anchor size={14} />
              Allocation Cycle
            </div>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-900">
              {cycle.allocation_number}
            </h3>
          </div>
          <CycleStageBadge stage={stage} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} className="text-slate-400" />
            {cycle.allocation_year}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-slate-400" />
            {candidates} {candidates === 1 ? 'cadet' : 'cadets'}
          </span>
          <span className="flex items-center gap-1.5">
            <Ship size={16} className="text-slate-400" />
            {allocated} allocated
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <DepartmentStatus label="Deck" status={cycle.deck_status} />
          <DepartmentStatus label="Engine" status={cycle.engine_status} />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Vessel allocation</span>
            <span className="font-bold text-slate-700">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {allocated} of {candidates} cadets have an allocated vessel
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onDelete}
            disabled={deletionBlocked}
            title={
              deletionBlocked
                ? 'Unlock finalized rank lists before deleting this cycle'
                : 'Delete allocation cycle'
            }
          >
            <Trash2 size={14} className="mr-1.5" />
            Delete
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" size="sm" onClick={onOpen}>
          Open Allocation
          <ArrowRight size={15} className="ml-1.5" />
        </Button>
      </div>
    </article>
  );
};

const CycleStageBadge = ({ stage }) => {
  const styles = {
    Draft: 'bg-amber-100 text-amber-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Finalized: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ${styles[stage]}`}
    >
      {stage}
    </span>
  );
};

const DepartmentStatus = ({ label, status = 'Draft' }) => {
  const finalized = status === 'Finalized';
  return (
    <div
      className={`rounded-xl border p-3 ${
        finalized
          ? 'border-emerald-100 bg-emerald-50/70'
          : 'border-amber-100 bg-amber-50/70'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <CheckCircle2
          size={16}
          className={finalized ? 'text-emerald-600' : 'text-amber-500'}
        />
      </div>
      <p
        className={`mt-1 text-xs font-bold ${
          finalized ? 'text-emerald-700' : 'text-amber-700'
        }`}
      >
        {status || 'Draft'}
      </p>
    </div>
  );
};

const CycleCardSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex justify-between gap-4">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-6 w-44 rounded bg-slate-200" />
      </div>
      <div className="h-7 w-20 rounded-full bg-slate-200" />
    </div>
    <div className="mt-6 h-4 w-64 rounded bg-slate-100" />
    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-16 rounded-xl bg-slate-100" />
    </div>
    <div className="mt-5 h-2 rounded-full bg-slate-100" />
  </div>
);

const EmptyState = ({ filtered, canCreate, onClear, onCreate }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <Anchor size={24} />
    </div>
    <h3 className="mt-4 text-lg font-bold text-slate-900">
      {filtered ? 'No matching allocation cycles' : 'No allocation cycles yet'}
    </h3>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
      {filtered
        ? 'Try another allocation ID, year, or list status.'
        : 'Create the first annual cycle after adding active Assessment Types.'}
    </p>
    <div className="mt-5 flex justify-center gap-2">
      {filtered ? (
        <Button variant="outline" onClick={onClear}>
          Clear Filters
        </Button>
      ) : (
        canCreate && (
          <Button onClick={onCreate}>
            <Plus size={16} className="mr-2" />
            Create Allocation
          </Button>
        )
      )}
    </div>
  </div>
);

export default Allocations;
