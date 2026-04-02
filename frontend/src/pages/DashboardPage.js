import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { api } from '../utils/api';
import { useProjects } from '../hooks/useProjects';
import { formatNum, formatRate } from '../utils/format';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontFamily: 'JetBrains Mono, monospace' }}>
          {p.name}: {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(2) + '%' : formatNum(p.value)}
        </p>
      ))}
    </div>
  );
};

function MetricCard({ label, value, rate, rateLabel, color, icon }) {
  return (
    <div className="metric-card" style={{ '--card-accent': color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="metric-label">{label}</div>
        <span style={{ fontSize: 18, opacity: 0.6 }}>{icon}</span>
      </div>
      <div className="metric-value">{formatNum(value)}</div>
      {rate !== undefined && (
        <div className="metric-rate" style={{ color }}>
          {formatRate(rate)} {rateLabel}
        </div>
      )}
    </div>
  );
}

// Formata label do eixo X: semana ou mês/ano
function periodLabel(m) {
  if (m.week_label) return m.week_label;
  // legado mensal
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  if (m.month) return `${monthNames[m.month - 1]}/${String(m.year).slice(-2)}`;
  return m.year;
}

export default function DashboardPage() {
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMetrics(selectedProject || null);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const project = projects.find(p => p.id === parseInt(selectedProject));
  const color = project?.color || '#6366f1';

  const totals = metrics.reduce((acc, m) => ({
    sends:   acc.sends   + m.sends,
    opens:   acc.opens   + m.opens,
    clicks:  acc.clicks  + m.clicks,
    unsubs:  acc.unsubs  + m.unsubs,
    bounces: acc.bounces + m.bounces,
  }), { sends: 0, opens: 0, clicks: 0, unsubs: 0, bounces: 0 });

  const avgOpenRate  = metrics.length ? (metrics.reduce((a, m) => a + m.open_rate,   0) / metrics.length).toFixed(2) : 0;
  const avgCtr       = metrics.length ? (metrics.reduce((a, m) => a + m.ctr,         0) / metrics.length).toFixed(2) : 0;
  const avgUnsub     = metrics.length ? (metrics.reduce((a, m) => a + m.unsub_rate,  0) / metrics.length).toFixed(2) : 0;
  const avgBounce    = metrics.length ? (metrics.reduce((a, m) => a + m.bounce_rate, 0) / metrics.length).toFixed(2) : 0;

  const chartData = metrics.map(m => ({
    name: periodLabel(m),
    Envios: m.sends,
    Aberturas: m.opens,
    Cliques: m.clicks,
    'Open Rate': m.open_rate,
    'CTR': m.ctr,
    'Unsub Rate': m.unsub_rate,
    'Bounce Rate': m.bounce_rate,
  }));

  async function handleDelete(m) {
    const label = m.week_label || periodLabel(m);
    if (!window.confirm(`Excluir dados de ${label}?`)) return;
    await api.deleteMetric(m.id);
    loadMetrics();
  }

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold" style={{ fontSize: 20 }}>Dashboard</h2>
          <p className="text-muted text-sm mt-2">
            {metrics.length} {metrics.length === 1 ? 'período' : 'períodos'} analisados
          </p>
        </div>
        <div className="flex gap-3">
          <select
            className="form-control"
            style={{ width: 200 }}
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">Todos os projetos</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <a className="btn btn-ghost" href={api.exportUrl(selectedProject)} download>
            ⬇️ Exportar
          </a>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : metrics.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">Nenhum dado encontrado</div>
          <div className="empty-sub">Importe dados para visualizar o dashboard</div>
        </div>
      ) : (
        <>
          <div className="grid-4 mb-6">
            <MetricCard label="Total Envios"  value={totals.sends}   color={color}     icon="📤" />
            <MetricCard label="Aberturas"     value={totals.opens}   rate={avgOpenRate} rateLabel="média" color="#10b981" icon="📬" />
            <MetricCard label="Cliques"       value={totals.clicks}  rate={avgCtr}      rateLabel="CTR médio" color="#06b6d4" icon="🖱️" />
            <MetricCard label="Bounces"       value={totals.bounces} rate={avgBounce}   rateLabel="média" color="#ef4444" icon="↩️" />
          </div>

          <div className="grid-4 mb-8" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { label: 'Open Rate Médio',  value: avgOpenRate + '%', color: '#10b981' },
              { label: 'CTR Médio',        value: avgCtr      + '%', color: '#06b6d4' },
              { label: 'Unsub Rate Médio', value: avgUnsub    + '%', color: '#f59e0b' },
              { label: 'Bounce Rate Médio',value: avgBounce   + '%', color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 20px' }}>
                <div className="metric-label">{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="card mb-6">
            <h3 className="font-semibold mb-6" style={{ fontSize: 14 }}>📈 Evolução por Período — Volume</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#555a72', fontSize: 11 }} />
                <YAxis tick={{ fill: '#555a72', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8b8fa8' }} />
                <Line type="monotone" dataKey="Envios"    stroke={color}     strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Aberturas" stroke="#10b981"   strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Cliques"   stroke="#06b6d4"   strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card mb-6">
            <h3 className="font-semibold mb-6" style={{ fontSize: 14 }}>📉 Taxas por Período (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#555a72', fontSize: 11 }} />
                <YAxis tick={{ fill: '#555a72', fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8b8fa8' }} />
                <Bar dataKey="Open Rate"   fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="CTR"         fill="#06b6d4" radius={[4,4,0,0]} />
                <Bar dataKey="Unsub Rate"  fill="#f59e0b" radius={[4,4,0,0]} />
                <Bar dataKey="Bounce Rate" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontSize: 14 }}>📋 Histórico Detalhado</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {!selectedProject && <th>Projeto</th>}
                    <th>Período</th>
                    <th>Envios</th>
                    <th>Aberturas</th>
                    <th>Open Rate</th>
                    <th>Cliques</th>
                    <th>CTR</th>
                    <th>Unsubs</th>
                    <th>Unsub %</th>
                    <th>Bounces</th>
                    <th>Bounce %</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(m => (
                    <tr key={m.id}>
                      {!selectedProject && (
                        <td>
                          <span className="flex items-center gap-2">
                            <span className="project-dot" style={{ background: m.project_color }} />
                            {m.project_name}
                          </span>
                        </td>
                      )}
                      <td className="num">{periodLabel(m)}</td>
                      <td className="num">{formatNum(m.sends)}</td>
                      <td className="num">{formatNum(m.opens)}</td>
                      <td><span className="badge badge-green">{formatRate(m.open_rate)}</span></td>
                      <td className="num">{formatNum(m.clicks)}</td>
                      <td><span className="badge badge-blue">{formatRate(m.ctr)}</span></td>
                      <td className="num">{formatNum(m.unsubs)}</td>
                      <td><span className="badge badge-yellow">{formatRate(m.unsub_rate)}</span></td>
                      <td className="num">{formatNum(m.bounces)}</td>
                      <td><span className="badge badge-red">{formatRate(m.bounce_rate)}</span></td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(m)}
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
