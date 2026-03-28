import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Building2, ChevronRight, Edit, Trash2, X, Users } from 'lucide-react';

const stages = ['prospect', 'onboarding', 'active', 'at_risk', 'churned'];
const stageColors = {
  prospect: 'bg-blue-900/30 text-blue-400',
  onboarding: 'bg-purple-900/30 text-purple-400',
  active: 'bg-emerald-900/30 text-emerald-400',
  at_risk: 'bg-red-900/30 text-red-400',
  churned: 'bg-slate-800 text-slate-500'
};

function HealthBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-slate-400 font-mono">{score}</span>
    </div>
  );
}

function AccountModal({ account, onClose, onSaved, users }) {
  const [form, setForm] = useState(account || {
    company_name: '', industry: '', company_size: '', website: '', address: '',
    phone: '', health_score: 70, journey_stage: 'prospect', annual_revenue: 0, notes: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (account?.id) {
        await api.put(`/accounts/${account.id}`, form);
        toast.success('Account updated');
      } else {
        await api.post('/accounts', form);
        toast.success('Account created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">{account?.id ? 'Edit Account' : 'New Account'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Company Name *</label>
              <input className="input" value={form.company_name} onChange={e => set('company_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Industry</label>
              <input className="input" value={form.industry || ''} onChange={e => set('industry', e.target.value)} />
            </div>
            <div>
              <label className="label">Company Size</label>
              <select className="input" value={form.company_size || ''} onChange={e => set('company_size', e.target.value)}>
                <option value="">Select</option>
                {['1-10','11-50','51-200','201-500','501-1000','1001-5000','5000+'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address || ''} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className="label">Journey Stage</label>
              <select className="input" value={form.journey_stage} onChange={e => set('journey_stage', e.target.value)}>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Health Score (0-100)</label>
              <input type="number" className="input" min="0" max="100" value={form.health_score} onChange={e => set('health_score', +e.target.value)} />
            </div>
            <div>
              <label className="label">Annual Revenue (₹)</label>
              <input type="number" className="input" value={form.annual_revenue || 0} onChange={e => set('annual_revenue', +e.target.value)} />
            </div>
            <div>
              <label className="label">Account Manager</label>
              <select className="input" value={form.account_manager_id || ''} onChange={e => set('account_manager_id', e.target.value)}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : (account?.id ? 'Update Account' : 'Create Account')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [modal, setModal] = useState(null); // null | {} | account

  const fetchAccounts = async () => {
    const params = {};
    if (search) params.search = search;
    if (stage) params.stage = stage;
    const res = await api.get('/accounts', { params });
    setAccounts(res.data);
  };

  useEffect(() => {
    api.get('/auth/users').then(r => setUsers(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAccounts().finally(() => setLoading(false));
  }, [search, stage]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/accounts/${id}`);
      toast.success('Account deleted');
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Accounts</h1>
          <p className="text-slate-400 text-sm mt-0.5">{accounts.length} accounts</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary">
          <Plus size={15} /> New Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={stage} onChange={e => setStage(e.target.value)}>
          <option value="">All Stages</option>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-800">
            <tr>
              <th className="th pl-5">Company</th>
              <th className="th">Industry</th>
              <th className="th">Stage</th>
              <th className="th">Health</th>
              <th className="th">Contacts</th>
              <th className="th">Manager</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="td text-center text-slate-500 py-10">Loading...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={7} className="td text-center text-slate-500 py-10">No accounts found</td></tr>
            ) : accounts.map(a => (
              <tr key={a.id} className="table-row">
                <td className="td pl-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-brand-400" />
                    </div>
                    <div>
                      <Link to={`/accounts/${a.id}`} className="font-medium text-slate-100 hover:text-brand-400 transition-colors">{a.company_name}</Link>
                      {a.parent_name && <p className="text-xs text-slate-500">↳ {a.parent_name}</p>}
                    </div>
                  </div>
                </td>
                <td className="td text-slate-400">{a.industry || '–'}</td>
                <td className="td">
                  <span className={`badge ${stageColors[a.journey_stage] || 'bg-slate-800 text-slate-400'}`}>{a.journey_stage}</span>
                </td>
                <td className="td"><HealthBar score={a.health_score} /></td>
                <td className="td">
                  <span className="flex items-center gap-1 text-slate-400"><Users size={12} />{a.contact_count}</span>
                </td>
                <td className="td text-slate-400">{a.manager_name || '–'}</td>
                <td className="td">
                  <div className="flex items-center gap-1 justify-end pr-3">
                    <Link to={`/accounts/${a.id}`} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-brand-400 transition-colors">
                      <ChevronRight size={14} />
                    </Link>
                    <button onClick={() => setModal(a)} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(a.id, a.company_name)} className="p-1.5 rounded-md hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <AccountModal
          account={modal?.id ? modal : null}
          users={users}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAccounts(); }}
        />
      )}
    </div>
  );
}
