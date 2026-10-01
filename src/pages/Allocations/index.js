import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  ArrowRight,
  CalendarDays,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  ListChecks,
  Plus,
  Search,
  Send,
  Ship,
  Ban,
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
import DisabledAllocationNotice from './components/DisabledAllocationNotice';

const currentYear = new Date().getFullYear();

const toNumber = (value) => Number(value || 0);

const getCycleStage = (cycle) => {
  if (cycle.deleted_at) return 'Disabled';
  if (cycle.rank_list_status === 'Finalized') return 'Finalized';
  if (toNumber(cycle.candidate_count) > 0) return 'In Progress';
  return 'Draft';
};

const getCyclePipeline = (cycle) => [
  {
    label: 'Scored',
    value: toNumber(cycle.scored_count),
    icon: Calculator,
    color: 'text-blue-700',
    background: 'bg-blue-50',
  },
  {
    label: 'Allocated',
    value: toNumber(cycle.allocated_count),
    icon: Ship,
    color: 'text-indigo-700',
    background: 'bg-indigo-50',
  },
  {
    label: 'Rank Final',
    value: toNumber(cycle.finalized_candidate_count),
    icon: ListChecks,
    color: 'text-violet-700',
    background: 'bg-violet-50',
  },
  {
    label: 'Joining Plan',
    value: toNumber(cycle.joining_plan_count),
    icon: ClipboardCheck,
    color: 'text-amber-700',
    background: 'bg-amber-50',
  },
  {
    label: 'Informed',
    value: toNumber(cycle.informed_count),
    icon: Send,
    color: 'text-cyan-700',
    background: 'bg-cyan-50',
  },
  {
    label: 'Onboarded',
    value: toNumber(cycle.onboarded_count),
    icon: CheckCircle2,
    color: 'text-emerald-700',
    background: 'bg-emerald-50',
  },
];

const calculateCycleProgress = (cycle) => {
  const candidates = toNumber(cycle.candidate_count);
  if (!candidates) return 0;
  const completedMilestones = getCyclePipeline(cycle).reduce(
    (total, item) => total + Math.min(candidates, item.value),
    0,
  );
  return Math.round(
    (completedMilestones / (candidates * getCyclePipeline(cycle).length)) * 100,
  );
};

const Allocations = () => {
  const navigate = useNavigate();
  const { hasPermission: canCreate } = usePermission('allocations', 'create');
  const { hasPermission: canEdit } = usePermission('allocations', 'edit');
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear);
  const [yearError, setYearError] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [disableCycle, setDisableCycle] = useState(null);
  const [disabling, setDisabling] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState(() => {
    const department = new URLSearchParams(window.location.search).get(
      'department',
    );
    return ['Deck', 'Engine'].includes(department) ? department : 'All';
  });

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
    const enabledCycles = cycles.filter((cycle) => !cycle.deleted_at);
    const candidates = enabledCycles.reduce(
      (total, cycle) => total + toNumber(cycle.candidate_count),
      0,
    );
    const allocated = enabledCycles.reduce(
      (total, cycle) => total + toNumber(cycle.allocated_count),
      0,
    );
    const finalizedLists = enabledCycles.filter(
      (cycle) => cycle.rank_list_status === 'Finalized',
    ).length;
    return {
      candidates,
      allocated,
      finalizedLists,
      enabledCount: enabledCycles.length,
    };
  }, [cycles]);

  const filteredCycles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cycles.filter((cycle) => {
      const matchesSearch =
        !term ||
        String(cycle.allocation_number || '')
          .toLowerCase()
          .includes(term) ||
        String(cycle.allocation_year || '').includes(term) ||
        String(cycle.department || '')
          .toLowerCase()
          .includes(term);
      const matchesStatus =
        statusFilter === 'All' || getCycleStage(cycle) === statusFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        (departmentFilter === 'All' || cycle.department === departmentFilter)
      );
    });
  }, [cycles, search, statusFilter, departmentFilter]);

  const openCreateModal = () => {
    setYear(currentYear);
    setYearError('');
    setDepartment(departmentFilter === 'All' ? '' : departmentFilter);
    setDepartmentError('');
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
    if (!['Deck', 'Engine'].includes(department)) {
      setDepartmentError('Select Deck or Engine for this allocation.');
      return;
    }
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
        department,
      });
      toast.success(`${response.data.data.allocation_number} created`);
      navigate(
        `/allocations/${response.data.data.id}${canEdit ? '?action=add-candidates' : ''}`,
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to create allocation cycle',
      );
    } finally {
      setCreating(false);
    }
  };

  const confirmDisable = async () => {
    if (!disableCycle || !disableReason.trim()) return;
    try {
      setDisabling(true);
      await api.delete(`/allocations/${disableCycle.id}`, {
        data: { reason: disableReason.trim() },
      });
      toast.success(`${disableCycle.allocation_number} disabled`);
      setDisableCycle(null);
      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to disable allocation',
      );
    } finally {
      setDisabling(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDepartmentFilter('All');
  };

  return (
    <div className="py-6">
      <PageHeader
        title="CTV Vessel Allocation"
        subtitle="Manage separate annual allocation workflows for Deck and Engine"
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
          value={summary.enabledCount}
          helper="Excludes disabled allocations"
          icon={Layers3}
          tone="blue"
        />
        <SummaryCard
          label="Total Cadets"
          value={summary.candidates}
          helper="Across enabled allocations"
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
          value={`${summary.finalizedLists}/${summary.enabledCount}`}
          helper="Department rank lists"
          icon={ListChecks}
          tone="amber"
        />
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Allocation Cycles</h2>
            <p className="text-sm text-slate-500">
              Open a cycle to manage candidates, assessments, ranks, and
              vessels.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ID, year or department..."
                aria-label="Search allocation cycles"
              />
            </div>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger
                className="w-full bg-white sm:w-44"
                aria-label="Filter allocations by department"
              >
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent align="end" className="z-[100] bg-white">
                <SelectItem value="All">All departments</SelectItem>
                <SelectItem value="Deck">Deck</SelectItem>
                <SelectItem value="Engine">Engine</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="Disabled">Disabled</SelectItem>
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
              onDisable={() => {
                setDisableReason('');
                setDisableCycle(cycle);
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          filtered={Boolean(
            search || statusFilter !== 'All' || departmentFilter !== 'All',
          )}
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
        message="Choose the department for this allocation. Candidates, scores, ranks, and vessel assignments are managed separately for each department."
        confirmText={
          canEdit ? 'Create & Select Candidates' : 'Create Allocation'
        }
        isLoading={creating}
        confirmDisabled={!String(year).trim() || !department}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="allocation-department"
              className="block text-sm font-semibold text-slate-700"
            >
              Department <span className="text-red-500">*</span>
            </label>
            <Select
              value={department}
              onValueChange={(value) => {
                setDepartment(value);
                setDepartmentError('');
              }}
            >
              <SelectTrigger
                id="allocation-department"
                className="mt-1 w-full bg-white"
                invalid={Boolean(departmentError)}
              >
                <SelectValue placeholder="Select Deck or Engine" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-white">
                <SelectItem value="Deck">Deck</SelectItem>
                <SelectItem value="Engine">Engine</SelectItem>
              </SelectContent>
            </Select>
            {departmentError && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {departmentError}
              </p>
            )}
          </div>
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
          <label className="block text-sm font-semibold text-slate-700">
            Allocation ID
            <Input
              className="mt-1 bg-slate-50 font-mono"
              value={`CTV-${year || 'YEAR'}-AUTO`}
              disabled
              readOnly
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              The system assigns the next four-digit number for this year, for
              example CTV-{year || currentYear}-0001.
            </span>
          </label>
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(disableCycle)}
        onClose={() => {
          if (!disabling) setDisableCycle(null);
        }}
        onConfirm={confirmDisable}
        title="Disable CTV Vessel Allocation"
        message={`Disable ${disableCycle?.allocation_number || 'this allocation'}? All records will remain available as history. Eligible cadets can be selected in another allocation. This action cannot be undone.`}
        confirmText="Disable Allocation"
        confirmDisabled={!disableReason.trim()}
        confirmButtonClass="bg-red-600 hover:bg-red-700 shadow-red-600/20"
        isLoading={disabling}
      >
        <label className="block text-sm font-medium text-slate-700">
          Reason for disabling <span className="text-red-600">*</span>
          <textarea
            value={disableReason}
            onChange={(event) => setDisableReason(event.target.value)}
            disabled={disabling}
            maxLength={1000}
            rows={3}
            required
            className="mt-2 w-full rounded-lg border border-slate-300 p-2"
          />
        </label>
      </ConfirmationModal>
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

const CycleCard = ({ cycle, canEdit, onOpen, onDisable }) => {
  const candidates = toNumber(cycle.candidate_count);
  const allocated = toNumber(cycle.allocated_count);
  const progress = calculateCycleProgress(cycle);
  const pipeline = getCyclePipeline(cycle);
  const stage = getCycleStage(cycle);
  const disabled = Boolean(cycle.deleted_at);
  const disableBlocked =
    cycle.rank_list_status === 'Finalized' ||
    Number(cycle.existing_joining_plan_count) > 0 ||
    Number(cycle.existing_onboarding_count) > 0;

  return (
    <article
      className={`group overflow-hidden rounded-2xl border shadow-sm ${disabled ? 'border-slate-300 bg-slate-100 grayscale' : 'border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg'}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-600">
              <Anchor size={14} />
              {cycle.department} Allocation
            </div>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-900">
              {cycle.allocation_number}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CycleStageBadge stage={stage} />
            {!disabled && <ProgressCircle progress={progress} />}
          </div>
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

        <div className="mt-5">
          <DepartmentStatus
            label={`${cycle.department} Rank List`}
            status={cycle.rank_list_status}
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {disabled ? 'Recorded Workflow' : 'Overall Workflow'}
            </p>
            <p className="text-[11px] text-slate-400">
              {allocated}/{candidates} vessel allocated
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {pipeline.map((item) => (
              <PipelineMetric key={item.label} item={item} total={candidates} />
            ))}
          </div>
        </div>
      </div>

      {disabled && (
        <div className="px-5 pb-4">
          <DisabledAllocationNotice cycle={cycle} compact />
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        {canEdit && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onDisable}
            disabled={disableBlocked}
            title={
              disableBlocked
                ? 'Allocations with finalized rank lists, joining plans, or onboarding records cannot be disabled'
                : 'Disable allocation cycle'
            }
          >
            <Ban size={14} className="mr-1.5" />
            Disable
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          size="sm"
          variant={disabled ? 'outline' : 'default'}
          onClick={onOpen}
        >
          {disabled ? 'View History' : 'Open Allocation'}
          <ArrowRight size={15} className="ml-1.5" />
        </Button>
      </div>
    </article>
  );
};

const ProgressCircle = ({ progress }) => (
  <div
    className="relative flex h-12 w-12 shrink-0 items-center justify-center"
    aria-label={`${progress}% overall workflow complete`}
    title={`${progress}% overall workflow complete`}
  >
    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-slate-100"
      />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${progress} 100`}
        className={
          progress === 100
            ? 'text-emerald-500'
            : progress >= 50
              ? 'text-amber-500'
              : 'text-[#3a5f9e]'
        }
      />
    </svg>
    <span className="absolute text-[10px] font-extrabold text-slate-700">
      {progress}%
    </span>
  </div>
);

const PipelineMetric = ({ item, total }) => {
  const Icon = item.icon;
  return (
    <div
      className={`flex min-w-0 flex-col items-center rounded-lg border border-slate-100 px-1 py-2 ${item.background}`}
      title={`${item.label}: ${item.value} of ${total} cadets`}
    >
      <Icon size={14} className={`mb-1 ${item.color}`} />
      <span className={`text-sm font-extrabold leading-none ${item.color}`}>
        {item.value}
      </span>
      <span className="mt-1 max-w-full truncate text-[9px] font-bold uppercase tracking-tight text-slate-500">
        {item.label}
      </span>
    </div>
  );
};

const CycleStageBadge = ({ stage }) => {
  const styles = {
    Draft: 'bg-amber-100 text-amber-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Finalized: 'bg-emerald-100 text-emerald-700',
    Disabled: 'bg-slate-200 text-slate-700',
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
        ? 'Try another allocation ID, year, department, or list status.'
        : 'Create an annual allocation cycle for Deck or Engine.'}
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
