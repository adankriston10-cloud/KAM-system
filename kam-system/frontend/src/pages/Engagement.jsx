import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Calendar, MessageSquare, Star, Trophy, X, Trash2 } from 'lucide-react';

const TABS = ['Meetings', 'Communications', 'Milestones', 'Feedback'];

function MeetingModal({ accounts, onClose, onSaved }) {
  const [form, setForm] = useState({ account_id: '', title: '', date: '', type: 'review', notes: '', outcome: '', next_steps: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/engagement/meetings', form); toast.success('Meeting logged'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">Log Meeting</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500"/></button>
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
            <div className="col-span-2"><label className="label">Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
            <div><label className="label">Date & Time *</label><input type="datetime-local" className="input" value={form.date} onChange={e => set('date', e.target.value)} required /></div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {['review','renewal','support','onboarding','upsell','other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div><label className="label">Outcome</label><input className="input" value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="Meeting outcome summary" /></div>
          <div><label className="label">Next Steps</label><input className="input" value={form.next_steps} onChange={e => set('next_steps', e.target.value)} placeholder="Follow-up actions" /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Log Meeting'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommModal({ accounts, onClose, onSaved }) {
  const [form, setForm] = useState({ account_id: '', type: 'email', subject: '', content: '', direction: 'outbound', date: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/engagement/communications', form); toast.success('Communication logged'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">Log Communication</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label">Account *</label>
            <select className="input" value={form.account_id} onChange={e => set('account_id', e.target.value)} required>
              <option value="">Select Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.company_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {['email','call','chat','in_person','other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Direction</label>
              <select className="input" value={form.direction} onChange={e => set('direction', e.target.value)}>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="datetime-local" className="input" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
          </div>
          <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
          <div><label className="label">Content</label><textarea className="input resize-none" rows={3} value={form.content} onChange={e => set('content', e.target.value)} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Log Communication'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeedbackModal({ accounts, onClose, onSaved }) {
  const [form, setForm] = useState({ account_id: '', score: 7, type: 'nps', comments: '', date: new Date().toISOString().slice(0,10) });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/engagement/feedback', form); toast.success('Feedback recorded'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">Record Feedback</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500"/></button>
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
                <option value="nps">NPS</option>
                <option value="csat">CSAT</option>
                <option value="ces">CES</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Score: <span className="text-brand-400 font-bold text-base">{form.score}</span> / 10</label>
            <input type="range" min="0" max="10" value={form.score} onChange={e => set('score', +e.target.value)} className="w-full accent-brand-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-0.5"><span>Detractor</span><span>Promoter</span></div>
          </div>
          <div><label className="label">Comments</label><textarea className="input resize-none" rows={3} value={form.comments} onChange={e => set('comments', e.target.value)} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Save Feedback'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MilestoneModal({ accounts, onClose, onSaved }) {
  const [form, setForm] = useState({ account_id: '', title: '', description: '', date: '', type: 'other' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/engagement/milestones', form); toast.success('Milestone added'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-white">Add Milestone</h2>
          <button onClick={onClose}><X size={18} className="text-slate-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label">Account *</label>
            <select className="input" value={form.account_id} onChange={e => set('account_id', e.target.value)} required>
              <option value="">Select Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.company_name}</option>)}
            </select>
          </div>
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {['contract_signed','go_live','renewal','upsell','other'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} required /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving...' : 'Add Milestone'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Engagement() {
  const [tab, setTab] = useState('Meetings');
  const [meetings, setMeetings] = useState([]);
  const [comms, setComms] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [m, c, ms, f, a] = await Promise.all([
      api.get('/engagement/meetings'),
      api.get('/engagement/communications'),
      api.get('/engagement/milestones'),
      api.get('/engagement/feedback'),
      api.get('/accounts')
    ]);
    setMeetings(m.data); setComms(c.data); setMilestones(ms.data); setFeedback(f.data); setAccounts(a.data);
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  const delMeeting = async (id) => { await api.delete(`/engagement/meetings/${id}`); toast.success('Deleted'); fetchAll(); };
  const delComm = async (id) => { await api.delete(`/engagement/communications/${id}`); toast.success('Deleted'); fetchAll(); };
  const delMilestone = async (id) => { await api.delete(`/engagement/milestones/${id}`); toast.success('Deleted'); fetchAll(); };

  const meetingTypeColors = { review: 'text-blue-400', renewal: 'text-emerald-400', support: 'text-red-400', onboarding: 'text-purple-400', upsell: 'text-amber-400', other: 'text-slate-400' };
  const scoreColor = s => s >= 9 ? 'text-emerald-400' : s >= 7 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Engagement Tracking</h1>
          <p className="text-slate-400 text-sm mt-0.5">Meetings, communications, milestones and feedback</p>
        </div>
        <div className="flex gap-2">
          {tab === 'Meetings' && <button onClick={() => setModal('meeting')} className="btn-primary"><Plus size={14}/> Log Meeting</button>}
          {tab === 'Communications' && <button onClick={() => setModal('comm')} className="btn-primary"><Plus size={14}/> Log Communication</button>}
          {tab === 'Milestones' && <button onClick={() => setModal('milestone')} className="btn-primary"><Plus size={14}/> Add Milestone</button>}
          {tab === 'Feedback' && <button onClick={() => setModal('feedback')} className="btn-primary"><Plus size={14}/> Record Feedback</button>}
        </div>
      </div>

      <div className="flex gap-0.5 border-b border-slate-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <p className="text-slate-400">Loading...</p> : (
        <>
          {tab === 'Meetings' && (
            <div className="space-y-3">
              {meetings.map(m => (
                <div key={m.id} className="card hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className={meetingTypeColors[m.type] || 'text-slate-400'} />
                      <div>
                        <h3 className="font-semibold text-slate-100">{m.title}</h3>
                        <p className="text-xs text-slate-500">{m.company_name} · {m.date?.slice(0,16)} · <span className="capitalize">{m.type}</span></p>
                      </div>
                    </div>
                    <button onClick={() => delMeeting(m.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={13}/></button>
                  </div>
                  {m.notes && <p className="text-xs text-slate-400 mt-2 ml-7">{m.notes}</p>}
                  {m.outcome && <div className="mt-2 ml-7 flex items-center gap-2"><span className="text-xs font-medium text-emerald-400">Outcome:</span><span className="text-xs text-slate-300">{m.outcome}</span></div>}
                  {m.next_steps && <div className="ml-7 flex items-center gap-2"><span className="text-xs font-medium text-amber-400">Next:</span><span className="text-xs text-slate-300">{m.next_steps}</span></div>}
                </div>
              ))}
              {!meetings.length && <p className="text-slate-500">No meetings logged</p>}
            </div>
          )}

          {tab === 'Communications' && (
            <div className="space-y-3">
              {comms.map(c => (
                <div key={c.id} className="card hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={15} className={c.direction === 'inbound' ? 'text-emerald-400' : 'text-brand-400'} />
                      <div>
                        <h3 className="font-semibold text-slate-100">{c.subject || `${c.type} ${c.direction}`}</h3>
                        <p className="text-xs text-slate-500">{c.company_name} · {c.date?.slice(0,16)} · <span className={c.direction === 'inbound' ? 'text-emerald-400' : 'text-brand-400'}>{c.direction}</span></p>
                      </div>
                    </div>
                    <button onClick={() => delComm(c.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={13}/></button>
                  </div>
                  {c.content && <p className="text-xs text-slate-400 mt-2 ml-7 line-clamp-2">{c.content}</p>}
                </div>
              ))}
              {!comms.length && <p className="text-slate-500">No communications logged</p>}
            </div>
          )}

          {tab === 'Milestones' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {milestones.map(m => (
                <div key={m.id} className="card hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{m.type === 'go_live' ? '🚀' : m.type === 'contract_signed' ? '✍️' : m.type === 'renewal' ? '🔄' : m.type === 'upsell' ? '📈' : '🏆'}</span>
                    <button onClick={() => delMilestone(m.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={13}/></button>
                  </div>
                  <h3 className="font-semibold text-slate-100 text-sm">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{m.company_name} · {m.date}</p>
                  {m.description && <p className="text-xs text-slate-400 mt-2">{m.description}</p>}
                  <span className="badge bg-slate-800 text-slate-400 mt-2 capitalize">{m.type?.replace('_',' ')}</span>
                </div>
              ))}
              {!milestones.length && <p className="text-slate-500">No milestones recorded</p>}
            </div>
          )}

          {tab === 'Feedback' && (
            <div className="space-y-3">
              {feedback.map(f => (
                <div key={f.id} className="card hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className={`text-3xl font-display font-bold ${scoreColor(f.score)}`}>{f.score}</span>
                      <p className="text-xs text-slate-500 uppercase">{f.type}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-100">{f.company_name}</p>
                      <p className="text-xs text-slate-500">{f.date}</p>
                      {f.comments && <p className="text-xs text-slate-400 mt-1">"{f.comments}"</p>}
                    </div>
                    <div className="w-24">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${f.score >= 9 ? 'bg-emerald-500' : f.score >= 7 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${f.score * 10}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!feedback.length && <p className="text-slate-500">No feedback recorded</p>}
            </div>
          )}
        </>
      )}

      {modal === 'meeting' && <MeetingModal accounts={accounts} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); }} />}
      {modal === 'comm' && <CommModal accounts={accounts} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); }} />}
      {modal === 'milestone' && <MilestoneModal accounts={accounts} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); }} />}
      {modal === 'feedback' && <FeedbackModal accounts={accounts} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); }} />}
    </div>
  );
}
