import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Building2, FileText, DollarSign, AlertTriangle,
  TrendingUp, Activity, Clock, CheckSquare, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt = n => n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${n?.toLocaleString('en-IN') || 0}`;
const COLORS = ['#4f6ef7', '#10b981', '#f59e0b', '#ef4444'];

function KPICard({ label, value, sub, icon: Icon, color = 'brand', trend }) {
  const colors = {
    brand: 'bg-brand-600/15 text-brand-400',
    green: 'bg-emerald-600/15 text-emerald-400',
    amber: 'bg-amber-600/15 text-amber-400',
    red: 'bg-red-600/15 text-red-400',
  };
  return (
    <div className="card flex items-start gap-4 hover:border-slate-700 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-xl font-display font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function HealthBadge({ score }) {
  const cls = score >= 80 ? 'text-emerald-400 bg-emerald-900/30' : score >= 60 ? 'text-amber-400 bg-amber-900/30' : 'text-red-400 bg-red-900/30';
  return <span className={`badge ${cls}`}>{score}</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [stages, setStages] = useState([]);
  const [churnRisk, setChurnRisk] = useState([]);
  const [topAccounts, setTopAccounts] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/revenue-trend'),
      api.get('/dashboard/stage-distribution'),
      api.get('/dashboard/churn-risk'),
      api.get('/dashboard/top-accounts'),
      api.get('/dashboard/upcoming-actions'),
    ]).then(([ov, tr, st, ch, ta, ac]) => {
      setOverview(ov.data);
      setTrend(tr.data);
      setStages(st.data);
      setChurnRisk(ch.data);
      setTopAccounts(ta.data);
      setActions(ac.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const priorityColors = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-slate-400' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Key account overview and insights</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Accounts" value={overview?.total_accounts} icon={Building2} color="brand" sub={`${overview?.at_risk_accounts} at risk`} />
        <KPICard label="Monthly Revenue" value={fmt(overview?.mrr)} icon={DollarSign} color="green" sub="This month MRR" />
        <KPICard label="Active Contracts" value={overview?.active_contracts} icon={FileText} color="brand" sub={`${fmt(overview?.contract_value)} total value`} />
        <KPICard label="Avg Health Score" value={`${overview?.avg_health_score}%`} icon={Activity} color={overview?.avg_health_score >= 70 ? 'green' : 'amber'} sub={`${overview?.at_risk_accounts} need attention`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pending Invoices" value={overview?.pending_invoices} icon={Clock} color="amber" sub={fmt(overview?.pending_invoice_value)} />
        <KPICard label="Overdue Invoices" value={overview?.overdue_invoices} icon={AlertTriangle} color="red" sub="Need immediate action" />
        <KPICard label="Expiring Contracts" value={overview?.expiring_contracts} icon={FileText} color="amber" sub="Within 90 days" />
        <KPICard label="Open Action Items" value={overview?.open_action_items} icon={CheckSquare} color="brand" sub="Across all accounts" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-brand-400" /> Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="upsell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#4f6ef7" fill="url(#mrr)" strokeWidth={2} />
              <Area type="monotone" dataKey="upsell" name="Upsell" stroke="#10b981" fill="url(#upsell)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Account Stages</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stages} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={70} label={({ stage, count }) => `${stage} (${count})`} labelLine={false} fontSize={10}>
                {stages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* At-Risk Accounts */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" /> Churn Risk
            </h2>
            <Link to="/health" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {churnRisk.slice(0, 5).map(a => (
              <Link key={a.id} to={`/accounts/${a.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{a.company_name}</p>
                  <p className="text-xs text-slate-500">{a.journey_stage}</p>
                </div>
                <HealthBadge score={a.health_score} />
                <span className={`badge text-xs ${a.churn_risk === 'high' ? 'bg-red-900/30 text-red-400' : a.churn_risk === 'medium' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  {a.churn_risk} risk
                </span>
              </Link>
            ))}
            {!churnRisk.length && <p className="text-slate-500 text-sm text-center py-4">No at-risk accounts 🎉</p>}
          </div>
        </div>

        {/* Upcoming Actions */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <CheckSquare size={15} className="text-brand-400" /> Open Actions
          </h2>
          <div className="space-y-2">
            {actions.slice(0, 5).map(a => (
              <div key={a.id} className="p-2.5 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-200 font-medium leading-snug">{a.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium ${priorityColors[a.priority] || 'text-slate-400'}`}>{a.priority}</span>
                  <span className="text-xs text-slate-500">{a.company_name}</span>
                </div>
              </div>
            ))}
            {!actions.length && <p className="text-slate-500 text-sm text-center py-4">All clear! ✓</p>}
          </div>
        </div>
      </div>

      {/* Top Accounts Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Top Accounts by Revenue</h2>
          <Link to="/accounts" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            All accounts <ChevronRight size={12} />
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="th">Company</th>
              <th className="th">Stage</th>
              <th className="th text-right">Revenue</th>
              <th className="th text-right">Contracts</th>
              <th className="th text-right">Health</th>
            </tr>
          </thead>
          <tbody>
            {topAccounts.map((a, i) => (
              <tr key={i} className="table-row">
                <td className="td font-medium">{a.company_name}</td>
                <td className="td capitalize text-slate-400">{a.journey_stage}</td>
                <td className="td text-right font-mono text-sm">{fmt(a.total_revenue)}</td>
                <td className="td text-right">{a.active_contracts}</td>
                <td className="td text-right"><HealthBadge score={a.health_score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
