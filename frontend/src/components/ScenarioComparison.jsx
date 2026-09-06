export default function ScenarioComparison({ scenarios }) {
  if (!scenarios?.length) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-title">What-If Coordination</div>
      {scenarios.map(scenario => (
        <div
          key={scenario.id}
          className="card"
          style={{
            marginBottom: 12,
            border: scenario.recommended ? '1px solid var(--maroon)' : '1px solid var(--border)',
            background: scenario.recommended ? 'rgba(139, 32, 64, 0.08)' : 'rgba(255,255,255,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Scenario {scenario.id} — {scenario.name}</strong>
              {scenario.recommended && (
                <span style={{ marginLeft: 8, color: 'var(--maroon-light)', fontSize: '0.82rem' }}>
                  ★ RECOMMENDED SCENARIO
                </span>
              )}
            </div>
            <span className={`score-badge score-${scenario.score >= 85 ? 'very-high' : scenario.score >= 70 ? 'high' : scenario.score >= 40 ? 'moderate' : 'low'}`}>
              {scenario.score}/100
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            {scenario.description} — {scenario.disruption}
          </p>
          {scenario.window && (
            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
              Recommended Work Window: {scenario.window.start} – {scenario.window.end}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
