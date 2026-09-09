import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';

const checks = [
  ['passport_verified', 'Passport Verified'],
  ['medical_cert_verified', 'Medical Certificate'],
  ['bank_details_verified', 'Bank Details'],
  ['agreement_signed', 'Agreement Signed'],
  ['final_clearance', 'Final Clearance'],
];

const Onboarding = () => {
  const [rows, setRows] = useState([]); const [search,setSearch]=useState(() => new URLSearchParams(window.location.search).get('allocation') || ''); const [status,setStatus]=useState(''); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(null);
  const load = useCallback(async () => { try { setLoading(true); const response = await api.get('/onboarding'); setRows(response.data.data || []); } catch (error) { toast.error(error.response?.data?.message || 'Failed to load onboarding queue'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => rows.filter((row) => (!status || row.status === status) && (!search || `${row.name_as_in_indos_cert} ${row.cadet_unique_id} ${row.vessel_name} ${row.allocation_number}`.toLowerCase().includes(search.toLowerCase()))), [rows,search,status]);
  const update = async (row, key, checked) => { try { setSaving(row.id); await api.put(`/onboarding/${row.id}/checklist`, { ...Object.fromEntries(checks.map(([itemKey]) => [itemKey, Boolean(row[itemKey])])), [key]: checked }); toast.success(checked && row.completed_checks === 4 ? 'Cadet onboarding completed' : 'Checklist updated'); load(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to update checklist'); } finally { setSaving(null); } };
  return <div className="py-6"><PageHeader title="Cadet Onboarding" subtitle="Final clearance for CTV Assigned candidates after joining intimation" icon={ClipboardCheck} />
    <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4"><div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700"><span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Joining Intimation</span><span className="text-slate-400">→</span><span className="rounded-full bg-blue-600 px-3 py-1 text-white">Onboarding Checklist</span><span className="text-slate-400">→</span><span className="rounded-full bg-white px-3 py-1 text-slate-500">Onboarded</span></div><p className="mt-2 text-xs text-slate-600">A candidate appears here only after Email is sent successfully or Phone/WhatsApp contact is recorded.</p></div>
    <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="h-10 w-full rounded-md border pl-9 pr-3 text-sm" placeholder="Search candidate or vessel…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select className="h-10 rounded-md border bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option>Pending</option><option>Onboarded</option></select></div>
    <div className="grid gap-5 xl:grid-cols-2">{filtered.map((row) => { const locked = row.status === 'Onboarded'; const percent = Math.round((row.completed_checks / row.total_checks) * 100); return <article key={row.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">{row.name_as_in_indos_cert}</h2><p className="text-sm text-slate-500">{row.cadet_unique_id} · {row.institute_name}</p><p className="mt-1 text-sm text-blue-700">{row.allocation_number} · {row.department} · {row.vessel_name || 'Vessel pending'}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${locked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.status}</span></div><div className="my-4"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{row.completed_checks}/{row.total_checks} complete</span><span>{percent}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} /></div></div><div className="grid gap-2 sm:grid-cols-2">{checks.map(([key,label]) => <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${row[key] ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200'} ${locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}><input type="checkbox" disabled={locked || saving === row.id} checked={Boolean(row[key])} onChange={(e) => update(row,key,e.target.checked)} />{row[key] && <CheckCircle2 size={16} />}{label}</label>)}</div>{row.joining_date && <p className="mt-4 text-xs text-slate-500">Joining: {row.joining_date} · {row.reporting_port || 'Reporting port TBD'}</p>}</article>; })}{!filtered.length && <div className="col-span-full rounded-xl border border-dashed bg-white p-12 text-center text-slate-500">{loading ? 'Loading onboarding candidates…' : 'No candidates are ready. Complete a successful Joining Intimation first.'}</div>}</div>
  </div>;
};

export default Onboarding;
