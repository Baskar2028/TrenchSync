import { useState, useEffect } from 'react';
import { api, getScoreClass } from '../api';

export default function Impact() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading impact dashboard...</div>;
  if (!stats) return <div className="empty-state">Unable to load impact data.</div>;

  return (
    <div>
      <div className="demo-banner">⚠️ SIMULATED PROTOTYPE DATA — These are not real-world measured results</div>

      <div className="page-header">
        <h1>Impact Dashboard</h1>
        <p className="subtitle">Coordination metrics and disruption indicators from the demo dataset.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-value">{stats.planned_works}</div><div className="kpi-label">Planned Works</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.conflicts_detected}</div><div className="kpi-label">Conflicts Detected</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.coordination_opportunities}</div><div className="kpi-label">Coordination Opportunities</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.coordinated_projects}</div><div className="kpi-label">Coordinated Projects</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.high_disruption_roads}</div><div className="kpi-label">High-Disruption Roads</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats.recent_interventions}</div><div className="kpi-label">Recent Road Interventions</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">High-Disruption Roads</div>
          {stats.high_disruption_road_names?.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No high-disruption roads identified.</p>
          ) : (
            stats.high_disruption_road_names.map(road => (
              <div key={road} style={{
                padding: '10px 14px', marginBottom: 8, background: 'rgba(244,67,54,0.08)',
                borderRadius: 8, fontSize: '0.88rem', border: '1px solid rgba(244,67,54,0.2)'
              }}>
                🔴 {road} — Multiple concurrent planned works
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">Top Coordination Opportunities</div>
          {stats.top_opportunities?.map((opp, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.88rem'
            }}>
              <div>
                <strong>{opp.road_name}</strong>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{opp.projects}</div>
              </div>
              <span className={`score-badge ${getScoreClass(opp.score)}`}>{opp.score}/100</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">TrenchSync Impact Summary</div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <p>TrenchSync identifies <strong style={{ color: 'var(--text-primary)' }}>{stats.conflicts_detected} spatial-temporal conflicts</strong> across the demo dataset, converting {stats.coordination_opportunities} into coordination opportunities through rule-based analysis.</p>
          <p style={{ marginTop: 8 }}>By coordinating planned works before excavation, agencies can potentially reduce repeated road openings and lower disruption on high-traffic corridors like MG Road and Anna Salai.</p>
          <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            All metrics above are from synthetic demo data for prototype demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
