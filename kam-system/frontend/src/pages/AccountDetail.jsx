import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Building2, ArrowLeft, Users, FileText, DollarSign, Activity,
  Calendar, MessageSquare, Plus, Edit, Trash2, X, MapPin, Phone,
  Globe, Star, TrendingUp, CheckSquare, Milestone
} from 'lucide-react';

const fmt = n => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${(n||0).toLocaleString('en-IN')}`;

const roleColors = {
  decision_maker: 'bg-yellow-900/30 text-yellow-400',
  influencer: 'bg-blue-900/30 text-blue-400',
  champion: 'bg-emerald-900/30 text-emerald-400',
  blocker: 'bg-red-900/30 text-red-400',
  user: 'bg-slate-800 text-slate-400'
};
const strengthLabel = s => s >= 80 ? '🔥 Strong' : s >= 60 ? '✅ Good' : s >= 40 ? '⚡ Growing' : '❄️ Weak';

function ContactModal({ contact, accountId, onClose, onSaved }) {
  const [form, setForm] = useState(contact || { name: '', email: '', phone: '', title: '', role: 'influencer', relationship_strength: 50, notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (contact?.id) await api.put(`/accounts/${accountId}/contacts/${contact.id}`, form);
      else await api.post(`/accounts/${accountId}/contacts`, form);
      toast.success('Contact saved');
      onSaved();
    } catch { toast.error('Failed to save'); } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">{contact?.id ? 'Edit Contact' : 'Add Contact'}</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Title / Designation</label><input className="input" value={form.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                {['decision_maker','influencer','champion','blocker','user'].map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Relationship Strength: {form.relationship_strength}%</label>
              <input type="range" min="0" max="100" value={form.relationship_strength} onChange={e => set('relationship_strength', +e.target.value)} className="w-full accent-brand-500" />
            </div>
            <div className="col-span-2"><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Save Contact'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TABS = ['Overview', 'Contacts', 'Contracts', 'Revenue', 'Engagement', 'Actions'];

export default function AccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [contactModal, setContactModal] = useState(null);

  const fetchAccount = async () => {
    const [accRes, tlRes] = await Promise.all([
      api.get(`/accounts/${id}`),
      api.get(`/engagement/timeline/${id}`)
    ]);
    setAccount(accRes.data);
    setTimeline(tlRes.data);
  };

  useEffect(() => { fetchAccount().finally(() => setLoading(false)); }, [id]);

  const deleteContact = async (cid) => {
    if (!confirm('Delete this contact?')) return;
    await api.delete(`/accounts/${id}/contacts/${cid}`);
    toast.success('Contact removed');
    fetchAccount();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!account) return <div className="p-6 text-slate-400">Account not found</div>;

  const healthColor = account.health_score >= 80 ? '#10b981' : account.health_score >= 60 ? '#f59e0b' : '#ef4444';
  const revenueTotal = account.revenue_summary?.reduce((s, r) => s + r.total, 0) || 0;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/accounts" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-3 transition-colors">
          <ArrowLeft size={14} /> Back to Accounts
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center">
              <Building2 size={22} className="text-brand-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">{account.company_name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                {account.industry && <span>{account.industry}</span>}
                {account.company_size && <span>· {account.company_size} employees</span>}
                {account.parent_name && <span>· Part of {account.parent_name}</span>}
              </div>
            </div>
          </div>
          {/* Health Ring */}
          <div className="flex items-center gap-2">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#1e293b" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={healthColor} strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - account.health_score / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                className="health-ring"
              />
              <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="700" fill={healthColor}>{account.health_score}</text>
            </svg>
            <div>
              <p className="text-xs text-slate-500">Health</p>
              <p className="text-xs font-medium" style={{ color: healthColor }}>
                {account.health_score >= 80 ? 'Healthy' : account.health_score >= 60 ? 'Moderate' : 'At Risk'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Stage', value: account.journey_stage, icon: Activity },
          { label: 'Total Revenue', value: fmt(revenueTotal), icon: DollarSign },
          { label: 'Active Contracts', value: account.contracts?.filter(c => c.status === 'active').length, icon: FileText },
          { label: 'Key Contacts', value: account.contacts?.length, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card py-3 px-4 flex items-center gap-3">
            <Icon size={16} className="text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-white capitalize">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-slate-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-white">Company Details</h3>
            {account.website && <div className="flex items-center gap-2 text-sm text-slate-400"><Globe size={13}/><a href={account.website} className="hover:text-brand-400 transition-colors">{account.website}</a></div>}
            {account.phone && <div className="flex items-center gap-2 text-sm text-slate-400"><Phone size={13}/>{account.phone}</div>}
            {account.address && <div className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={13}/>{account.address}</div>}
            {account.notes && <div className="text-sm text-slate-400 border-t border-slate-800 pt-3 mt-3">{account.notes}</div>}
            {account.manager_name && <div className="text-sm text-slate-400">Managed by <span className="text-slate-200">{account.manager_name}</span></div>}
          </div>

          <div className="card space-y-2">
            <h3 className="text-sm font-semibold text-white">Revenue Breakdown</h3>
            {account.revenue_summary?.length === 0 && <p className="text-slate-500 text-sm">No revenue recorded</p>}
            {account.revenue_summary?.map(r => (
              <div key={r.type} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-sm text-slate-400 capitalize">{r.type.replace('_',' ')}</span>
                <span className="text-sm font-mono font-medium text-slate-200">{fmt(r.total)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 font-semibold">
              <span className="text-sm text-white">Total</span>
              <span className="text-sm font-mono text-brand-400">{fmt(revenueTotal)}</span>
            </div>
          </div>

          <div className="card space-y-2 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Timeline</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeline.slice(0, 8).map((item, i) => {
                const icons = { meeting: Calendar, communication: MessageSquare, milestone: Star, feedback: Activity };
                const Icon = icons[item.type] || Activity;
                const typeColors = { meeting: 'text-blue-400', communication: 'text-emerald-400', milestone: 'text-yellow-400', feedback: 'text-purple-400' };
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${typeColors[item.type]}`}><Icon size={13} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.event_date?.slice(0,10)}</p>
                      {item.detail && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.detail}</p>}
                    </div>
                  </div>
                );
              })}
              {!timeline.length && <p className="text-slate-500 text-sm">No activity recorded</p>}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Contacts */}
      {tab === 'Contacts' && (
        <div className="space-y-3">
          <button onClick={() => setContactModal({})} className="btn-primary"><Plus size={14}/> Add Contact</button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {account.contacts?.map(c => (
              <div key={c.id} className="card hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center text-sm font-bold text-brand-400">
                    {c.name[0]}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setContactModal(c)} className="p-1 text-slate-500 hover:text-slate-200"><Edit size={13}/></button>
                    <button onClick={() => deleteContact(c.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={13}/></button>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-100 text-sm">{c.name}</h4>
                <p className="text-xs text-slate-500 mb-2">{c.title}</p>
                <span className={`badge text-xs mb-2 ${roleColors[c.role] || 'bg-slate-800 text-slate-400'}`}>{c.role?.replace('_',' ')}</span>
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Relationship</span>
                    <span className="text-slate-300">{strengthLabel(c.relationship_strength)}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.relationship_strength}%` }} />
                  </div>
                </div>
                {c.email && <p className="text-xs text-slate-500 mt-2">{c.email}</p>}
              </div>
            ))}
            {!account.contacts?.length && <p className="text-slate-500 col-span-3">No contacts yet</p>}
          </div>
        </div>
      )}

      {/* Tab: Contracts */}
      {tab === 'Contracts' && (
        <div className="space-y-3">
          {account.contracts?.map(c => {
            const daysLeft = Math.round((new Date(c.end_date) - new Date()) / 86400000);
            return (
              <div key={c.id} className="card hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-100">{c.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{c.template_type} · v{c.version}</p>
                  </div>
                  <span className={`badge ${c.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{c.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-800">
                  <div><p className="text-xs text-slate-500">Value</p><p className="text-sm font-mono font-medium text-slate-200">{fmt(c.value)}</p></div>
                  <div><p className="text-xs text-slate-500">Expiry</p><p className="text-sm text-slate-200">{c.end_date}</p></div>
                  <div><p className="text-xs text-slate-500">Days Left</p><p className={`text-sm font-medium ${daysLeft <= 30 ? 'text-red-400' : daysLeft <= 90 ? 'text-amber-400' : 'text-slate-200'}`}>{daysLeft > 0 ? daysLeft : 'Expired'}</p></div>
                </div>
              </div>
            );
          })}
          {!account.contracts?.length && <p className="text-slate-500">No contracts</p>}
        </div>
      )}

      {/* Tab: Revenue */}
      {tab === 'Revenue' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Revenue entries for this account</p>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-slate-800"><tr>
                <th className="th pl-5">Type</th><th className="th">Amount</th><th className="th">Date</th><th className="th">Description</th>
              </tr></thead>
              <tbody>
                {account.revenue_summary?.length === 0 && <tr><td colSpan={4} className="td text-center text-slate-500 py-8">No revenue entries</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Engagement */}
      {tab === 'Engagement' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Full Interaction Timeline</h3>
          <div className="space-y-2">
            {timeline.map((item, i) => {
              const typeIcons = { meeting: '📅', communication: '💬', milestone: '🏆', feedback: '⭐' };
              return (
                <div key={i} className="card flex gap-3 py-3">
                  <span className="text-lg">{typeIcons[item.type] || '📌'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">{item.title}</span>
                      <span className="badge bg-slate-800 text-slate-400 capitalize">{item.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.event_date?.slice(0,10)}</p>
                    {item.detail && <p className="text-xs text-slate-400 mt-1">{item.detail}</p>}
                  </div>
                </div>
              );
            })}
            {!timeline.length && <p className="text-slate-500">No engagement history</p>}
          </div>
        </div>
      )}

      {/* Tab: Actions */}
      {tab === 'Actions' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {account.action_items?.map(a => (
              <div key={a.id} className="card flex items-center gap-3">
                <CheckSquare size={16} className={a.priority === 'high' ? 'text-red-400' : a.priority === 'medium' ? 'text-amber-400' : 'text-slate-400'} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">{a.title}</p>
                  {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`badge ${a.status === 'open' ? 'bg-amber-900/30 text-amber-400' : a.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>{a.status}</span>
                  {a.due_date && <p className="text-xs text-slate-500 mt-1">{a.due_date}</p>}
                </div>
              </div>
            ))}
            {!account.action_items?.length && <p className="text-slate-500">No open action items</p>}
          </div>
        </div>
      )}

      {contactModal !== null && (
        <ContactModal
          contact={contactModal?.id ? contactModal : null}
          accountId={id}
          onClose={() => setContactModal(null)}
          onSaved={() => { setContactModal(null); fetchAccount(); }}
        />
      )}
    </div>
  );
}
