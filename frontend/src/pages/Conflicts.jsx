import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, WORK_TYPE_ICONS, formatDate, getScoreClass } from '../api';

export default function Conflicts() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getConflicts()
      .then(setConflicts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (conflict) => {
    setAnalyzing(conflict.id);
    try {
      navigate('/coordination', { state: { road_name: conflict.road_name, work_ids: conflict.work_ids } });
    } finally {
      setAnalyzing(null);
    }
  };

  if (loading) return <div className="loading">Detecting conflicts...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Spatial & Temporal Conflicts</h1>
        <p className="subtitle">Works with spatial overlap and schedule overlap flagged for coordination analysis.</p>
      </div>

      {conflicts.length === 0 ? (
        <div className="empty-state">
          <h3>No conflicts detected</h3>
          <p>No spatial and temporal overlaps found among planned works.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {conflicts.map(conflict => (
            <div key={conflict.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{conflict.road_name}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{conflict.project_count} Projects</span>
                </div>
                <div>
                  <div className={`conflict-alert ${conflict.type === 'multi_project' ? 'multi' : ''}`}>
                    ⚠️ {conflict.label}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                {conflict.message}
              </p>

              <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                {conflict.works.map(work => (
                  <div key={work.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8
                  }}>
                    <div>
                      <span>{WORK_TYPE_ICONS[work.work_type]} {work.work_type}</span>
                      <span style={{ marginLeft: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {work.agency_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem' }}>
                      {formatDate(work.start_date)} – {formatDate(work.end_date)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Rule-Based Coordination Score: </span>
                  <span className={`score-badge ${getScoreClass(conflict.coordination_score)}`}>
                    {conflict.coordination_score}/100
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAnalyze(conflict)}
                  disabled={analyzing === conflict.id}
                >
                  {analyzing === conflict.id ? 'Analyzing...' : 'Analyze Coordination'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
