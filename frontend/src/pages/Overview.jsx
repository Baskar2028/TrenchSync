import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getScoreClass, formatDate } from '../api';

function ActivityChart({ data }) {
  const maxVal = Math.max(...data.flatMap(d => [d.planned, d.conflicts, d.coordinated]), 1);
  return (
    <div className="card">
      <div className="card-title">Coordination Activity</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, padding: '10px 0' }}>
        {data.map(d => (
          <div key={d.month} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'flex-end', height: 120 }}>
              <div style={{ width: 8, height: `${(d.planned / maxVal) * 100}%`, background: 'var(--info)', borderRadius: 2, minHeight: 2 }} title="Planned" />
              <div style={{ width: 8, height: `${(d.conflicts / maxVal) * 100}%`, background: 'var(--warning)', borderRadius: 2, minHeight: 2 }} title="Conflicts" />
              <div style={{ width: 8, height: `${(d.coordinated / maxVal) * 100}%`, background: 'var(--success)', borderRadius: 2, minHeight: 2 }} title="Coordinated" />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.month}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        <span><span style={{ color: 'var(--info)' }}>■</span> Planned Works</span>
        <span><span style={{ color: 'var(--warning)' }}>■</span> Conflicts</span>
        <span><span style={{ color: 'var(--success)' }}>■</span> Coordinated</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!stats) return <div className="empty-state">Unable to load dashboard data.</div>;

  return (
    <div>
      <div className="demo-banner">⚠️ SIMULATED PROTOTYPE DATA — Demo dataset for prototype demonstration</div>

      <div className="page-header">
        <h1>Infrastructure Coordination Overview</h1>
        <p className="subtitle">Identify conflicts. Coordinate planned works. Reduce repeated excavation.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-value">{stats.planned_works}</div><div className="kpi-label">Planned Works</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.conflicts_detected}</div><div className="kpi-label">Active Conflicts</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.coordination_opportunities}</div><div className="kpi-label">Coordination Opportunities</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.coordinated_projects}</div><div className="kpi-label">Coordinated Works</div></div>
      </div>

      <div className="grid-2">
        <ActivityChart data={stats.monthly_activity} />

        <div className="card">
          <div className="card-title">TrenchSync Decision Flow</div>
          <div style={{ fontSize: '0.88rem', lineHeight: 2, color: 'var(--text-secondary)' }}>
            <div><strong style={{ color: 'var(--text-muted)' }}>Existing:</strong> Work → Permit → Execute</div>
            <div style={{ margin: '8px 0', color: 'var(--maroon-light)' }}>↓</div>
            <div><strong style={{ color: 'var(--maroon-light)' }}>TrenchSync:</strong></div>
            <div>Work → GIS Mapping → Spatial + Temporal Detection</div>
            <div>→ Coordination Opportunity → Constraint Check</div>
            <div>→ Scenario Comparison → Best Work Window</div>
            <div>→ Human Approval → Execution</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">High Priority Coordination Opportunities</div>
        {stats.top_opportunities?.length === 0 ? (
          <p className="empty-state">No coordination opportunities detected.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {stats.top_opportunities.map((opp, i) => (
              <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                <div>
                  <strong>{opp.road_name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {opp.projects} · {opp.work_count} projects
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`score-badge ${getScoreClass(opp.score)}`}>Score: {opp.score}</span>
                  <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                    <span className={`status-badge status-${opp.status === 'Coordinated' ? 'coordinated' : opp.status === 'Awaiting Approval' ? 'awaiting' : 'planned'}`}>
                      {opp.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <Link to="/map" className="btn btn-primary">View GIS Map</Link>
          <Link to="/coordination" className="btn btn-secondary">View Coordination</Link>
        </div>
      </div>
    </div>
  );
}
