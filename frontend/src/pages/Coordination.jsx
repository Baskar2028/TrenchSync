import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api, WORK_TYPE_ICONS, formatDate, getScoreClass, getScoreLabel } from '../api';
import ScoreBreakdown from '../components/ScoreBreakdown';
import ScenarioComparison from '../components/ScenarioComparison';

export default function Coordination() {
  const location = useLocation();
  const [opportunities, setOpportunities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [modifyDates, setModifyDates] = useState({ start: '', end: '' });
  const [showModify, setShowModify] = useState(null);

  const loadData = async () => {
    const [opps, props] = await Promise.all([
      api.getOpportunities(),
      api.getProposals()
    ]);
    setOpportunities(opps);
    setProposals(props);

    if (location.state?.road_name) {
      const opp = opps.find(o => o.road_name === location.state.road_name);
      if (opp) selectOpportunity(opp);
    }
  };

  useEffect(() => {
    loadData().catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectOpportunity = async (opp) => {
    setSelected(opp);
    setAnalysis(opp.analysis);
    setShowModify(null);
  };

  const handleCreateProposal = async (opp) => {
    try {
      const rec = opp.recommended_scenario || opp.scenarios[0];
      const proposal = await api.createProposal({
        road_name: opp.road_name,
        work_ids: opp.work_ids,
        proposed_start: rec?.window?.start || opp.analysis.recommended_window.start,
        proposed_end: rec?.window?.end || opp.analysis.recommended_window.end,
        score: opp.coordination_score,
        reason: opp.analysis.potential_action,
        score_breakdown: opp.analysis.breakdown,
        scenarios: opp.scenarios
      });
      setProposals(prev => [proposal, ...prev]);
      setNotification({ type: 'success', message: 'Coordination Proposal created — awaiting Human Approval.' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleProposalAction = async (proposalId, status, dates) => {
    try {
      const payload = { status };
      if (dates) {
        payload.proposed_start = dates.start;
        payload.proposed_end = dates.end;
      }
      await api.updateProposal(proposalId, payload);
      await loadData();
      setShowModify(null);
      setNotification({ type: 'success', message: `Proposal ${status.toLowerCase()} successfully.` });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  if (loading) return <div className="loading">Loading coordination data...</div>;

  return (
    <div>
      {notification && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <div className="page-header">
        <h1>Coordination Opportunities</h1>
        <p className="subtitle">Rule-based coordination analysis, scenario comparison, and proposal management.</p>
      </div>

      <div className="grid-2">
        <div>
          <div className="card-title" style={{ marginBottom: 12 }}>Detected Opportunities</div>
          {opportunities.length === 0 ? (
            <div className="empty-state">No coordination opportunities found.</div>
          ) : (
            opportunities.map(opp => (
              <div
                key={opp.id}
                className="card"
                style={{
                  marginBottom: 12,
                  cursor: 'pointer',
                  border: selected?.id === opp.id ? '1px solid var(--maroon)' : undefined
                }}
                onClick={() => selectOpportunity(opp)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{opp.road_name}</strong>
                  <span className={`score-badge ${getScoreClass(opp.coordination_score)}`}>
                    {opp.coordination_score}/100
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '6px 0' }}>
                  {opp.works.map(w => w.work_type).join(' + ')}
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  Recommended Work Window: {opp.analysis?.recommended_window_label}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); selectOpportunity(opp); }}>
                    View Scenario
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleCreateProposal(opp); }}>
                    Create Proposal
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          {selected ? (
            <div className="card">
              <div className={`conflict-alert ${selected.type === 'multi_project' ? 'multi' : ''}`}>
                {selected.coordination_score >= 70 ? '🟢' : selected.coordination_score >= 40 ? '🟡' : '🔴'}{' '}
                {getScoreLabel(selected.coordination_score).toUpperCase()}
              </div>

              <h3 style={{ marginBottom: 8 }}>Score: {selected.coordination_score}/100</h3>

              <div style={{ fontSize: '0.88rem', marginBottom: 12 }}>
                <strong>Road:</strong> {selected.road_name}<br />
                <strong>Recommended Work Window:</strong> {selected.analysis?.recommended_window_label}
              </div>

              {selected.analysis?.hard_violations?.length > 0 && (
                <div style={{ marginBottom: 12, padding: 10, background: 'rgba(244,67,54,0.1)', borderRadius: 8, fontSize: '0.85rem' }}>
                  <strong>Hard Constraints:</strong>
                  {selected.analysis.hard_violations.map((v, i) => (
                    <div key={i}>⛔ {v.constraint}{v.work_id ? ` (Work #${v.work_id})` : ''}</div>
                  ))}
                </div>
              )}

              <div>
                <strong style={{ fontSize: '0.85rem' }}>Reasons:</strong>
                <ul className="reasons-list">
                  {selected.analysis?.reasons?.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>

              <p style={{ fontSize: '0.88rem', fontStyle: 'italic', margin: '12px 0', color: 'var(--maroon-light)' }}>
                Potential action: {selected.analysis?.potential_action}
              </p>

              <ScoreBreakdown breakdown={selected.analysis?.breakdown} totalScore={selected.coordination_score} />
              <ScenarioComparison scenarios={selected.scenarios} />
            </div>
          ) : (
            <div className="card empty-state">
              <h3>Select an opportunity</h3>
              <p>Choose a coordination opportunity to view analysis, scenarios, and score breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {proposals.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Coordination Proposals — Human Approval Required</div>
          {proposals.map(proposal => (
            <div key={proposal.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3>Coordination Opportunity — {proposal.road_name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Recommended Work Window: {formatDate(proposal.proposed_start)} – {formatDate(proposal.proposed_end)}
                  </div>
                </div>
                <span className={`score-badge ${getScoreClass(proposal.score)}`}>{proposal.score}/100</span>
              </div>

              <div style={{ margin: '12px 0', fontSize: '0.88rem' }}>
                <span className={`status-badge status-${proposal.status === 'Coordinated' ? 'coordinated' : proposal.status === 'Rejected' ? 'rejected' : proposal.status === 'Modified' ? 'modified' : 'awaiting'}`}>
                  {proposal.status}
                </span>
              </div>

              {proposal.reason && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{proposal.reason}</p>
              )}

              {proposal.status === 'Awaiting Approval' && (
                <div style={{ marginTop: 16 }}>
                  {showModify === proposal.id ? (
                    <div style={{ marginBottom: 12 }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Proposed Start</label>
                          <input type="date" value={modifyDates.start || proposal.proposed_start}
                            onChange={e => setModifyDates(d => ({ ...d, start: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Proposed End</label>
                          <input type="date" value={modifyDates.end || proposal.proposed_end}
                            onChange={e => setModifyDates(d => ({ ...d, end: e.target.value }))} />
                        </div>
                      </div>
                      <button className="btn btn-warning btn-sm" onClick={() => handleProposalAction(proposal.id, 'Modified', modifyDates)}>
                        Save Modified Dates
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-success" onClick={() => handleProposalAction(proposal.id, 'Coordinated')}>
                        ACCEPT
                      </button>
                      <button className="btn btn-warning" onClick={() => {
                        setShowModify(proposal.id);
                        setModifyDates({ start: proposal.proposed_start, end: proposal.proposed_end });
                      }}>
                        MODIFY
                      </button>
                      <button className="btn btn-danger" onClick={() => handleProposalAction(proposal.id, 'Rejected')}>
                        REJECT
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
