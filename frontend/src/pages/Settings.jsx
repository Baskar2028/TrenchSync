export default function Settings() {
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p className="subtitle">TrenchSync prototype configuration.</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-title">Application Info</div>
        <div style={{ fontSize: '0.88rem', lineHeight: 2 }}>
          <div><strong>Application:</strong> TrenchSync MVP</div>
          <div><strong>Version:</strong> 1.0.0 (Prototype)</div>
          <div><strong>Backend:</strong> Node.js + Express + SQLite</div>
          <div><strong>Frontend:</strong> React + Vite + Leaflet</div>
          <div><strong>GIS:</strong> OpenStreetMap</div>
          <div><strong>API:</strong> http://localhost:3001</div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="card-title">Coordination Engine</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            TrenchSync uses deterministic rule-based scoring — not AI or machine learning.
            Scoring weights: Spatial (30), Schedule (25), Road History (15), Duration (10), Traffic (10), Priority (10).
          </p>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="card-title">Demo Data</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            This prototype uses synthetic demo data for Salem, Tamil Nadu roads.
            Primary demo scenario: MG Road — Water + Telecom + Electricity coordination.
          </p>
        </div>
      </div>
    </div>
  );
}
