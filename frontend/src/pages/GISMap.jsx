import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useState, useEffect, useMemo } from 'react';
import { api, WORK_TYPE_COLORS, WORK_TYPE_ICONS, formatDate, getScoreClass } from '../api';
import 'leaflet/dist/leaflet.css';
import './GISMap.css';

const SALEM_CENTER = [11.6643, 78.1460];

function FitBounds({ works }) {
  const map = useMap();
  useEffect(() => {
    if (works.length > 0) {
      const lats = works.filter(w => w.lat).map(w => w.lat);
      const lngs = works.filter(w => w.lng).map(w => w.lng);
      if (lats.length) {
        map.fitBounds([
          [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
          [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
        ]);
      }
    }
  }, [works, map]);
  return null;
}

export default function GISMap() {
  const [works, setWorks] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    work_type: '', agency: '', priority: '', status: '', risk: ''
  });

  useEffect(() => {
    Promise.all([api.getWorks(), api.getOpportunities()])
      .then(([w, o]) => { setWorks(w); setOpportunities(o); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const conflictRoads = useMemo(() => {
    const set = new Set();
    opportunities.forEach(o => set.add(o.road_name.toLowerCase()));
    return set;
  }, [opportunities]);

  const filtered = useMemo(() => {
    return works.filter(w => {
      if (filters.work_type && w.work_type !== filters.work_type) return false;
      if (filters.agency && !w.agency_name.includes(filters.agency)) return false;
      if (filters.priority && w.priority !== filters.priority) return false;
      if (filters.status && w.status !== filters.status) return false;
      if (filters.risk === 'conflict' && !conflictRoads.has(w.road_name.toLowerCase())) return false;
      if (filters.risk === 'opportunity') {
        const opp = opportunities.find(o => o.road_name === w.road_name);
        if (!opp || opp.coordination_score < 40) return false;
      }
      return true;
    });
  }, [works, filters, conflictRoads, opportunities]);

  const getWorkScore = (work) => {
    const opp = opportunities.find(o => o.road_name === work.road_name);
    return opp?.coordination_score;
  };

  const roadGroups = useMemo(() => {
    const groups = {};
    filtered.forEach(w => {
      if (!w.lat || !w.lng) return;
      const key = w.road_name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    });
    return groups;
  }, [filtered]);

  if (loading) return <div className="loading">Loading GIS map...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>GIS Shared Work Map</h1>
        <p className="subtitle">Visualize planned works, spatial conflicts, and coordination opportunities.</p>
      </div>

      <div className="map-layout">
        <div className="map-filters card">
          <div className="card-title">Filters</div>
          <div className="form-group">
            <label>Work Type</label>
            <select value={filters.work_type} onChange={e => setFilters(f => ({ ...f, work_type: e.target.value }))}>
              <option value="">All</option>
              {Object.keys(WORK_TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
              <option value="">All</option>
              {['Emergency', 'High', 'Normal', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All</option>
              {['Planned', 'Coordinated', 'Modified', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Risk / Coordination</label>
            <select value={filters.risk} onChange={e => setFilters(f => ({ ...f, risk: e.target.value }))}>
              <option value="">All</option>
              <option value="conflict">Conflict</option>
              <option value="opportunity">Opportunity</option>
            </select>
          </div>

          <div className="map-legend">
            <div className="card-title">Legend</div>
            {Object.entries(WORK_TYPE_ICONS).map(([type, icon]) => (
              <div key={type} className="legend-item">
                <span style={{ color: WORK_TYPE_COLORS[type] }}>{icon}</span> {type}
              </div>
            ))}
            <div className="legend-item">🟢 Coordinated</div>
            <div className="legend-item">🟠 Opportunity</div>
            <div className="legend-item">🔴 Conflict</div>
          </div>
        </div>

        <div className="map-container card">
          <MapContainer center={SALEM_CENTER} zoom={14} style={{ height: '100%', width: '100%', borderRadius: 8 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds works={filtered} />

            {Object.entries(roadGroups).map(([road, roadWorks]) => {
              const coords = roadWorks.map(w => [w.lat, w.lng]);
              const isConflict = conflictRoads.has(road.toLowerCase());
              return (
                <Polyline
                  key={`line-${road}`}
                  positions={coords}
                  pathOptions={{
                    color: isConflict ? '#f44336' : '#555',
                    weight: isConflict ? 4 : 2,
                    opacity: 0.7,
                    dashArray: isConflict ? '8 4' : null
                  }}
                />
              );
            })}

            {filtered.filter(w => w.lat && w.lng).map(work => {
              const color = WORK_TYPE_COLORS[work.work_type] || '#888';
              const icon = WORK_TYPE_ICONS[work.work_type] || '📍';
              const score = getWorkScore(work);
              const isConflict = conflictRoads.has(work.road_name.toLowerCase());

              return (
                <CircleMarker
                  key={work.id}
                  center={[work.lat, work.lng]}
                  radius={isConflict ? 10 : 8}
                  pathOptions={{
                    color: work.status === 'Coordinated' ? '#4caf50' : isConflict ? '#f44336' : color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: 2
                  }}
                  eventHandlers={{ click: () => setSelected(work) }}
                >
                  <Tooltip permanent direction="right" offset={[10, 0]} className="work-label">
                    {icon} {work.work_type.toUpperCase()} — {work.road_name}
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div className="map-info card">
          <div className="card-title">{selected ? 'Selected Work' : 'Map Information'}</div>
          {selected ? (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>
                {WORK_TYPE_ICONS[selected.work_type]} {selected.work_type} — {selected.road_name}
              </h3>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
                <div><strong>Agency:</strong> {selected.agency_name}</div>
                <div><strong>Road:</strong> {selected.road_name}</div>
                <div><strong>Location:</strong> {selected.location}</div>
                <div><strong>Start:</strong> {formatDate(selected.start_date)}</div>
                <div><strong>End:</strong> {formatDate(selected.end_date)}</div>
                <div><strong>Priority:</strong> {selected.priority}</div>
                <div><strong>Status:</strong> <span className={`status-badge status-${selected.status.toLowerCase()}`}>{selected.status}</span></div>
                {getWorkScore(selected) != null && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Rule-Based Coordination Score:</strong>{' '}
                    <span className={`score-badge ${getScoreClass(getWorkScore(selected))}`}>
                      {getWorkScore(selected)}/100
                    </span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 12 }}>{selected.description}</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Click a work marker on the map to view details. Works with spatial and temporal overlap are highlighted as conflicts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
