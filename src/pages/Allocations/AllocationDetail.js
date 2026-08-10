import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Anchor, Plus, Lock, Unlock, RotateCcw, Eye, Trash2, ListOrdered, Mail, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import PageLoader from '../../components/common/PageLoader';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';

const inputClass = 'h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-blue-500';
const today = new Date().toISOString().slice(0, 10);

const AllocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Dashboard');
  const [vesselTypes, setVesselTypes] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [joiningPlans, setJoiningPlans] = useState([]);
  const [candidateList, setCandidateList] = useState(null);
  const [vesselAllocation, setVesselAllocation] = useState(null);
  const [communicationPlan, setCommunicationPlan] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cycleResponse, typeResponse, vesselResponse, planResponse, adminResponse] = await Promise.all([
        api.get(`/allocations/${id}`),
        api.get('/allocations/masters/vessel-types', { params: { status: 'Active' } }),
        api.get('/vessels', { params: { limit: 200 } }),
        api.get('/allocations/joining-plans', { params: { cycle_id: id } }),
        api.get('/allocations/admins'),
      ]);
      setCycle(cycleResponse.data.data); setVesselTypes(typeResponse.data.data || []);
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
    {tab === 'Deck' && <RankList list={deck} reload={load} types={vesselTypes} vessels={vessels} openCandidates={() => setCandidateList(deck)} openVessel={setVesselAllocation} isSuperAdmin={user?.role === 'SuperAdmin'} />}
    {tab === 'Engine' && <RankList list={engine} reload={load} types={vesselTypes} vessels={vessels} openCandidates={() => setCandidateList(engine)} openVessel={setVesselAllocation} isSuperAdmin={user?.role === 'SuperAdmin'} />}
    {tab === 'Joining Plan' && <JoiningPlans cycle={cycle} plans={joiningPlans} reload={load} openCommunication={setCommunicationPlan} />}
    {candidateList && <CandidatePicker list={candidateList} onClose={() => setCandidateList(null)} onSaved={() => { setCandidateList(null); load(); }} />}
    {vesselAllocation && <VesselModal allocation={vesselAllocation} list={cycle.rank_lists.find((item) => item.id === vesselAllocation.rank_list_id)} types={vesselTypes} vessels={vessels} onClose={() => setVesselAllocation(null)} onSaved={() => { setVesselAllocation(null); load(); }} />}
    {communicationPlan && <CommunicationModal plan={communicationPlan} admins={admins} currentUser={user} onClose={() => setCommunicationPlan(null)} onSaved={() => { setCommunicationPlan(null); load(); }} />}
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

const RankList = ({ list, reload, openCandidates, openVessel, isSuperAdmin }) => {
  const locked = list.status === 'Finalized';
  const [confirmation, setConfirmation] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [targetRank, setTargetRank] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
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

  const saveScore = async (allocation, courseId, value) => {
    try { await api.put(`/allocations/candidate-allocations/${allocation.id}/scores`, { scores: [{ course_id: courseId, score: value }] }); reload(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to update score'); }
  };
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
  const createPlan = async (allocation, vesselRole) => {
    try { await api.post(`/allocations/candidate-allocations/${allocation.id}/joining-plan`, { vessel_role: vesselRole }); toast.success(`${vesselRole} Joining Plan created`); reload(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to create Joining Plan'); }
  };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{list.department} Rank List</h2><p className="text-sm text-slate-500">Academic Score + manual Assessment Type scores · <span className="font-semibold">{list.ranking_mode}</span> ranking</p></div><div className="flex flex-wrap gap-2">{!locked && <Button variant="outline" onClick={openCandidates}><Plus size={16} className="mr-2" />Add Candidates</Button>}{!locked && list.ranking_mode === 'Manual' && <Button variant="outline" onClick={reset}><RotateCcw size={16} className="mr-2" />Reset Score Order</Button>}{!locked && <Button onClick={finalize}><Lock size={16} className="mr-2" />Finalize</Button>}{locked && isSuperAdmin && <Button variant="outline" onClick={unlock}><Unlock size={16} className="mr-2" />Unlock</Button>}<Status status={list.status} /></div></div>
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-[1750px] w-full text-left text-sm"><thead className="bg-slate-50"><tr><Th>Current Rank</Th><Th>Candidate</Th><Th>Institute</Th><Th>Academic Score</Th>{list.formula_snapshot?.components?.map((component) => <Th key={component.course_id}>{component.name}<span className="block text-[10px] font-normal">Out of 10</span></Th>)}<Th>Final Score</Th><Th>Primary Vessel</Th><Th>Primary Status</Th><Th>Secondary Vessel</Th><Th>Secondary Status</Th><Th>Overall</Th><Th>Actions</Th></tr></thead><tbody>{list.allocations.map((allocation) => <tr key={allocation.id} className="border-t align-top">
      <Td><div className="flex items-center gap-2"><span className="min-w-7 rounded bg-blue-50 px-2 py-1 text-center font-bold text-blue-700">{allocation.current_rank || '—'}</span>{!locked && allocation.current_rank && <button title="Reorder rank" onClick={() => move(allocation)} className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"><ListOrdered size={14} />Reorder</button>}</div></Td>
      <Td><p className="font-semibold text-slate-900">{allocation.name_as_in_indos_cert}</p><p className="text-xs text-slate-500">{allocation.cadet_unique_id}</p></Td><Td>{allocation.institute_name || '—'}</Td><Td><strong>{Number(allocation.academic_score).toFixed(2)}</strong></Td>
      {list.formula_snapshot?.components?.map((component) => { const score = allocation.scores.find((item) => item.course_id === component.course_id); return <Td key={component.course_id}>{locked ? <span>{score?.score ?? '—'}</span> : <input key={`${score?.id}-${score?.score}`} type="number" min="0" max="10" step="0.01" placeholder="0-10" defaultValue={score?.score ?? ''} onBlur={(e) => saveScore(allocation, component.course_id, e.target.value)} className={`${inputClass} w-20`} />}</Td>; })}
      <Td><span className={`rounded-full px-2.5 py-1 font-bold ${allocation.final_score === null ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{allocation.final_score === null ? 'Incomplete' : Number(allocation.final_score).toFixed(2)}</span></Td>
      <Td><p className="font-semibold">{allocation.vessel_name || '—'}</p><p className="text-xs text-slate-500">{allocation.vessel_type_name || ''}</p></Td><Td><Status status={allocation.allocation_status} /></Td>
      <Td><p className="font-semibold">{allocation.secondary_vessel_name || '—'}</p><p className="text-xs text-slate-500">{allocation.secondary_vessel_type_name || ''}</p></Td><Td><Status status={allocation.secondary_allocation_status} /></Td>
      <Td><Status status={allocation.allocation_status === 'Allocated' && allocation.secondary_allocation_status === 'Allocated' ? 'Both Allocated' : allocation.allocation_status === 'Allocated' ? 'Primary Allocated' : allocation.secondary_allocation_status === 'Allocated' ? 'Secondary Allocated' : 'Not Allocated'} /></Td>
      <Td><div className="flex flex-wrap gap-1"><button className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="View candidate" onClick={() => window.open(`/cadets/view/${allocation.cadet_id}`, '_blank')}><Eye size={16} /></button>{!locked && <button className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50" title="Allocate Primary / Secondary vessel" onClick={() => openVessel(allocation)}><Anchor size={16} /></button>}{!locked && <button className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Remove candidate" onClick={() => remove(allocation)}><Trash2 size={16} /></button>}{locked && allocation.allocation_status === 'Allocated' && !allocation.primary_joining_plan_id && <button className="rounded px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50" onClick={() => createPlan(allocation, 'Primary')}>Primary Plan</button>}{locked && allocation.secondary_allocation_status === 'Allocated' && !allocation.secondary_joining_plan_id && <button className="rounded px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50" onClick={() => createPlan(allocation, 'Secondary')}>Secondary Plan</button>}</div></Td>
    </tr>)}{!list.allocations.length && <tr><td colSpan={13 + (list.formula_snapshot?.components?.length || 0)} className="p-10 text-center text-slate-500">No candidates added to this list.</td></tr>}</tbody></table></div>
    <ConfirmationModal isOpen={Boolean(confirmation)} onClose={closeConfirmation} onConfirm={confirmAction} title={confirmation?.title} message={confirmation?.message} confirmText={confirmation?.confirmText} confirmButtonClass={confirmation?.confirmButtonClass} isLoading={actionLoading} confirmDisabled={(confirmation?.remarksRequired && !remarks.trim()) || (confirmation?.showRankSelection && (!targetRank || Number(targetRank) === confirmation.currentRank))}>
      {confirmation?.showRankSelection && <label className="mb-4 block text-sm font-medium text-slate-700">Move to rank<select className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500" value={targetRank} onChange={(event) => setTargetRank(event.target.value)}><option value="">Select target rank</option>{confirmation.rankOptions?.filter((rank) => rank !== confirmation.currentRank).map((rank) => <option key={rank} value={rank}>Rank {rank}</option>)}</select></label>}
      {confirmation?.showRemarks && <label className="block text-sm font-medium text-slate-700">{confirmation.remarksLabel}<textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-blue-500" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder={confirmation.remarksRequired ? 'Required' : 'Optional'} /></label>}
    </ConfirmationModal>
  </div>;
};

const CandidatePicker = ({ list, onClose, onSaved }) => {
  const [rows, setRows] = useState([]); const [selected, setSelected] = useState([]); const [search, setSearch] = useState(''); const [batch, setBatch] = useState(''); const [institute, setInstitute] = useState(''); const [loading, setLoading] = useState(true);
  const [verifyCandidate, setVerifyCandidate] = useState(null); const [verificationRemarks, setVerificationRemarks] = useState(''); const [verifying, setVerifying] = useState(false);
  const load = useCallback(async () => { try { setLoading(true); const response = await api.get(`/allocations/rank-lists/${list.id}/eligible-candidates`); setRows(response.data.data || []); } catch (error) { toast.error(error.response?.data?.message || 'Failed to load candidates'); } finally { setLoading(false); } }, [list.id]);
  useEffect(() => { load(); }, [load]);
  const batches = [...new Set(rows.map((row) => row.batch_year).filter(Boolean))]; const institutes = [...new Set(rows.map((row) => row.institute_name).filter(Boolean))];
  const filtered = rows.filter((row) => (!search || `${row.name_as_in_indos_cert} ${row.cadet_unique_id}`.toLowerCase().includes(search.toLowerCase())) && (!batch || String(row.batch_year) === batch) && (!institute || row.institute_name === institute));
  const verify = (row) => { setVerificationRemarks(''); setVerifyCandidate(row); };
  const confirmVerification = async () => {
    if (!verificationRemarks.trim() || !verifyCandidate) return;
    try { setVerifying(true); await api.put(`/allocations/document-verifications/${verifyCandidate.id}`, { status: 'Verified', remarks: verificationRemarks.trim() }); toast.success('Documents verified'); setVerifyCandidate(null); setVerificationRemarks(''); load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Verification failed'); }
    finally { setVerifying(false); }
  };
  const add = async () => { try { await api.post(`/allocations/rank-lists/${list.id}/candidates`, { cadet_ids: selected }); toast.success('Candidates added'); onSaved(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to add candidates'); } };
  return <><Modal title={`Add ${list.department} Candidates`} onClose={onClose} width="max-w-[96vw]"><div className="mb-4 grid gap-3 md:grid-cols-4"><input className={inputClass} placeholder="Search candidate…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className={inputClass} value={batch} onChange={(e) => setBatch(e.target.value)}><option value="">All batches/years</option>{batches.map((value) => <option key={value}>{value}</option>)}</select><select className={inputClass} value={institute} onChange={(e) => setInstitute(e.target.value)}><option value="">All institutes</option>{institutes.map((value) => <option key={value}>{value}</option>)}</select><select className={inputClass} value={list.department} disabled><option>{list.department}</option></select></div><div className="max-h-[55vh] overflow-auto rounded-lg border"><table className="min-w-[1400px] w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50"><tr><Th>Select</Th><Th>Candidate ID</Th><Th>Name</Th><Th>Institute</Th><Th>Batch/Year</Th><Th>Academic Score</Th>{list.formula_snapshot?.components?.map((component) => <Th key={component.course_id}>{component.name}<span className="block text-[10px] font-normal">Out of 10</span></Th>)}<Th>Final Score</Th><Th>Current Rank</Th><Th>Vessel Type</Th><Th>Allocation Status</Th><Th>Document Gate</Th><Th>Action</Th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="border-t"><Td><input type="checkbox" disabled={!row.eligible} checked={selected.includes(row.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current,row.id] : current.filter((id) => id !== row.id))} /></Td><Td>{row.cadet_unique_id}</Td><Td><span className="font-semibold">{row.name_as_in_indos_cert}</span>{!row.eligible && <p className="text-xs text-red-600">{row.ineligible_reasons.join(' · ')}</p>}</Td><Td>{row.institute_name}</Td><Td>{row.batch_year}</Td><Td>{row.academic_score || '—'}</Td>{list.formula_snapshot?.components?.map((component) => <Td key={component.course_id}><span className="text-slate-400">Blank / 10</span></Td>)}<Td>Auto after entry</Td><Td>Auto</Td><Td>Pending</Td><Td><Status status="Pending" /></Td><Td>{row.document_verification_status === 'Verified' ? <Status status="Verified" /> : <Button size="sm" variant="outline" onClick={() => verify(row)}>Mark Verified</Button>}</Td><Td><button className="text-blue-700" onClick={() => window.open(`/cadets/view/${row.id}`, '_blank')}><Eye size={16} /></button></Td></tr>)}{!filtered.length && <tr><td colSpan={13 + (list.formula_snapshot?.components?.length || 0)} className="p-8 text-center text-slate-500">{loading ? 'Loading…' : 'No matching selected-stage candidates'}</td></tr>}</tbody></table></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!selected.length} onClick={add}>Add {selected.length || ''} Candidate{selected.length === 1 ? '' : 's'}</Button></div></Modal><ConfirmationModal isOpen={Boolean(verifyCandidate)} onClose={() => { if (!verifying) { setVerifyCandidate(null); setVerificationRemarks(''); } }} onConfirm={confirmVerification} title="Verify Candidate Documents" message={`Add verification remarks for ${verifyCandidate?.name_as_in_indos_cert || 'this candidate'}.`} confirmText="Mark Verified" isLoading={verifying} confirmDisabled={!verificationRemarks.trim()}><label className="block text-sm font-medium text-slate-700">Verification remarks<textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-blue-500" value={verificationRemarks} onChange={(event) => setVerificationRemarks(event.target.value)} placeholder="Required" /></label></ConfirmationModal></>;
};

const VesselModal = ({ allocation, list, types, vessels, onClose, onSaved }) => {
  const compatibleTypes = types.filter((item) => [list.department,'Both'].includes(item.department));
  const [form, setForm] = useState({
    vessel_type_id: allocation.vessel_type_id || '',
    vessel_id: allocation.vessel_id || '',
    allocation_status: allocation.allocation_status || 'Pending',
    secondary_vessel_type_id: allocation.secondary_vessel_type_id || '',
    secondary_vessel_id: allocation.secondary_vessel_id || '',
    secondary_allocation_status: allocation.secondary_allocation_status || 'Pending',
    admin_remarks: allocation.admin_remarks || '',
  });
  const save = async () => { try { await api.put(`/allocations/candidate-allocations/${allocation.id}/vessel`, form); toast.success('Vessel allocation saved'); onSaved(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to save vessel allocation'); } };
  return <Modal title={`CTV Vessel Allocation — ${allocation.name_as_in_indos_cert}`} onClose={onClose} width="max-w-5xl"><div className="space-y-5">
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">Allocate the cadet to Primary, Secondary, or both. At least one actual vessel must have <strong>Allocated</strong> status before finalization.</div>
    <div className="grid gap-5 lg:grid-cols-2">
      <VesselSlot role="Primary" typeField="vessel_type_id" vesselField="vessel_id" statusField="allocation_status" form={form} setForm={setForm} types={compatibleTypes} vessels={vessels} otherVesselId={form.secondary_vessel_id} />
      <VesselSlot role="Secondary" typeField="secondary_vessel_type_id" vesselField="secondary_vessel_id" statusField="secondary_allocation_status" form={form} setForm={setForm} types={compatibleTypes} vessels={vessels} otherVesselId={form.vessel_id} />
    </div>
    <Field label="Admin remarks"><textarea className="min-h-20 w-full rounded-md border p-2 text-sm" value={form.admin_remarks} onChange={(e) => setForm({ ...form, admin_remarks: e.target.value })} /></Field>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save vessel allocation</Button></div>
  </div></Modal>;
};

const VesselSlot = ({ role, typeField, vesselField, statusField, form, setForm, types, vessels, otherVesselId }) => {
  const available = vessels.filter((item) => item.status === 'Active' && item.vessel_type_id === form[typeField] && item.id !== otherVesselId);
  const selected = vessels.find((item) => item.id === form[vesselField]);
  return <div className={`space-y-4 rounded-xl border p-4 ${role === 'Primary' ? 'border-blue-200' : 'border-violet-200'}`}>
    <div><h3 className="font-bold text-slate-900">{role} Vessel</h3><p className="text-xs text-slate-500">{role === 'Primary' ? 'Main vessel assignment' : 'Alternative or additional vessel assignment'}</p></div>
    <Field label={`${role} vessel type`}><select className={`${inputClass} w-full`} value={form[typeField]} onChange={(e) => setForm({ ...form, [typeField]: e.target.value, [vesselField]: '' })}><option value="">No type selected</option>{types.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.department})</option>)}</select></Field>
    <Field label={`Actual ${role.toLowerCase()} vessel`}><select className={`${inputClass} w-full`} value={form[vesselField]} onChange={(e) => setForm({ ...form, [vesselField]: e.target.value })}><option value="">No vessel selected</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.available_seats}/{item.total_seats} seats · {item.reporting_port || item.location || 'Location TBD'}</option>)}</select></Field>
    <Field label={`${role} allocation status`}><select className={`${inputClass} w-full`} value={form[statusField]} onChange={(e) => setForm({ ...form, [statusField]: e.target.value })}>{['Pending','Allocated','Hold','Cancelled'].map((value) => <option key={value}>{value}</option>)}</select></Field>
    {selected && <div className={`grid grid-cols-2 gap-2 rounded-lg p-3 text-xs ${role === 'Primary' ? 'bg-blue-50' : 'bg-violet-50'}`}><span>Joining: <strong>{selected.joining_date || 'TBD'}</strong></span><span>Voyage: <strong>{selected.voyage_ref || '—'}</strong></span><span>Port: <strong>{selected.reporting_port || '—'}</strong></span><span>Seats: <strong>{selected.available_seats}/{selected.total_seats}</strong></span><span className="col-span-2">Contact: <strong>{selected.contact_person_name || '—'} {selected.contact_person_phone || ''}</strong></span></div>}
  </div>;
};

const JoiningPlans = ({ cycle, plans, reload, openCommunication }) => {
  const eligibleWithoutPlan = cycle.rank_lists.filter((list) => list.status === 'Finalized').flatMap((list) => list.allocations.flatMap((item) => {
    const slots = [];
    if (item.allocation_status === 'Allocated' && !item.primary_joining_plan_id) slots.push({ ...item, vesselRole: 'Primary' });
    if (item.secondary_allocation_status === 'Allocated' && !item.secondary_joining_plan_id) slots.push({ ...item, vesselRole: 'Secondary' });
    return slots;
  }));
  const create = async (allocation) => { try { await api.post(`/allocations/candidate-allocations/${allocation.id}/joining-plan`, { vessel_role: allocation.vesselRole }); toast.success(`${allocation.vesselRole} Joining Plan created`); reload(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to create plan'); } };
  return <div className="space-y-5">{eligibleWithoutPlan.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-900">{eligibleWithoutPlan.length} allocated vessel assignments are ready for Joining Plan creation.</p><div className="mt-3 flex flex-wrap gap-2">{eligibleWithoutPlan.map((item) => <Button key={`${item.id}-${item.vesselRole}`} size="sm" variant="outline" onClick={() => create(item)}>{item.name_as_in_indos_cert} · {item.vesselRole}</Button>)}</div></div>}<div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-[1200px] w-full text-left text-sm"><thead className="bg-slate-50"><tr><Th>Candidate</Th><Th>Department / Rank</Th><Th>Vessel</Th><Th>Joining</Th><Th>Reporting Port</Th><Th>Contact</Th><Th>Plan Status</Th><Th>Last Contact</Th><Th>Action</Th></tr></thead><tbody>{plans.map((plan) => <tr key={plan.id} className="border-t"><Td><p className="font-semibold">{plan.name_as_in_indos_cert}</p><p className="text-xs text-slate-500">{plan.cadet_unique_id}</p></Td><Td>{plan.department} · #{plan.current_rank}</Td><Td><p className="font-semibold">{plan.vessel_name}</p><p className="text-xs"><span className="font-semibold">{plan.vessel_role}</span> · {plan.vessel_type}</p></Td><Td>{plan.joining_date || 'TBD'}<p className="text-xs">{plan.voyage_ref || ''}</p></Td><Td>{plan.reporting_port || plan.location || '—'}</Td><Td>{plan.contact_person_name || '—'}<p className="text-xs">{plan.contact_person_phone || plan.contact_person_email}</p></Td><Td><Status status={plan.status} /></Td><Td>{plan.last_mode ? <div><span className="font-semibold">{plan.last_mode}</span>{plan.email_delivery_status && <span className="ml-2"><Status status={plan.email_delivery_status} /></span>}<p className="mt-1 text-xs text-slate-500">{plan.confirmation_received ? 'Confirmed' : 'Awaiting confirmation'}{plan.last_admin_remarks ? ` · ${plan.last_admin_remarks}` : ''}</p></div> : '—'}</Td><Td><Button size="sm" onClick={() => openCommunication(plan)}><Mail size={15} className="mr-2" />Inform</Button></Td></tr>)}{!plans.length && <tr><td colSpan="9" className="p-10 text-center text-slate-500">No Joining Plans created yet.</td></tr>}</tbody></table></div></div>;
};

const CommunicationModal = ({ plan, admins, currentUser, onClose, onSaved }) => {
  const [form, setForm] = useState({ mode: 'Email', informed_by: currentUser?.id || '', date_of_informing: today, confirmation_received: false, candidate_remarks: '', admin_remarks: '' }); const [saving,setSaving]=useState(false);
  const submit = async () => { try { setSaving(true); await api.post(`/allocations/joining-plans/${plan.id}/communications`, form); toast.success(form.mode === 'Email' ? 'Joining intimation sent' : 'Communication recorded'); onSaved(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to record communication'); onSaved(); } finally { setSaving(false); } };
  const ModeIcon = form.mode === 'Email' ? Mail : form.mode === 'Phone' ? Phone : MessageCircle;
  return <Modal title={`Joining Intimation — ${plan.name_as_in_indos_cert}`} onClose={onClose}><div className="space-y-4"><div className="rounded-lg bg-blue-50 p-3 text-sm"><strong>{plan.vessel_name}</strong> · {plan.joining_date || 'TBD'} · {plan.reporting_port || plan.location || 'Location TBD'}</div><Field label="Mode"><select className={`${inputClass} w-full`} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option>Email</option><option>Phone</option><option>WhatsApp</option></select></Field><Field label="Informed By"><select className={`${inputClass} w-full`} value={form.informed_by} onChange={(e) => setForm({ ...form, informed_by: e.target.value })}>{admins.map((item) => <option key={item.id} value={item.id}>{[item.first_name,item.last_name].filter(Boolean).join(' ') || item.email} ({item.role})</option>)}</select></Field><Field label="Date of informing"><input className={`${inputClass} w-full`} type="date" max={today} value={form.date_of_informing} onChange={(e) => setForm({ ...form, date_of_informing: e.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.confirmation_received} onChange={(e) => setForm({ ...form, confirmation_received: e.target.checked })} />Confirmation received</label><Field label="Candidate remarks"><textarea className="min-h-16 w-full rounded-md border p-2 text-sm" value={form.candidate_remarks} onChange={(e) => setForm({ ...form, candidate_remarks: e.target.value })} /></Field><Field label="Admin remarks"><textarea className="min-h-16 w-full rounded-md border p-2 text-sm" value={form.admin_remarks} onChange={(e) => setForm({ ...form, admin_remarks: e.target.value })} /></Field><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={submit}><ModeIcon size={16} className="mr-2" />{saving ? 'Saving…' : form.mode === 'Email' ? 'Send Joining Intimation' : 'Record Communication'}</Button></div></div></Modal>;
};

const Modal = ({ title, onClose, children, width = 'max-w-2xl' }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}><div className={`max-h-[92vh] w-full ${width} overflow-auto rounded-2xl bg-white p-6 shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">×</button></div>{children}</div></div>;
const Field = ({ label, children }) => <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-1">{children}</div></label>;
const Th = ({ children }) => <th className="whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">{children}</th>;
const Td = ({ children }) => <td className="px-3 py-3 text-slate-700">{children}</td>;
const Status = ({ status }) => { const good = ['Finalized','Allocated','Primary Allocated','Secondary Allocated','Both Allocated','Verified','Onboarded','Sent','Confirmed','Informed'].includes(status); const bad = ['Cancelled','Failed','Needs Review','Not Allocated'].includes(status); return <span className={`inline-flex h-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${good ? 'bg-emerald-100 text-emerald-700' : bad ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{status || 'Pending'}</span>; };

export default AllocationDetail;
