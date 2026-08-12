import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Anchor, Plus, Lock, Unlock, RotateCcw, Eye, Trash2, ListOrdered, Mail, Phone, MessageCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import PageLoader from '../../components/common/PageLoader';
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
import { useAuth } from '../../context/AuthContext';

const inputClass = 'h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-blue-500';
const today = new Date().toISOString().slice(0, 10);
const formatRankHistoryDate = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
const getRankHistoryAdmin = (event) => event.changed_by_name || event.changed_by_email || 'Unknown admin';

const AllocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Dashboard');
  const [vesselTypes, setVesselTypes] = useState([]);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [joiningPlans, setJoiningPlans] = useState([]);
  const [candidateList, setCandidateList] = useState(null);
  const [vesselAllocation, setVesselAllocation] = useState(null);
  const [joiningPlanCandidate, setJoiningPlanCandidate] = useState(null);
  const [communicationPlan, setCommunicationPlan] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cycleResponse, typeResponse, courseResponse, vesselResponse, planResponse, adminResponse] = await Promise.all([
        api.get(`/allocations/${id}`),
        api.get('/allocations/masters/vessel-types', { params: { status: 'Active' } }),
        api.get('/allocations/masters/courses', { params: { status: 'Active' } }),
        api.get('/vessels', { params: { limit: 200 } }),
        api.get('/allocations/joining-plans', { params: { cycle_id: id } }),
        api.get('/allocations/admins'),
      ]);
      setCycle(cycleResponse.data.data); setVesselTypes(typeResponse.data.data || []);
      setAssessmentTypes(courseResponse.data.data || []);
      setVessels(vesselResponse.data.data || []); setJoiningPlans(planResponse.data.data || []); setAdmins(adminResponse.data.data || []);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to load allocation cycle'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (loading && !cycle) return <PageLoader />;
  if (!cycle) return <div className="p-8 text-center">Allocation cycle not found.</div>;
  const deck = cycle.rank_lists.find((item) => item.department === 'Deck');
  const engine = cycle.rank_lists.find((item) => item.department === 'Engine');

  return <div className="py-6">
    <PageHeader title={cycle.allocation_number} subtitle={`Annual CTV vessel allocation · ${cycle.allocation_year}`} icon={Anchor} backButton={<button onClick={() => navigate('/allocations')} className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft /></button>} />
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-white p-2">{['Dashboard','Deck','Engine','Joining Plan'].map((value) => <button key={value} onClick={() => setTab(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{value}</button>)}</div>
    {tab === 'Dashboard' && <Dashboard cycle={cycle} openCandidates={setCandidateList} />}
    {tab === 'Deck' && <RankList list={deck} assessmentTypes={assessmentTypes} reload={load} openCandidates={() => setCandidateList(deck)} openVessel={setVesselAllocation} openJoiningPlan={setJoiningPlanCandidate} isSuperAdmin={user?.role === 'SuperAdmin'} />}
    {tab === 'Engine' && <RankList list={engine} assessmentTypes={assessmentTypes} reload={load} openCandidates={() => setCandidateList(engine)} openVessel={setVesselAllocation} openJoiningPlan={setJoiningPlanCandidate} isSuperAdmin={user?.role === 'SuperAdmin'} />}
    {tab === 'Joining Plan' && <JoiningPlans cycle={cycle} plans={joiningPlans} openJoiningPlan={setJoiningPlanCandidate} openCommunication={setCommunicationPlan} />}
    {candidateList && <CandidatePicker list={candidateList} onClose={() => setCandidateList(null)} onSaved={() => { setCandidateList(null); load(); }} />}
    {vesselAllocation && <VesselModal allocation={vesselAllocation.allocation} role={vesselAllocation.role} readOnly={vesselAllocation.readOnly} list={cycle.rank_lists.find((item) => item.id === vesselAllocation.allocation.rank_list_id)} types={vesselTypes} vessels={vessels} onClose={() => setVesselAllocation(null)} onSaved={() => { setVesselAllocation(null); load(); }} />}
    {joiningPlanCandidate && <JoiningPlanModal candidate={joiningPlanCandidate} vessels={vessels} onClose={() => setJoiningPlanCandidate(null)} onCreated={(plan) => { setJoiningPlanCandidate(null); setCommunicationPlan(plan); load(); }} />}
    {communicationPlan && <CommunicationModal plan={communicationPlan} admins={admins} currentUser={user} onClose={() => { setCommunicationPlan(null); load(); }} onSaved={() => { setCommunicationPlan(null); load(); }} />}
  </div>;
};

const Dashboard = ({ cycle, openCandidates }) => {
  const all = cycle.rank_lists.flatMap((item) => item.allocations || []);
  const cards = [
    ['Candidates', all.length],
    ['Deck', cycle.rank_lists.find((item) => item.department === 'Deck')?.allocations?.length || 0],
    ['Engine', cycle.rank_lists.find((item) => item.department === 'Engine')?.allocations?.length || 0],
    ['Allocated', all.filter((item) => item.allocation_status === 'Allocated' || item.secondary_allocation_status === 'Allocated').length],
  ];
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value]) => <div key={label} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>)}</div><div className="grid gap-4 lg:grid-cols-2">{cycle.rank_lists.map((list) => <div key={list.id} className="rounded-xl border bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{list.department} Allocation</h2><p className="text-sm text-slate-500">Assessment Type scores · {list.ranking_mode} ranking</p></div><Status status={list.status} /></div><p className="mt-5 text-sm text-slate-600">{list.allocations.length} candidates · {list.allocations.filter((item) => item.final_score !== null).length} fully scored · {list.allocations.filter((item) => item.allocation_status === 'Allocated' || item.secondary_allocation_status === 'Allocated').length} vessel allocated</p>{list.status === 'Draft' && <Button className="mt-4" onClick={() => openCandidates(list)}><Plus size={16} className="mr-2" />Add {list.department} Candidates</Button>}</div>)}</div></div>;
};

const RankList = ({ list, assessmentTypes, reload, openCandidates, openVessel, openJoiningPlan, isSuperAdmin }) => {
  const locked = list.status === 'Finalized';
  const [confirmation, setConfirmation] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [targetRank, setTargetRank] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rankHistoryAllocation, setRankHistoryAllocation] = useState(null);
  const [assessmentAllocation, setAssessmentAllocation] = useState(null);
  const act = async (action, message, body = {}) => {
    try { await api.post(`/allocations/rank-lists/${list.id}/${action}`, body); toast.success(message); reload(); return true; }
    catch (error) { toast.error(error.response?.data?.message || 'Action failed'); return false; }
  };
  const openConfirmation = (config) => { setRemarks(''); setTargetRank(config.defaultTargetRank ? String(config.defaultTargetRank) : ''); setConfirmation(config); };
  const closeConfirmation = () => { if (!actionLoading) { setConfirmation(null); setRemarks(''); setTargetRank(''); } };
  const confirmAction = async () => {
    if (!confirmation || (confirmation.remarksRequired && !remarks.trim())) return;
    try {
      setActionLoading(true);
      const completed = await confirmation.action(remarks.trim(), targetRank ? Number(targetRank) : null);
      if (completed !== false) { setConfirmation(null); setRemarks(''); setTargetRank(''); }
    } finally { setActionLoading(false); }
  };
  const finalize = () => openConfirmation({ title: `Finalize ${list.department} Rank List`, message: 'This will lock scores, ranks, candidate membership, and vessel allocations.', confirmText: 'Finalize', showRemarks: true, remarksLabel: 'Remarks (optional)', action: (value) => act('finalize', `${list.department} list finalized`, { remarks: value }) });
  const unlock = () => openConfirmation({ title: `Unlock ${list.department} Rank List`, message: 'Unlocking allows allocation changes again and marks sent Joining Plans for review.', confirmText: 'Unlock', showRemarks: true, remarksRequired: true, remarksLabel: 'Reason for unlocking', action: (value) => act('unlock', `${list.department} list unlocked`, { remarks: value }) });
  const reset = () => openConfirmation({ title: 'Reset Rank Order', message: 'Ranks will return to automatic Final Score order.', confirmText: 'Reset Ranks', showRemarks: true, remarksRequired: true, remarksLabel: 'Reason for resetting ranks', action: (value) => act('reset-ranks', 'Ranks reset', { remarks: value }) });

  const move = (allocation) => {
    const rankOptions = list.allocations.filter((item) => item.current_rank).map((item) => Number(item.current_rank)).sort((left, right) => left - right);
    openConfirmation({
      title: 'Reorder Candidate Rank',
      message: `${allocation.name_as_in_indos_cert} is currently ranked #${allocation.current_rank}. Select the new rank; other candidates will shift automatically.`,
      confirmText: 'Update Rank',
      showRankSelection: true,
      rankOptions,
      currentRank: Number(allocation.current_rank),
      showRemarks: true,
      remarksRequired: true,
      remarksLabel: 'Reason for changing rank',
      action: async (value, newRank) => {
        try { await api.post(`/allocations/candidate-allocations/${allocation.id}/move-rank`, { target_rank: newRank, remarks: value }); toast.success(`Rank changed from ${allocation.current_rank} to ${newRank}`); reload(); return true; }
        catch (error) { toast.error(error.response?.data?.message || 'Failed to move rank'); return false; }
      },
    });
  };
  const remove = (allocation) => {
    openConfirmation({
      title: 'Remove Candidate',
      message: `Remove ${allocation.name_as_in_indos_cert} from this allocation?`,
      confirmText: 'Remove',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
      action: async () => {
        try { await api.delete(`/allocations/candidate-allocations/${allocation.id}`); toast.success('Candidate removed'); reload(); return true; }
        catch (error) { toast.error(error.response?.data?.message || 'Failed to remove candidate'); return false; }
      },
    });
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{list.department} Rank List</h2><p className="text-sm text-slate-500">Average of Academic Score and normalized Assessment Average · <span className="font-semibold">{list.ranking_mode}</span> ranking</p></div><div className="flex flex-wrap gap-2">{!locked && <Button variant="outline" onClick={openCandidates}><Plus size={16} className="mr-2" />Add Candidates</Button>}{!locked && list.ranking_mode === 'Manual' && <Button variant="outline" onClick={reset}><RotateCcw size={16} className="mr-2" />Reset Score Order</Button>}{!locked && <Button onClick={finalize}><Lock size={16} className="mr-2" />Finalize</Button>}{locked && isSuperAdmin && <Button variant="outline" onClick={unlock}><Unlock size={16} className="mr-2" />Unlock</Button>}<Status status={list.status} /></div></div>
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-[1900px] w-full text-left text-sm"><thead className="bg-slate-50"><tr><Th>Rank</Th><Th>Candidate</Th><Th>Institute</Th><Th>Academic Score</Th><Th>Assessment</Th><Th>Final Score<span className="block text-[10px] font-normal">Out of 100</span></Th><Th>Vessel Type Allocation</Th><Th>CTV Vessel Allocation</Th><Th>Secondary Vessel Allocation</Th><Th>Admin Remarks</Th><Th>Status</Th><Th>Actions</Th></tr></thead><tbody>{list.allocations.map((allocation) => <tr key={allocation.id} className="border-t align-top">
      <Td><div className="flex items-center gap-2"><span className="min-w-7 rounded bg-blue-50 px-2 py-1 text-center font-bold text-blue-700">{allocation.current_rank || '—'}</span>{!locked && allocation.current_rank && <button title="Reorder rank" onClick={() => move(allocation)} className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"><ListOrdered size={14} />Reorder</button>}</div></Td>
      <Td><p className="font-semibold text-slate-900">{allocation.name_as_in_indos_cert}</p><p className="text-xs text-slate-500">{allocation.cadet_unique_id}</p></Td><Td>{allocation.institute_name || '—'}</Td><Td><strong>{Number(allocation.academic_score).toFixed(2)}</strong></Td>
      <Td><AssessmentCell allocation={allocation} locked={locked} onEdit={() => setAssessmentAllocation(allocation)} /></Td>
      <Td><span className={`rounded-full px-2.5 py-1 font-bold ${allocation.final_score === null ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{allocation.final_score === null ? 'Incomplete' : Number(allocation.final_score).toFixed(2)}</span></Td>
      <Td><div className="min-w-40 space-y-1"><p><span className="text-xs text-slate-500">Primary:</span> <strong>{allocation.vessel_type_name || 'Not selected'}</strong></p><p><span className="text-xs text-slate-500">Secondary:</span> <strong>{allocation.secondary_vessel_type_name || 'Not selected'}</strong></p></div></Td>
      <Td><VesselAssignmentCell allocation={allocation} role="Primary" department={list.department} locked={locked} openVessel={openVessel} openJoiningPlan={openJoiningPlan} /></Td>
      <Td><VesselAssignmentCell allocation={allocation} role="Secondary" department={list.department} locked={locked} openVessel={openVessel} openJoiningPlan={openJoiningPlan} /></Td>
      <Td><RankHistorySummary allocation={allocation} onView={() => setRankHistoryAllocation(allocation)} /></Td>
      <Td><Status status={list.status} /></Td>
      <Td><div className="flex flex-wrap gap-1"><button className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="View candidate" onClick={() => window.open(`/cadets/view/${allocation.cadet_id}`, '_blank')}><Eye size={16} /></button>{!locked && <button className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Remove candidate" onClick={() => remove(allocation)}><Trash2 size={16} /></button>}</div></Td>
    </tr>)}{!list.allocations.length && <tr><td colSpan={12} className="p-10 text-center text-slate-500">No candidates added to this list.</td></tr>}</tbody></table></div>
    <ConfirmationModal isOpen={Boolean(confirmation)} onClose={closeConfirmation} onConfirm={confirmAction} title={confirmation?.title} message={confirmation?.message} confirmText={confirmation?.confirmText} confirmButtonClass={confirmation?.confirmButtonClass} isLoading={actionLoading} confirmDisabled={(confirmation?.remarksRequired && !remarks.trim()) || (confirmation?.showRankSelection && (!targetRank || Number(targetRank) === confirmation.currentRank))}>
      {confirmation?.showRankSelection && <label className="mb-4 block text-sm font-medium text-slate-700">Move to rank<select className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500" value={targetRank} onChange={(event) => setTargetRank(event.target.value)}><option value="">Select target rank</option>{confirmation.rankOptions?.filter((rank) => rank !== confirmation.currentRank).map((rank) => <option key={rank} value={rank}>Rank {rank}</option>)}</select></label>}
      {confirmation?.showRemarks && <label className="block text-sm font-medium text-slate-700">{confirmation.remarksLabel}<textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-blue-500" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder={confirmation.remarksRequired ? 'Required' : 'Optional'} /></label>}
    </ConfirmationModal>
    {rankHistoryAllocation && <RankHistoryModal allocation={rankHistoryAllocation} onClose={() => setRankHistoryAllocation(null)} />}
    {assessmentAllocation && <AssessmentScoreModal allocation={assessmentAllocation} assessmentTypes={assessmentTypes} onClose={() => setAssessmentAllocation(null)} onSaved={() => { setAssessmentAllocation(null); reload(); }} />}
  </div>;
};

const AssessmentCell = ({ allocation, locked, onEdit }) => {
  const scores = (allocation.scores || []).filter(
    (item) => item.score !== null && item.score !== '',
  );

  return <div className="min-w-56 space-y-2">
    {scores.length ? (
      <div className="space-y-1.5">
        {scores.map((item) => (
          <div key={item.id || item.course_id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-2.5 py-1.5">
            <span className="text-xs font-medium text-slate-700">{item.course_name_snapshot}</span>
            <span className="whitespace-nowrap text-xs font-bold text-blue-700">{Number(item.score).toFixed(2)} / 10</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-slate-400">No assessment selected</p>
    )}
    {!locked && (
      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
        {scores.length ? <Pencil size={14} className="mr-1.5" /> : <Plus size={14} className="mr-1.5" />}
        {scores.length ? 'Edit Assessment' : 'Add Assessment'}
      </Button>
    )}
  </div>;
};

const AssessmentScoreModal = ({ allocation, assessmentTypes, onClose, onSaved }) => {
  const existingScores = (allocation.scores || []).filter(
    (item) => item.score !== null && item.score !== '',
  );
  const [rows, setRows] = useState(
    existingScores.length
      ? existingScores.map((item) => ({
          course_id: item.course_id,
          score: String(item.score),
        }))
      : [{ course_id: '', score: '' }],
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const choices = [...assessmentTypes];
  existingScores.forEach((score) => {
    if (!choices.some((item) => item.id === score.course_id)) {
      choices.push({
        id: score.course_id,
        name: score.course_name_snapshot,
        status: 'Inactive',
      });
    }
  });

  const selectedIds = new Set(rows.map((row) => row.course_id).filter(Boolean));
  const hasUnusedAssessment = rows.every((row) => row.course_id)
    && choices.some((choice) => !selectedIds.has(choice.id));
  const validScoreValues = rows
    .filter((row) => row.course_id && row.score !== '')
    .map((row) => Number(row.score))
    .filter((score) => Number.isFinite(score) && score >= 0 && score <= 10);
  const hasCompletePreview = rows.length > 0 && validScoreValues.length === rows.length;
  const assessmentAverage = hasCompletePreview
    ? validScoreValues.reduce((total, score) => total + score, 0) / validScoreValues.length
    : null;
  const academicScore = Number(allocation.academic_score);
  const finalScorePreview = assessmentAverage !== null && Number.isFinite(academicScore)
    ? (academicScore + assessmentAverage * 10) / 2
    : null;

  const updateRow = (index, field, value) => {
    setRows((current) => current.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
    setErrors((current) => ({
      ...current,
      form: '',
      [`${index}.${field}`]: '',
    }));
  };

  const addRow = () => {
    setRows((current) => [...current, { course_id: '', score: '' }]);
    setErrors((current) => ({ ...current, form: '' }));
  };

  const removeRow = (index) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setErrors({});
  };

  const save = async () => {
    const nextErrors = {};
    if (!rows.length) nextErrors.form = 'Add at least one Assessment Type for this cadet.';

    const usedCourses = new Set();
    rows.forEach((row, index) => {
      if (!row.course_id) {
        nextErrors[`${index}.course_id`] = 'Select an Assessment Type.';
      } else if (usedCourses.has(row.course_id)) {
        nextErrors[`${index}.course_id`] = 'This Assessment Type is already selected.';
      } else {
        usedCourses.add(row.course_id);
      }

      const score = row.score === '' ? null : Number(row.score);
      if (score === null) {
        nextErrors[`${index}.score`] = 'Enter the score.';
      } else if (!Number.isFinite(score) || score < 0 || score > 10) {
        nextErrors[`${index}.score`] = 'Score must be between 0 and 10.';
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      await api.put(`/allocations/candidate-allocations/${allocation.id}/scores`, {
        scores: rows.map((row) => ({
          course_id: row.course_id,
          score: Number(row.score),
        })),
      });
      toast.success('Cadet assessment saved');
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save cadet assessment');
    } finally {
      setSaving(false);
    }
  };

  return <ConfirmationModal
    isOpen
    onClose={onClose}
    onConfirm={save}
    title={`Assessment — ${allocation.name_as_in_indos_cert}`}
    message="Select only the Assessment Types required for this cadet. Every score is out of 10."
    confirmText="Save Assessment"
    isLoading={saving}
    confirmDisabled={!rows.length}
    maxWidthClass="max-w-2xl"
  >
    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[11px] font-medium text-slate-500">Academic Score</p>
          <p className="mt-1 font-bold text-slate-900">{Number.isFinite(academicScore) ? academicScore.toFixed(2) : '—'}%</p>
        </div>
        <div className="border-x border-blue-100 px-2">
          <p className="text-[11px] font-medium text-slate-500">Assessment Average</p>
          <p className="mt-1 font-bold text-blue-700">{assessmentAverage === null ? '—' : assessmentAverage.toFixed(2)} / 10</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Final Score</p>
          <p className="mt-1 font-bold text-emerald-700">{finalScorePreview === null ? '—' : finalScorePreview.toFixed(2)} / 100</p>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">Final Score = (Academic % + Assessment Average %) ÷ 2</p>
    </div>
    <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
      {rows.map((row, index) => {
        const rowChoices = choices.filter(
          (choice) => choice.id === row.course_id || !selectedIds.has(choice.id),
        );
        return <div key={`${row.course_id || 'new'}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_40px] sm:items-start">
            <div>
              <label className="text-xs font-semibold text-slate-600">Assessment Type</label>
              <Select value={row.course_id} onValueChange={(value) => updateRow(index, 'course_id', value)}>
                <SelectTrigger className="mt-1 bg-white" invalid={Boolean(errors[`${index}.course_id`])}>
                  <SelectValue placeholder="Select Assessment Type" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white">
                  {rowChoices.map((choice) => (
                    <SelectItem key={choice.id} value={choice.id}>
                      {choice.name}{choice.status === 'Inactive' ? ' (Inactive)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors[`${index}.course_id`] && <FieldError>{errors[`${index}.course_id`]}</FieldError>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Score (Out of 10)</label>
              <Input
                className="mt-1 bg-white"
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={row.score}
                invalid={Boolean(errors[`${index}.score`])}
                onChange={(event) => updateRow(index, 'score', event.target.value)}
                placeholder="0-10"
              />
              {errors[`${index}.score`] && <FieldError>{errors[`${index}.score`]}</FieldError>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-5 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => removeRow(index)}
              title="Remove Assessment Type"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>;
      })}
      {!rows.length && <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">No Assessment Type selected.</div>}
    </div>
    {errors.form && <FieldError>{errors.form}</FieldError>}
    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addRow} disabled={!hasUnusedAssessment}>
      <Plus size={14} className="mr-1.5" />Add Another Assessment
    </Button>
    {!choices.length && <p className="mt-2 text-xs text-red-600">No active Assessment Types are available. Add one in Assessment Type Master first.</p>}
  </ConfirmationModal>;
};

const VesselAssignmentCell = ({ allocation, role, department, locked, openVessel, openJoiningPlan }) => {
  const secondary = role === 'Secondary';
  const vesselName = secondary ? allocation.secondary_vessel_name : allocation.vessel_name;
  const status = secondary ? allocation.secondary_allocation_status : allocation.allocation_status;
  const planId = secondary ? allocation.secondary_joining_plan_id : allocation.primary_joining_plan_id;
  const planStatus = secondary ? allocation.secondary_joining_plan_status : allocation.primary_joining_plan_status;
  const colorClass = secondary ? 'border-violet-200 text-violet-700 hover:bg-violet-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50';

  return <div className="min-w-48 space-y-2">
    <div><p className="font-semibold text-slate-900">{vesselName || 'No vessel selected'}</p><Status status={status} /></div>
    <button type="button" onClick={() => openVessel({ allocation, role, readOnly: locked })} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${colorClass}`}><Anchor size={14} />{locked ? 'View Details' : vesselName ? `Change ${role}` : `Allocate ${role}`}</button>
    {locked && status === 'Allocated' && !planId && <button type="button" onClick={() => openJoiningPlan({ ...allocation, vesselRole: role, department })} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${colorClass}`}><Mail size={14} />Create Joining Plan</button>}
    {planId && <div className="text-xs text-slate-500">Joining Plan: <Status status={planStatus || 'Draft'} /></div>}
  </div>;
};

const RankHistorySummary = ({ allocation, onView }) => {
  const history = allocation.rank_history || [];
  const latest = history[0];
  if (!latest) return <span className="text-slate-400">—</span>;

  return <div className="w-64 space-y-1.5">
    <p className="truncate font-medium text-slate-800" title={latest.remarks}>{latest.remarks}</p>
    <p className="truncate text-xs text-slate-500" title={getRankHistoryAdmin(latest)}>{getRankHistoryAdmin(latest)} · {formatRankHistoryDate(latest.created_at)}</p>
    <button type="button" onClick={onView} className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline">View all ({history.length})</button>
  </div>;
};

const RankHistoryModal = ({ allocation, onClose }) => {
  const history = allocation.rank_history || [];
  return <Modal title={`Rank Change History — ${allocation.name_as_in_indos_cert}`} onClose={onClose} width="max-w-3xl">
    <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
      <span className="font-semibold text-slate-900">{allocation.cadet_unique_id}</span> · {history.length} rank change{history.length === 1 ? '' : 's'}
    </div>
    <ol className="space-y-3">
      {history.map((event) => {
        const movedUp = event.action === 'MoveUp';
        return <li key={event.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${movedUp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{movedUp ? 'Move Up' : 'Move Down'}</span>
              <span className="font-semibold text-slate-800">Rank {event.from_rank} → Rank {event.to_rank}</span>
            </div>
            <time className="text-xs text-slate-500" dateTime={event.created_at || undefined}>{formatRankHistoryDate(event.created_at)}</time>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">{event.remarks}</p>
          <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Changed by:</span> {getRankHistoryAdmin(event)}
            {event.changed_by_name && event.changed_by_email ? <span> · {event.changed_by_email}</span> : null}
          </div>
        </li>;
      })}
    </ol>
  </Modal>;
};

const CandidatePicker = ({ list, onClose, onSaved }) => {
  const [rows, setRows] = useState([]); const [selected, setSelected] = useState([]); const [search, setSearch] = useState(''); const [batch, setBatch] = useState(''); const [institute, setInstitute] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setLoading(true); const response = await api.get(`/allocations/rank-lists/${list.id}/eligible-candidates`); setRows(response.data.data || []); } catch (error) { toast.error(error.response?.data?.message || 'Failed to load candidates'); } finally { setLoading(false); } }, [list.id]);
  useEffect(() => { load(); }, [load]);
  const batches = [...new Set(rows.map((row) => row.batch_year).filter(Boolean))]; const institutes = [...new Set(rows.map((row) => row.institute_name).filter(Boolean))];
  const filtered = rows.filter((row) => (!search || `${row.name_as_in_indos_cert} ${row.cadet_unique_id}`.toLowerCase().includes(search.toLowerCase())) && (!batch || String(row.batch_year) === batch) && (!institute || row.institute_name === institute));
  const add = async () => { try { await api.post(`/allocations/rank-lists/${list.id}/candidates`, { cadet_ids: selected }); toast.success('Candidates added'); onSaved(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to add candidates'); } };
  return <Modal title={`Add ${list.department} Candidates`} onClose={onClose} width="max-w-[96vw]">
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      Only cadets approved by Admin in <strong>Recruitment Drives → Documents</strong> are shown here.
    </div>
    <div className="mb-4 grid gap-3 md:grid-cols-4">
      <input className={inputClass} placeholder="Search candidate…" value={search} onChange={(event) => setSearch(event.target.value)} />
      <select className={inputClass} value={batch} onChange={(event) => setBatch(event.target.value)}><option value="">All batches/years</option>{batches.map((value) => <option key={value}>{value}</option>)}</select>
      <select className={inputClass} value={institute} onChange={(event) => setInstitute(event.target.value)}><option value="">All institutes</option>{institutes.map((value) => <option key={value}>{value}</option>)}</select>
      <select className={inputClass} value={list.department} disabled><option>{list.department}</option></select>
    </div>
    <div className="max-h-[55vh] overflow-auto rounded-lg border">
      <table className="min-w-[1300px] w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-50"><tr><Th>Select</Th><Th>Candidate ID</Th><Th>Name</Th><Th>Institute</Th><Th>Batch/Year</Th><Th>Academic Score</Th><Th>Assessment</Th><Th>Final Score<span className="block text-[10px] font-normal">Out of 100</span></Th><Th>Current Rank</Th><Th>Vessel Type</Th><Th>Allocation Status</Th><Th>Action</Th></tr></thead>
        <tbody>{filtered.map((row) => <tr key={row.id} className="border-t">
          <Td><input type="checkbox" disabled={!row.eligible} checked={selected.includes(row.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((candidateId) => candidateId !== row.id))} /></Td>
          <Td>{row.cadet_unique_id}</Td><Td><span className="font-semibold">{row.name_as_in_indos_cert}</span>{!row.eligible && <p className="text-xs text-red-600">{row.ineligible_reasons.join(' · ')}</p>}</Td><Td>{row.institute_name}</Td><Td>{row.batch_year}</Td><Td>{row.academic_score ?? '—'}</Td>
          <Td><span className="text-slate-400">Select after adding cadet</span></Td>
          <Td>Auto after entry</Td><Td>Auto</Td><Td>Pending</Td><Td><Status status="Pending" /></Td><Td><button type="button" className="text-blue-700" title="View candidate" onClick={() => window.open(`/cadets/view/${row.id}`, '_blank')}><Eye size={16} /></button></Td>
        </tr>)}{!filtered.length && <tr><td colSpan={12} className="p-8 text-center text-slate-500">{loading ? 'Loading…' : `No approved ${list.department} candidates found`}</td></tr>}</tbody>
      </table>
    </div>
    <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!selected.length} onClick={add}>Add {selected.length || ''} Candidate{selected.length === 1 ? '' : 's'}</Button></div>
  </Modal>;
};

const VesselModal = ({ allocation, role, readOnly, list, types, vessels, onClose, onSaved }) => {
  const compatibleTypes = types.filter((item) => [list.department,'Both'].includes(item.department));
  const secondary = role === 'Secondary';
  const typeField = secondary ? 'secondary_vessel_type_id' : 'vessel_type_id';
  const vesselField = secondary ? 'secondary_vessel_id' : 'vessel_id';
  const statusField = secondary ? 'secondary_allocation_status' : 'allocation_status';
  const otherVesselId = secondary ? allocation.vessel_id : allocation.secondary_vessel_id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vessel_type_id: allocation.vessel_type_id || '',
    vessel_id: allocation.vessel_id || '',
    allocation_status: allocation.allocation_status || 'Pending',
    secondary_vessel_type_id: allocation.secondary_vessel_type_id || '',
    secondary_vessel_id: allocation.secondary_vessel_id || '',
    secondary_allocation_status: allocation.secondary_allocation_status || 'Pending',
    admin_remarks: allocation.admin_remarks || '',
  });
  const save = async () => {
    try {
      setSaving(true);
      await api.put(`/allocations/candidate-allocations/${allocation.id}/vessel`, form);
      toast.success(`${role} vessel allocation saved`);
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save vessel allocation');
    } finally { setSaving(false); }
  };
  return <Modal title={`${role} Vessel Allocation — ${allocation.name_as_in_indos_cert}`} onClose={onClose} width="max-w-3xl"><div className="space-y-5">
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">Only active vessel types and vessels compatible with the <strong>{list.department}</strong> department are available. Allocated and Hold statuses reserve one seat.</div>
    <VesselSlot role={role} typeField={typeField} vesselField={vesselField} statusField={statusField} form={form} setForm={setForm} types={compatibleTypes} vessels={vessels} otherVesselId={otherVesselId} readOnly={readOnly} />
    <Field label="Admin remarks"><textarea disabled={readOnly} className="min-h-20 w-full rounded-md border p-2 text-sm disabled:bg-slate-50" value={form.admin_remarks} onChange={(e) => setForm({ ...form, admin_remarks: e.target.value })} /></Field>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>{!readOnly && <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : `Save ${role} Allocation`}</Button>}</div>
  </div></Modal>;
};

const VesselSlot = ({ role, typeField, vesselField, statusField, form, setForm, types, vessels, otherVesselId, readOnly }) => {
  const [showCommunication, setShowCommunication] = useState(false);
  const available = vessels.filter((item) => item.status === 'Active' && item.vessel_type_id === form[typeField] && item.id !== otherVesselId);
  const selected = vessels.find((item) => item.id === form[vesselField]);
  return <div className={`space-y-4 rounded-xl border p-4 ${role === 'Primary' ? 'border-blue-200' : 'border-violet-200'}`}>
    <div><h3 className="font-bold text-slate-900">{role} Vessel</h3><p className="text-xs text-slate-500">{role === 'Primary' ? 'Main CTV vessel assignment' : 'Alternative or additional vessel assignment'}</p></div>
    <Field label={`${role} vessel type (from Vessel Master)`}><select disabled={readOnly} className={`${inputClass} w-full disabled:bg-slate-50`} value={form[typeField]} onChange={(e) => setForm({ ...form, [typeField]: e.target.value, [vesselField]: '', [statusField]: 'Pending' })}><option value="">Select vessel type</option>{types.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.department})</option>)}</select>{!types.length && !readOnly && <p className="mt-1 text-xs font-normal text-amber-700">No active compatible vessels exist in Vessel Master. Add a vessel first.</p>}</Field>
    <Field label={`Actual ${role.toLowerCase()} vessel`}><select className={`${inputClass} w-full disabled:bg-slate-50`} value={form[vesselField]} onChange={(e) => setForm({ ...form, [vesselField]: e.target.value, ...(!e.target.value ? { [statusField]: 'Pending' } : {}) })} disabled={readOnly || !form[typeField]}><option value="">Select vessel</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.available_seats ?? 0}/{item.total_seats ?? 0} seats · {item.reporting_port || item.location || 'Location TBD'}</option>)}</select></Field>
    <Field label={`${role} allocation status`}><select disabled={readOnly} className={`${inputClass} w-full disabled:bg-slate-50`} value={form[statusField]} onChange={(e) => setForm({ ...form, [statusField]: e.target.value })}>{['Pending','Allocated','Hold','Cancelled'].map((value) => <option key={value}>{value}</option>)}</select></Field>
    {selected && <div className={`grid grid-cols-2 gap-3 rounded-lg p-3 text-xs ${role === 'Primary' ? 'bg-blue-50' : 'bg-violet-50'}`}><span>Vessel: <strong>{selected.name}</strong></span><span>Type: <strong>{types.find((item) => item.id === selected.vessel_type_id)?.name || selected.vessel_type || '—'}</strong></span><span>Location: <strong>{selected.location || '—'}</strong></span><span>Seats: <strong>{selected.available_seats ?? 0}/{selected.total_seats ?? 0}</strong></span><span>Voyage Ref: <strong>{selected.voyage_ref || '—'}</strong></span><span>Reporting Port: <strong>{selected.reporting_port || '—'}</strong></span><span className="col-span-2">Contact: <strong>{selected.contact_person_name || '—'} {selected.contact_person_phone || ''}</strong></span><button type="button" onClick={() => setShowCommunication((value) => !value)} className="col-span-2 w-fit font-semibold text-blue-700 hover:underline">{showCommunication ? 'Hide' : 'View'} communication details</button>{showCommunication && <p className="col-span-2 whitespace-pre-wrap rounded bg-white/70 p-2 text-slate-700">{selected.communication_details || 'No communication details available.'}</p>}</div>}
  </div>;
};

const JoiningPlanModal = ({ candidate, vessels, onClose, onCreated }) => {
  const secondary = candidate.vesselRole === 'Secondary';
  const vesselId = secondary ? candidate.secondary_vessel_id : candidate.vessel_id;
  const vessel = vessels.find((item) => item.id === vesselId) || {};
  const vesselType = secondary ? candidate.secondary_vessel_type_name : candidate.vessel_type_name;
  const [form, setForm] = useState({
    joining_date: '',
    location: vessel.location || '',
    voyage_ref: vessel.voyage_ref || '',
    reporting_port: vessel.reporting_port || '',
    contact_person_name: vessel.contact_person_name || '',
    contact_person_email: vessel.contact_person_email || '',
    contact_person_phone: vessel.contact_person_phone || '',
    communication_details: vessel.communication_details || '',
    required_documents: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };
  const validate = () => {
    const next = {};
    if (!form.joining_date) next.joining_date = 'Select the candidate joining date.';
    if (!form.reporting_port.trim()) next.reporting_port = 'Enter the reporting port or location.';
    if (!form.contact_person_name.trim()) next.contact_person_name = 'Enter the contact person for the joining intimation.';
    if (form.contact_person_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_person_email)) next.contact_person_email = 'Enter a valid contact email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const create = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        vessel_role: candidate.vesselRole,
        required_documents: form.required_documents.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
      };
      const response = await api.post(`/allocations/candidate-allocations/${candidate.id}/joining-plan`, payload);
      toast.success(`${candidate.vesselRole} Joining Plan created`);
      onCreated({
        ...response.data.data,
        name_as_in_indos_cert: candidate.name_as_in_indos_cert,
        cadet_unique_id: candidate.cadet_unique_id,
        email_id: candidate.email_id,
        department: candidate.department,
        current_rank: candidate.current_rank,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create Joining Plan');
    } finally { setSaving(false); }
  };

  return <Modal title={`Create ${candidate.vesselRole} Joining Plan`} onClose={onClose} width="max-w-4xl"><div className="space-y-5">
    <div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs text-slate-500">Candidate</p><p className="font-semibold">{candidate.name_as_in_indos_cert}</p></div>
      <div><p className="text-xs text-slate-500">Vessel Name</p><p className="font-semibold">{vessel.name || (secondary ? candidate.secondary_vessel_name : candidate.vessel_name)}</p></div>
      <div><p className="text-xs text-slate-500">Vessel Type</p><p className="font-semibold">{vesselType || vessel.vessel_type || '—'}</p></div>
      <div><p className="text-xs text-slate-500">Available / Total Seats</p><p className="font-semibold">{vessel.available_seats ?? 0} / {vessel.total_seats ?? 0}</p></div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Joining Date *"><input type="date" min={today} className={`${inputClass} w-full`} value={form.joining_date} onChange={(event) => setField('joining_date', event.target.value)} />{errors.joining_date && <FieldError>{errors.joining_date}</FieldError>}</Field>
      <Field label="Location"><input className={`${inputClass} w-full`} value={form.location} onChange={(event) => setField('location', event.target.value)} placeholder="Current vessel location" /></Field>
      <Field label="Voyage Reference"><input className={`${inputClass} w-full`} value={form.voyage_ref} onChange={(event) => setField('voyage_ref', event.target.value)} placeholder="Voyage reference" /></Field>
      <Field label="Reporting Port *"><input className={`${inputClass} w-full`} value={form.reporting_port} onChange={(event) => setField('reporting_port', event.target.value)} placeholder="Candidate reporting port" />{errors.reporting_port && <FieldError>{errors.reporting_port}</FieldError>}</Field>
      <Field label="Contact Person *"><input className={`${inputClass} w-full`} value={form.contact_person_name} onChange={(event) => setField('contact_person_name', event.target.value)} placeholder="Contact person name" />{errors.contact_person_name && <FieldError>{errors.contact_person_name}</FieldError>}</Field>
      <Field label="Contact Phone"><input className={`${inputClass} w-full`} value={form.contact_person_phone} onChange={(event) => setField('contact_person_phone', event.target.value)} placeholder="Phone / WhatsApp" /></Field>
      <Field label="Contact Email"><input type="email" className={`${inputClass} w-full`} value={form.contact_person_email} onChange={(event) => setField('contact_person_email', event.target.value)} placeholder="Contact email" />{errors.contact_person_email && <FieldError>{errors.contact_person_email}</FieldError>}</Field>
      <Field label="Required Documents (optional)"><textarea className="min-h-20 w-full rounded-md border p-2 text-sm" value={form.required_documents} onChange={(event) => setField('required_documents', event.target.value)} placeholder="One document per line" /></Field>
    </div>
    <div className="rounded-lg border border-slate-200 p-3"><button type="button" onClick={() => setShowCommunication((value) => !value)} className="text-sm font-semibold text-blue-700 hover:underline">{showCommunication ? 'Hide' : 'Add / View'} communication details</button>{showCommunication && <textarea className="mt-3 min-h-24 w-full rounded-md border p-2 text-sm" value={form.communication_details} onChange={(event) => setField('communication_details', event.target.value)} placeholder="Reporting instructions or communication details" />}</div>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={create}><Mail size={16} className="mr-2" />{saving ? 'Creating…' : 'Create & Continue to Intimation'}</Button></div>
  </div></Modal>;
};

const JoiningPlans = ({ cycle, plans, openJoiningPlan, openCommunication }) => {
  const eligibleWithoutPlan = cycle.rank_lists.filter((list) => list.status === 'Finalized').flatMap((list) => list.allocations.flatMap((item) => {
    const slots = [];
    if (item.allocation_status === 'Allocated' && !item.primary_joining_plan_id) slots.push({ ...item, department: list.department, vesselRole: 'Primary' });
    if (item.secondary_allocation_status === 'Allocated' && !item.secondary_joining_plan_id) slots.push({ ...item, department: list.department, vesselRole: 'Secondary' });
    return slots;
  }));
  return <div className="space-y-5">{eligibleWithoutPlan.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-900">{eligibleWithoutPlan.length} finalized vessel assignments are ready for Joining Plan creation.</p><div className="mt-3 flex flex-wrap gap-2">{eligibleWithoutPlan.map((item) => <Button key={`${item.id}-${item.vesselRole}`} size="sm" variant="outline" onClick={() => openJoiningPlan(item)}>{item.name_as_in_indos_cert} · {item.vesselRole}</Button>)}</div></div>}<div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-[1300px] w-full text-left text-sm"><thead className="bg-slate-50"><tr><Th>Candidate</Th><Th>Department / Rank</Th><Th>Vessel</Th><Th>Joining</Th><Th>Reporting Port</Th><Th>Contact</Th><Th>Plan Status</Th><Th>Last Contact</Th><Th>Action</Th></tr></thead><tbody>{plans.map((plan) => <tr key={plan.id} className="border-t"><Td><p className="font-semibold">{plan.name_as_in_indos_cert}</p><p className="text-xs text-slate-500">{plan.cadet_unique_id}</p></Td><Td>{plan.department} · #{plan.current_rank}</Td><Td><p className="font-semibold">{plan.vessel_name}</p><p className="text-xs"><span className="font-semibold">{plan.vessel_role}</span> · {plan.vessel_type}</p></Td><Td>{plan.joining_date || 'TBD'}<p className="text-xs">{plan.voyage_ref || ''}</p></Td><Td>{plan.reporting_port || plan.location || '—'}</Td><Td>{plan.contact_person_name || '—'}<p className="text-xs">{plan.contact_person_phone || plan.contact_person_email}</p></Td><Td><Status status={plan.status} /></Td><Td>{plan.last_mode ? <div className="min-w-52"><div><span className="font-semibold">{plan.last_mode}</span>{plan.email_delivery_status && <span className="ml-2"><Status status={plan.email_delivery_status} /></span>}</div><p className="mt-1 text-xs text-slate-500">{plan.last_informed_by || 'Admin'} · {plan.last_informed_at ? formatRankHistoryDate(plan.last_informed_at) : plan.last_date_of_informing || ''}</p><p className="text-xs text-slate-500">{plan.confirmation_received ? 'Confirmation received' : 'Awaiting confirmation'} · {plan.communication_count || 0} attempt(s)</p>{plan.last_failure_reason && <p className="mt-1 text-xs text-red-600">{plan.last_failure_reason}</p>}</div> : '—'}</Td><Td><Button size="sm" onClick={() => openCommunication(plan)}><Mail size={15} className="mr-2" />{plan.email_delivery_status === 'Failed' ? 'Retry / Record' : 'Inform'}</Button></Td></tr>)}{!plans.length && <tr><td colSpan="9" className="p-10 text-center text-slate-500">No Joining Plans created yet.</td></tr>}</tbody></table></div></div>;
};

const CommunicationModal = ({ plan, admins, currentUser, onClose, onSaved }) => {
  const [form, setForm] = useState({ mode: 'Email', informed_by: currentUser?.id || '', date_of_informing: today, confirmation_received: false, candidate_remarks: '', admin_remarks: '' });
  const [saving,setSaving]=useState(false);
  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [attemptError, setAttemptError] = useState('');
  const requiredDocuments = Array.isArray(plan.required_documents)
    ? plan.required_documents
    : (() => { try { return JSON.parse(plan.required_documents || '[]'); } catch (_) { return []; } })();
  const setField = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: '' })); };
  const submit = async () => {
    const nextErrors = {};
    if (!form.informed_by) nextErrors.informed_by = 'Select the Admin who informed the candidate.';
    if (!form.date_of_informing) nextErrors.date_of_informing = 'Select the informing date.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      setSaving(true);
      setAttemptError('');
      await api.post(`/allocations/joining-plans/${plan.id}/communications`, form);
      toast.success(form.mode === 'Email' ? 'Joining intimation sent' : 'Communication recorded');
      onSaved();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to record communication';
      setAttemptError(message);
      toast.error(message);
    } finally { setSaving(false); }
  };
  const ModeIcon = form.mode === 'Email' ? Mail : form.mode === 'Phone' ? Phone : MessageCircle;
  return <Modal title={`Joining Intimation — ${plan.name_as_in_indos_cert}`} onClose={onClose} width="max-w-4xl"><div className="space-y-5">
    <div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-slate-500">Vessel Name</p><p className="font-semibold">{plan.vessel_name}</p></div><div><p className="text-xs text-slate-500">Vessel Type</p><p className="font-semibold">{plan.vessel_type || '—'} · {plan.vessel_role}</p></div><div><p className="text-xs text-slate-500">Joining Date</p><p className="font-semibold">{plan.joining_date || 'TBD'}</p></div><div><p className="text-xs text-slate-500">Reporting Port</p><p className="font-semibold">{plan.reporting_port || plan.location || '—'}</p></div></div>
    <button type="button" onClick={() => setShowDetails((value) => !value)} className="text-sm font-semibold text-blue-700 hover:underline">{showDetails ? 'Hide' : 'View'} vessel and communication details</button>
    {showDetails && <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm md:grid-cols-2"><p>Location: <strong>{plan.location || '—'}</strong></p><p>Voyage Ref: <strong>{plan.voyage_ref || '—'}</strong></p><p>Total Seats: <strong>{plan.total_seats ?? '—'}</strong></p><p>Contact: <strong>{plan.contact_person_name || '—'} {plan.contact_person_phone || ''}</strong></p><p className="md:col-span-2">Contact Email: <strong>{plan.contact_person_email || '—'}</strong></p><p className="md:col-span-2 whitespace-pre-wrap">Communication Details: <strong>{plan.communication_details || '—'}</strong></p><div className="md:col-span-2"><p className="font-medium">Required Documents</p>{requiredDocuments.length ? <ul className="mt-1 list-disc pl-5">{requiredDocuments.map((document) => <li key={document}>{document}</li>)}</ul> : <p className="text-slate-500">No specific documents added.</p>}</div></div>}
    {plan.email_delivery_status && <div className="flex items-center gap-2 rounded-lg border p-3 text-sm"><span>Previous Email Status:</span><Status status={plan.email_delivery_status} />{plan.last_failure_reason && <span className="text-red-600">{plan.last_failure_reason}</span>}</div>}
    {attemptError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{attemptError} The failed attempt was saved; you can retry now.</div>}
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Mode"><select className={`${inputClass} w-full`} value={form.mode} onChange={(event) => setField('mode', event.target.value)}><option>Email</option><option>Phone</option><option>WhatsApp</option></select></Field>
      <Field label="Informed By *"><select className={`${inputClass} w-full`} value={form.informed_by} onChange={(event) => setField('informed_by', event.target.value)}><option value="">Select Admin</option>{admins.map((item) => <option key={item.id} value={item.id}>{[item.first_name,item.last_name].filter(Boolean).join(' ') || item.email} ({item.role})</option>)}</select>{errors.informed_by && <FieldError>{errors.informed_by}</FieldError>}</Field>
      <Field label="Date of Informing *"><input className={`${inputClass} w-full`} type="date" max={today} value={form.date_of_informing} onChange={(event) => setField('date_of_informing', event.target.value)} />{errors.date_of_informing && <FieldError>{errors.date_of_informing}</FieldError>}</Field>
      <Field label="Confirmation Received"><select className={`${inputClass} w-full`} value={form.confirmation_received ? 'Yes' : 'No'} onChange={(event) => setField('confirmation_received', event.target.value === 'Yes')}><option>No</option><option>Yes</option></select></Field>
      <Field label="Candidate Remarks"><textarea className="min-h-20 w-full rounded-md border p-2 text-sm" value={form.candidate_remarks} onChange={(event) => setField('candidate_remarks', event.target.value)} /></Field>
      <Field label="Admin Remarks"><textarea className="min-h-20 w-full rounded-md border p-2 text-sm" value={form.admin_remarks} onChange={(event) => setField('admin_remarks', event.target.value)} /></Field>
    </div>
    <p className="text-xs text-slate-500">Communication timestamp is recorded automatically when this action is submitted.</p>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving || (form.mode === 'Email' && !plan.email_id)} onClick={submit}><ModeIcon size={16} className="mr-2" />{saving ? 'Saving…' : form.mode === 'Email' ? (plan.email_delivery_status === 'Failed' || attemptError ? 'Retry Joining Intimation' : 'Send Joining Intimation') : 'Record Communication'}</Button></div>
    {form.mode === 'Email' && !plan.email_id && <p className="text-right text-xs text-red-600">Candidate email address is missing.</p>}
  </div></Modal>;
};

const Modal = ({ title, onClose, children, width = 'max-w-2xl' }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}><div className={`max-h-[92vh] w-full ${width} overflow-auto rounded-2xl bg-white p-6 shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">×</button></div>{children}</div></div>;
const Field = ({ label, children }) => <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-1">{children}</div></label>;
const FieldError = ({ children }) => <p className="mt-1 text-xs font-normal text-red-600">{children}</p>;
const Th = ({ children }) => <th className="whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">{children}</th>;
const Td = ({ children }) => <td className="px-3 py-3 text-slate-700">{children}</td>;
const Status = ({ status }) => { const good = ['Finalized','Allocated','Primary Allocated','Secondary Allocated','Both Allocated','Verified','Onboarded','Sent','Confirmed','Informed'].includes(status); const bad = ['Cancelled','Failed','Needs Review','Not Allocated'].includes(status); return <span className={`inline-flex h-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${good ? 'bg-emerald-100 text-emerald-700' : bad ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{status || 'Pending'}</span>; };

export default AllocationDetail;
