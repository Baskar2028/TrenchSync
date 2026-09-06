import { getScoreClass, getScoreLabel } from '../api';

export default function ScoreBreakdown({ breakdown, totalScore }) {
  if (!breakdown) return null;

  const items = [
    breakdown.spatial,
    breakdown.schedule,
    breakdown.history,
    breakdown.duration,
    breakdown.traffic,
    breakdown.priority
  ];

  return (
    <div className="score-breakdown">
      <h4 style={{ marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Rule-Based Coordination Score Breakdown
      </h4>
      {items.map(item => (
        <div key={item.label} className="score-row">
          <span>{item.label}</span>
          <div className="score-bar">
            <div
              className="score-bar-fill"
              style={{ width: `${(item.score / item.max) * 100}%` }}
            />
          </div>
          <span>{item.score}/{item.max}</span>
        </div>
      ))}
      <div className="score-row total">
        <span>TOTAL</span>
        <span className={`score-badge ${getScoreClass(totalScore)}`}>
          {totalScore}/100 — {getScoreLabel(totalScore)}
        </span>
      </div>
    </div>
  );
}
