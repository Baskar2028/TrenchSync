import { useState, useEffect } from 'react';
import { api, WORK_TYPE_ICONS, formatDate } from '../api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function RoadMemory() {
  const [roads, setRoads] = useState([]);
  const [selectedRoad, setSelectedRoad] = useState('MG Road');
  const [roadData, setRoadData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRoads().then(setRoads).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedRoad) {
      api.getRoadHistory(selectedRoad).then(setRoadData).catch(console.error);
    }
  }, [selectedRoad]);

  const getMonth = (dateStr) => MONTHS[new Date(dateStr + 'T00:00:00').getMonth()];

  if (loading) return <div className="loading">Loading road memory...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Road Memory</h1>
        <p className="subtitle">Historical intervention records for rule-based decision support — not machine learning.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Select Road</div>
          <div className="form-group">
            <select value={selectedRoad} onChange={e => setSelectedRoad(e.target.value)}>
              {roads.map(r => (
                <option key={r.road_name} value={r.road_name}>{r.road_name} ({r.intervention_count} interventions)</option>
              ))}
              {!roads.find(r => r.road_name === 'MG Road') && (
                <option value="MG Road">MG Road</option>
              )}
            </select>
          </div>

          <div style={{ marginTop: 16 }}>
            {roads.slice(0, 8).map(r => (
              <div
                key={r.road_name}
                onClick={() => setSelectedRoad(r.road_name)}
                style={{
                  padding: '8px 12px', cursor: 'pointer', borderRadius: 6, marginBottom: 4,
                  background: selectedRoad === r.road_name ? 'rgba(139,32,64,0.15)' : 'transparent',
                  fontSize: '0.88rem'
                }}
              >
                {r.road_name} — {r.intervention_count} interventions
              </div>
            ))}
          </div>
        </div>

        {roadData && (
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>{roadData.road_name} — Road Memory</h3>

            {roadData.warning && (
              <div className="conflict-alert" style={{ marginBottom: 16 }}>
                ⚠️ {roadData.warning}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div className="card-title">Completed Interventions</div>
              {roadData.history.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No historical records.</p>
              ) : (
                roadData.history.map(h => (
                  <div key={h.id} style={{
                    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '0.88rem'
                  }}>
                    <strong>{getMonth(h.start_date)}</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      {WORK_TYPE_ICONS[h.work_type]} {h.work_type} — {h.agency}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{h.description}</div>
                  </div>
                ))
              )}
            </div>

            {roadData.planned_works?.length > 0 && (
              <div>
                <div className="card-title">Upcoming Planned Works</div>
                {roadData.planned_works.map(w => (
                  <div key={w.id} style={{
                    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '0.88rem'
                  }}>
                    <strong>{getMonth(w.start_date)}</strong> — New {w.work_type.toLowerCase()} proposal
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      {w.agency_name} · {formatDate(w.start_date)} – {formatDate(w.end_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Total interventions: {roadData.intervention_count}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
