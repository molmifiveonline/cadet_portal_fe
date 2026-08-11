import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Plus, Users, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';

const Allocations = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const cycleResponse = await api.get('/allocations');
      setCycles(cycleResponse.data.data || []);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to load allocation cycles'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    try {
      setCreating(true);
      const response = await api.post('/allocations', { year: Number(year) });
      toast.success(`${response.data.data.allocation_number} created`); navigate(`/allocations/${response.data.data.id}`);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to create allocation cycle'); }
    finally { setCreating(false); }
  };

  return <div className="py-6">
    <PageHeader title="CTV Vessel Allocation" subtitle="Annual Deck and Engine allocation cycles" icon={Anchor}>
      <Button onClick={() => setShowCreate(true)}><Plus size={18} className="mr-2" />Create Allocation</Button>
    </PageHeader>
    {showCreate && <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
      <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
        <label className="text-sm font-medium text-slate-700">Allocation year<input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-white px-3" /></label>
        <div className="rounded-lg bg-white p-3 text-sm text-slate-600">Active Assessment Types from the master will be added as blank score fields for Deck and Engine candidates.</div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button disabled={creating} onClick={create}>{creating ? 'Creating…' : 'Create Allocation'}</Button></div>
      </div>
    </div>}
    <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">{cycles.map((cycle) => <button key={cycle.id} onClick={() => navigate(`/allocations/${cycle.id}`)} className="rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Allocation cycle</p><h2 className="mt-1 text-xl font-bold text-slate-900">{cycle.allocation_number}</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{cycle.status}</span></div>
      <div className="mt-5 flex items-center gap-5 text-sm text-slate-600"><span className="flex items-center gap-1.5"><CalendarDays size={16} />{cycle.allocation_year}</span><span className="flex items-center gap-1.5"><Users size={16} />{cycle.candidate_count} candidates</span></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><StatusBox label="Deck" status={cycle.deck_status} /><StatusBox label="Engine" status={cycle.engine_status} /></div>
    </button>)}{!cycles.length && <div className="col-span-full rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">No allocation cycles yet. Configure active formulas, then create the first annual cycle.</div>}</div>
  </div>;
};

const StatusBox = ({ label, status }) => <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-sm font-bold ${status === 'Finalized' ? 'text-emerald-700' : 'text-amber-700'}`}>{status || 'Draft'}</p></div>;

export default Allocations;
