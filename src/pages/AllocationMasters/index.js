import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../context/AuthContext';

const AssessmentTypes = () => {
  const { user } = useAuth();
  const canManage = ['SuperAdmin', 'Admin'].includes(user?.role);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/allocations/masters/courses');
      setTypes(response.data.data || []);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to load Assessment Types'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    try {
      await api.post('/allocations/masters/courses', form);
      toast.success('Assessment Type added');
      setForm({ name: '' });
      load();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to add Assessment Type'); }
  };

  const toggleStatus = async (item) => {
    try {
      await api.put(`/allocations/masters/courses/${item.id}`, {
        name: item.name,
        code: item.code,
        status: item.status === 'Active' ? 'Inactive' : 'Active',
      });
      toast.success('Assessment Type updated');
      load();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to update Assessment Type'); }
  };

  return <div className="py-6">
    <PageHeader title="Assessment Type Master" subtitle="General assessment names for all Deck and Engine cadets · every score is out of 10" icon={ClipboardList} />
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      {canManage && <form onSubmit={save} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Add Assessment Type</h2>
        <label className="block text-sm font-medium text-slate-700">Assessment name<Input className="mt-1" placeholder="Example: Navigation Assessment" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">Score is fixed: Out of 10</div>
        <Button className="w-full"><Plus size={16} className="mr-2" />Add Assessment Type</Button>
      </form>}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3">Assessment Type</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th>{canManage && <th className="px-4 py-3">Action</th>}</tr></thead><tbody>{types.map((item) => <tr key={item.id} className="border-t"><td className="px-4 py-3 font-semibold">{item.name}</td><td className="px-4 py-3">Out of 10</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>{canManage && <td className="px-4 py-3"><button className="text-sm font-semibold text-blue-700" onClick={() => toggleStatus(item)}>{item.status === 'Active' ? 'Deactivate' : 'Activate'}</button></td>}</tr>)}{!types.length && <tr><td colSpan="4" className="p-10 text-center text-slate-500">{loading ? 'Loading…' : 'No Assessment Types added yet.'}</td></tr>}</tbody></table></div>
    </div>
  </div>;
};

export default AssessmentTypes;
