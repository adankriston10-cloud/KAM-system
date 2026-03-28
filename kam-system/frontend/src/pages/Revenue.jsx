import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Plus, DollarSign, TrendingUp, AlertTriangle, X, FileText, CheckCircle, Clock } from 'lucide-react';

const fmt = n => n >= 1e7 ? `₹${(n/1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${(n||0).toLocaleString('en-IN')}`;

function InvoiceModal({ accounts, onClose, onSaved }) {
  const [form, setForm] = useState({ account_id: '', amount: '', tax_rate: 18, due_date: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const taxAmt = ((+form.amount || 0) * form.tax_rate) / 100;
  const total = (+form.amount || 0) + taxAmt;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/revenue/invoices', form);
      toast.success('Invoice generated');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">Generate Invoice</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label">Account *</label>
            <select className="input" value={form.account_id} onChange={e => set('account_id', e.target.value)} required>
              <option value="">Select Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} required />
          </div>
          <div>
            <label className="label">GST Rate (%)</label>
            <select className="input" value={form.tax_rate} onChange={e => set('tax_rate', +e.target.value)}>
              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg text-sm space-y-1">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="font-mono">{fmt(+form.amount || 0)}</span></div>
            <div className="flex justify-between text-slate-400"><span>GST ({form.tax_rate}%)</span><span className="font-mono">{fmt(taxAmt)}</span></div>
            <div className="flex justify-between text-white font-semibold border-t border-slate-700 pt-1"><span>Total</span><span className="font-mono">{fmt(total)}</span></div>
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} required />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Generating...' : 'Generate Invoice'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RevenueModal({ accounts, onClose, onSaved }) {
  const [form, setForm] = useState({ account_id: '', type: 'mrr', amount: '', date: '', description: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/revenue', form);
      toast.success('Revenue recorded');
      onSaved();
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">Add Revenue Entry</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label">Account *</label>
            <select className="input" value={form.account_id} onChange={e => set('account_id', e.target.value)} required>
              <option value="">Select Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.company_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {['mrr','one_time','upsell','cross_sell','renewal'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Save Revenue'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

export default function Revenue() {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [invStatus, setInvStatus] = useState('');

  const fetchAll = async () => {
    const [sumRes, invRes, accRes] = await Promise.all([
      api.get('/revenue/summary'),
      api.get('/revenue/invoices', { params: invStatus ? { status: invStatus } : {} }),
      api.get('/accounts')
    ]);
    setSummary(sumRes.data);
    setInvoices(invRes.data);
    setAccounts(accRes.data);
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, [invStatus]);

  const markPaid = async (inv) => {
    await api.put(`/revenue/invoices/${inv.id}`, { status: 'paid', paid_date: new Date().toISOString().slice(0, 10) });
    toast.success('Marked as paid');
    fetchAll();
  };

  const invStatusColors = { pending: 'bg-amber-900/30 text-amber-400', paid: 'bg-emerald-900/30 text-emerald-400', overdue: 'bg-red-900/30 text-red-400' };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Revenue & Financials</h1>
          <p className="text-slate-400 text-sm mt-0.5">MRR, ACV, invoicing and payment tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveModal('revenue')} className="btn-secondary"><Plus size={14}/> Add Revenue</button>
          <button onClick={() => setActiveModal('invoice')} className="btn-primary"><Plus size={14}/> Generate Invoice</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-xs text-slate-400 mb-1">Monthly MRR</p><p className="text-xl font-display font-bold text-white">{fmt(summary?.mrr)}</p></div>
        <div className="card"><p className="text-xs text-slate-400 mb-1">Annual Contract Value</p><p className="text-xl font-display font-bold text-white">{fmt(summary?.acv)}</p></div>
        <div className="card"><p className="text-xs text-slate-400 mb-1">Total Revenue</p><p className="text-xl font-display font-bold text-white">{fmt(summary?.total_revenue)}</p></div>
        <div className="card"><p className="text-xs text-slate-400 mb-1">Upsell / Cross-sell</p><p className="text-xl font-display font-bold text-emerald-400">{fmt(summary?.upsell_revenue)}</p></div>
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-brand-400"/> Revenue Trend</h2>
        {summary?.monthly_trend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.monthly_trend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="mrr" name="MRR" fill="#4f6ef7" radius={[3,3,0,0]} />
              <Bar dataKey="upsell" name="Upsell" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="cross_sell" name="Cross-sell" fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500 text-sm">No revenue data</p>}
      </div>

      {/* Invoices */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><FileText size={15} className="text-brand-400"/> Invoices</h2>
          <div className="flex gap-1">
            {['', 'pending', 'paid', 'overdue'].map(s => (
              <button key={s} onClick={() => setInvStatus(s)} className={`px-3 py-1 text-xs rounded-lg transition-colors capitalize ${invStatus === s ? 'bg-brand-600/20 text-brand-400' : 'text-slate-400 hover:text-slate-200'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-800">
            <th className="th pl-5">Invoice #</th>
            <th className="th">Account</th>
            <th className="th">Amount</th>
            <th className="th">GST</th>
            <th className="th">Total</th>
            <th className="th">Due Date</th>
            <th className="th">Status</th>
            <th className="th"></th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="td text-center py-8 text-slate-500">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} className="td text-center py-8 text-slate-500">No invoices found</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="table-row">
                <td className="td pl-5 font-mono text-xs text-slate-300">{inv.invoice_number}</td>
                <td className="td">{inv.company_name}</td>
                <td className="td font-mono text-xs">{fmt(inv.amount)}</td>
                <td className="td font-mono text-xs text-slate-400">{fmt(inv.tax_amount)} ({inv.tax_rate}%)</td>
                <td className="td font-mono text-sm font-semibold">{fmt(inv.total_amount)}</td>
                <td className="td text-slate-400">{inv.due_date}</td>
                <td className="td"><span className={`badge ${invStatusColors[inv.status] || 'bg-slate-800 text-slate-400'}`}>{inv.status}</span></td>
                <td className="td pr-4">
                  {inv.status === 'pending' && (
                    <button onClick={() => markPaid(inv)} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                      <CheckCircle size={12}/> Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeModal === 'invoice' && <InvoiceModal accounts={accounts} onClose={() => setActiveModal(null)} onSaved={() => { setActiveModal(null); fetchAll(); }} />}
      {activeModal === 'revenue' && <RevenueModal accounts={accounts} onClose={() => setActiveModal(null)} onSaved={() => { setActiveModal(null); fetchAll(); }} />}
    </div>
  );
}
