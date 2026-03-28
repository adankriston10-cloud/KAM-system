import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, AlertTriangle, RefreshCw, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const fmt = n => `₹${(n||0).toLocaleString('en-IN')}`;
const templateTypes = ['standard', 'enterprise', 'custom', 'pilot'];
const statusOptions = ['active', 'expired', 'renewed', 'terminated', 'draft'];

function ContractModal({ contract, accounts, onClose, onSaved }) {
  const [form, setForm] = useState(contract || {
    account_id: '', title: '', template_type: 'standard', status: 'active',
    start_date: '', end_date: '', value: 0, content: ''
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (contract?.id) await api.put(`/contracts/${contract.id}`, form);
      else await api.post('/contracts', form);
      toast.success('Contract saved');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">{contract?.id ? 'Edit Contract' : 'New Contract'}</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Account *</label>
              <select className="input" value={form.account_id} onChange={e => set('account_id', e.target.value)} required>
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.company_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Contract Title *</label>
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
              <label className="label">Template Type</label>
              <select className="input" value={form.template_type} onChange={e => set('template_type', e.target.value)}>
                {templateTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {statusOptions.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Contract Value (₹)</label>
              <input type="number" className="input" value={form.value} onChange={e => set('value', +e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Contract Content</label>
              <textarea className="input resize-none font-mono text-xs" rows={5} value={form.content || ''} onChange={e => set('content', e.target.value)} placeholder="# Contract Title&#10;&#10;Terms and conditions..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Save Contract'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SLAPanel({ contractId }) {
  const [slas, setSlas] = useState([]);
  const [penalty, setPenalty] = useState(null);
  const [form, setForm] = useState({ metric: '', target: '', unit: '%', penalty_rate: 0, current_compliance: 100 });
  const [open, setOpen] = useState(false);

  const fetchSLAs = async () => {
    const res = await api.get(`/contracts/${contractId}/slas`);
    setSlas(res.data);
  };

  const fetchPenalty = async () => {
    const res = await api.get(`/contracts/${contractId}/slas/penalty`);
    setPenalty(res.data);
  };

  useEffect(() => { fetchSLAs(); fetchPenalty(); }, [contractId]);

  const addSLA = async (e) => {
    e.preventDefault();
    await api.post(`/contracts/${contractId}/slas`, form);
    toast.success('SLA added');
    setForm({ metric: '', target: '', unit: '%', penalty_rate: 0, current_compliance: 100 });
    fetchSLAs(); fetchPenalty();
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-800">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} SLAs ({slas.length})
        {penalty?.breached > 0 && <span className="badge bg-red-900/30 text-red-400 ml-2">⚠ Penalty: {fmt(penalty.total_penalty)}</span>}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {slas.map(s => {
            const breached = s.current_compliance < parseFloat(s.target);
            return (
              <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${breached ? 'bg-red-900/10 border border-red-900/30' : 'bg-slate-800/50'}`}>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-200">{s.metric}</p>
                  <p className="text-xs text-slate-500">Target: {s.target}{s.unit} · Current: {s.current_compliance}{s.unit}</p>
                </div>
                {breached && <span className="text-xs text-red-400">Breached</span>}
                <span className="text-xs text-slate-500">Penalty: {fmt(s.penalty_rate)}</span>
              </div>
            );
          })}
          <form onSubmit={addSLA} className="grid grid-cols-5 gap-2 mt-2">
            <input className="input col-span-2 text-xs" placeholder="Metric (e.g. Uptime)" value={form.metric} onChange={e => setForm(p => ({...p, metric: e.target.value}))} required />
            <input className="input text-xs" placeholder="Target" value={form.target} onChange={e => setForm(p => ({...p, target: e.target.value}))} required />
            <input className="input text-xs" placeholder="Compliance" type="number" value={form.current_compliance} onChange={e => setForm(p => ({...p, current_compliance: +e.target.value}))} />
            <button type="submit" className="btn-primary text-xs px-2"><Plus size={12}/> Add</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);

  const fetchAll = async () => {
    const [cRes, eRes, aRes] = await Promise.all([
      api.get('/contracts'),
      api.get('/contracts/expiring', { params: { days: 90 } }),
      api.get('/accounts')
    ]);
    setContracts(cRes.data);
    setExpiring(eRes.data);
    setAccounts(aRes.data);
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  const handleRenew = async (c) => {
    const newEnd = prompt(`New end date (YYYY-MM-DD):`);
    if (!newEnd) return;
    const newVal = prompt(`New value (₹) [current: ${c.value}]:`, c.value);
    try {
      await api.post(`/contracts/${c.id}/renew`, { new_end_date: newEnd, new_value: +newVal });
      toast.success('Contract renewed');
      fetchAll();
    } catch { toast.error('Renewal failed'); }
  };

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);
  const statusColors = { active: 'bg-emerald-900/30 text-emerald-400', expired: 'bg-red-900/30 text-red-400', renewed: 'bg-blue-900/30 text-blue-400', terminated: 'bg-slate-800 text-slate-400', draft: 'bg-amber-900/30 text-amber-400' };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Contracts</h1>
          <p className="text-slate-400 text-sm mt-0.5">{contracts.length} contracts</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary"><Plus size={15}/> New Contract</button>
      </div>

      {/* Expiring Alert */}
      {expiring.length > 0 && (
        <div className="card border-amber-900/40 bg-amber-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">{expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring within 90 days</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {expiring.map(c => (
                  <span key={c.id} className="badge bg-amber-900/30 text-amber-400">
                    {c.company_name} — {c.days_to_expiry}d
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-0.5">
        {['all', ...statusOptions].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${filter === s ? 'bg-brand-600/20 text-brand-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Contract Cards */}
      <div className="space-y-3">
        {loading ? <p className="text-slate-400">Loading...</p> : filtered.map(c => {
          const daysLeft = c.days_to_expiry;
          return (
            <div key={c.id} className="card hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">{c.title}</h3>
                    <p className="text-xs text-slate-500">{c.company_name} · {c.template_type} · v{c.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${statusColors[c.status] || 'bg-slate-800 text-slate-400'}`}>{c.status}</span>
                  <button onClick={() => setModal(c)} className="p-1.5 text-slate-500 hover:text-slate-200"><FileText size={13}/></button>
                  {c.status === 'active' && daysLeft <= 90 && daysLeft > 0 && (
                    <button onClick={() => handleRenew(c)} className="btn-secondary py-1 px-2 text-xs"><RefreshCw size={11}/> Renew</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-slate-800">
                <div><p className="text-xs text-slate-500">Value</p><p className="text-sm font-mono font-medium text-slate-200">{fmt(c.value)}</p></div>
                <div><p className="text-xs text-slate-500">Start</p><p className="text-sm text-slate-200">{c.start_date}</p></div>
                <div><p className="text-xs text-slate-500">End</p><p className="text-sm text-slate-200">{c.end_date}</p></div>
                <div>
                  <p className="text-xs text-slate-500">Days Left</p>
                  <p className={`text-sm font-medium ${daysLeft <= 30 ? 'text-red-400' : daysLeft <= 90 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {daysLeft > 0 ? daysLeft : 'Expired'}
                  </p>
                </div>
              </div>
              <SLAPanel contractId={c.id} />
            </div>
          );
        })}
        {!loading && !filtered.length && <p className="text-slate-500">No contracts found</p>}
      </div>

      {modal !== null && (
        <ContractModal contract={modal?.id ? modal : null} accounts={accounts} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); }} />
      )}
    </div>
  );
}
