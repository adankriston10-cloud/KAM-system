import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Activity, AlertTriangle, TrendingDown, Shield, ChevronRight } from 'lucide-react';

function HealthRing({ score, size = 80 }) {
  const r = size * 0.4;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={size*0.07} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.07}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        className="health-ring"
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize={size*0.18} fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

export default function Health() {
  const [distribution, setDistribution] = useState(null);
  const [churnRisk, setChurnRisk] = useState([]);
  const [sla, setSla] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/health-distribution'),
      api.get('/dashboard/churn-risk'),
      api.get('/dashboard/sla-compliance'),
    ]).then(([d, c, s]) => {
      setDistribution(d.data);
      setChurnRisk(c.data);
      setSla(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const riskColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const barColor = (score) => score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  const radarData = distribution?.accounts?.slice(0, 5).map(a => ({
    account: a.company_name.slice(0, 12),
    score: a.health_score
  })) || [];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Account Health Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Health scores, churn prediction and risk indicators</p>
      </div>

      {/* Health Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center border-emerald-900/30">
          <p className="text-4xl font-display font-bold text-emerald-400">{distribution?.healthy || 0}</p>
          <p className="text-sm text-slate-400 mt-1">Healthy</p>
          <p className="text-xs text-slate-500">Score ≥ 80</p>
        </div>
        <div className="card text-center border-amber-900/30">
          <p className="text-4xl font-display font-bold text-amber-400">{distribution?.moderate || 0}</p>
          <p className="text-sm text-slate-400 mt-1">Moderate</p>
          <p className="text-xs text-slate-500">Score 60–79</p>
        </div>
        <div className="card text-center border-red-900/30">
          <p className="text-4xl font-display font-bold text-red-400">{distribution?.at_risk || 0}</p>
          <p className="text-sm text-slate-400 mt-1">At Risk</p>
          <p className="text-xs text-slate-500">Score &lt; 60</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Health Score Bar Chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={15} className="text-brand-400" /> Health Score by Account
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distribution?.accounts || []} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis type="category" dataKey="company_name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const a = payload[0].payload;
                  return (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
                      <p className="text-slate-200 font-semibold">{a.company_name}</p>
                      <p className="text-slate-400">Score: <span style={{ color: barColor(a.health_score) }}>{a.health_score}</span></p>
                      <p className="text-slate-400 capitalize">Stage: {a.journey_stage}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="health_score" radius={[0, 4, 4, 0]}>
                {(distribution?.accounts || []).map((a, i) => (
                  <Cell key={i} fill={barColor(a.health_score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Compliance */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={15} className="text-brand-400" /> SLA Compliance
          </h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-white">{sla?.avg_compliance}%</p>
              <p className="text-xs text-slate-500">Average Compliance</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">Compliant</span>
                <span className="text-emerald-400">{sla?.compliant}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-400">Breached</span>
                <span className="text-red-400">{sla?.breached}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sla?.slas?.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-2 rounded-lg ${s.breached ? 'bg-red-900/10 border border-red-900/30' : 'bg-slate-800/50'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{s.metric}</p>
                  <p className="text-xs text-slate-500 truncate">{s.company_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-mono font-bold ${s.breached ? 'text-red-400' : 'text-emerald-400'}`}>{s.current_compliance}%</p>
                  <p className="text-xs text-slate-500">Target: {s.target}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Churn Risk Table */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingDown size={15} className="text-red-400" /> Churn Risk Analysis
        </h2>
        {!churnRisk.length ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-slate-400 font-medium">No accounts at churn risk</p>
            <p className="text-slate-500 text-sm">All accounts have healthy scores!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {churnRisk.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <HealthRing score={a.health_score} size={52} />
                <div className="flex-1 min-w-0">
                  <Link to={`/accounts/${a.id}`} className="font-semibold text-slate-100 hover:text-brand-400 transition-colors">{a.company_name}</Link>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">{a.journey_stage}</p>
                  <div className="flex gap-3 mt-1.5">
                    {a.expiring_contracts > 0 && <span className="text-xs text-amber-400">⚠ {a.expiring_contracts} expiring contract</span>}
                    {a.high_priority_actions > 0 && <span className="text-xs text-red-400">🔥 {a.high_priority_actions} critical action</span>}
                    {a.last_nps <= 6 && <span className="text-xs text-red-400">😟 Low NPS: {a.last_nps}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge px-3 py-1 text-xs font-semibold capitalize ${a.churn_risk === 'high' ? 'bg-red-900/30 text-red-400' : a.churn_risk === 'medium' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    {a.churn_risk} risk
                  </span>
                  <Link to={`/accounts/${a.id}`} className="text-slate-500 hover:text-brand-400">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Accounts Health Grid */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">All Accounts – Health Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {distribution?.accounts?.map(a => (
            <Link key={a.id} to={`/accounts/${a.id}`} className="flex flex-col items-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-center">
              <HealthRing score={a.health_score} size={56} />
              <p className="text-xs font-medium text-slate-200 mt-2 leading-tight line-clamp-2">{a.company_name}</p>
              <span className={`badge text-xs mt-1 capitalize ${a.journey_stage === 'at_risk' ? 'bg-red-900/30 text-red-400' : 'bg-slate-700 text-slate-400'}`}>{a.journey_stage}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
