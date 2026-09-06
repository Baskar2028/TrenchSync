const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const {
  findCoordinationOpportunities,
  analyzeCoordination,
  generateScenarios
} = require('../services/coordinationEngine');

function getAllWorks() {
  return db.prepare(`
    SELECT w.*, a.name as agency_name, a.type as agency_type
    FROM works w JOIN agencies a ON w.agency_id = a.id
  `).all();
}

function getRoadHistory() {
  return db.prepare('SELECT * FROM road_history ORDER BY start_date DESC').all();
}

router.get('/opportunities', (req, res) => {
  try {
    const works = getAllWorks().filter(w => w.status !== 'Rejected');
    const history = getRoadHistory();
    const opportunities = findCoordinationOpportunities(works, history);
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze', (req, res) => {
  try {
    const { work_ids, road_name } = req.body;
    let works;
    if (work_ids && work_ids.length > 0) {
      works = work_ids.map(id => getAllWorks().find(w => w.id === id)).filter(Boolean);
    } else if (road_name) {
      const { detectConflicts } = require('../services/conflictEngine');
      const allWorks = getAllWorks().filter(w => w.status !== 'Rejected');
      const conflict = detectConflicts(allWorks).find(c =>
        c.road_name.toLowerCase() === road_name.toLowerCase()
      );
      works = conflict ? conflict.works : allWorks.filter(w =>
        w.road_name.toLowerCase() === road_name.toLowerCase()
      );
    } else {
      return res.status(400).json({ error: 'work_ids or road_name required' });
    }

    if (works.length < 2) {
      return res.status(400).json({ error: 'At least 2 works required for coordination analysis' });
    }

    const history = getRoadHistory();
    const analysis = analyzeCoordination(works, history);
    const scenarios = generateScenarios(works, history);

    res.json({ analysis, scenarios, works });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/proposals', (req, res) => {
  try {
    const proposals = db.prepare('SELECT * FROM coordination_proposals ORDER BY created_at DESC').all();
    const enriched = proposals.map(p => ({
      ...p,
      work_ids: JSON.parse(p.work_ids),
      score_breakdown: p.score_breakdown ? JSON.parse(p.score_breakdown) : null,
      scenarios: p.scenarios ? JSON.parse(p.scenarios) : null
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/proposals', (req, res) => {
  try {
    const { road_name, work_ids, proposed_start, proposed_end, score, reason, score_breakdown, scenarios } = req.body;

    if (!road_name || !work_ids?.length || !proposed_start || !proposed_end) {
      return res.status(400).json({ error: 'Missing required proposal fields' });
    }
    if (new Date(proposed_end) < new Date(proposed_start)) {
      return res.status(400).json({ error: 'Invalid proposed work window' });
    }

    const result = db.prepare(`
      INSERT INTO coordination_proposals
        (road_name, work_ids, proposed_start, proposed_end, score, status, reason, score_breakdown, scenarios)
      VALUES (?, ?, ?, ?, ?, 'Awaiting Approval', ?, ?, ?)
    `).run(
      road_name,
      JSON.stringify(work_ids),
      proposed_start,
      proposed_end,
      score || 0,
      reason || '',
      score_breakdown ? JSON.stringify(score_breakdown) : null,
      scenarios ? JSON.stringify(scenarios) : null
    );

    const proposal = db.prepare('SELECT * FROM coordination_proposals WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      ...proposal,
      work_ids: JSON.parse(proposal.work_ids),
      score_breakdown: proposal.score_breakdown ? JSON.parse(proposal.score_breakdown) : null,
      scenarios: proposal.scenarios ? JSON.parse(proposal.scenarios) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/proposals/:id', (req, res) => {
  try {
    const { status, proposed_start, proposed_end } = req.body;
    const proposal = db.prepare('SELECT * FROM coordination_proposals WHERE id = ?').get(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const newStatus = status || proposal.status;
    const newStart = proposed_start || proposal.proposed_start;
    const newEnd = proposed_end || proposal.proposed_end;

    if (new Date(newEnd) < new Date(newStart)) {
      return res.status(400).json({ error: 'Invalid proposed work window' });
    }

    db.prepare(`
      UPDATE coordination_proposals SET status = ?, proposed_start = ?, proposed_end = ? WHERE id = ?
    `).run(newStatus, newStart, newEnd, req.params.id);

    if (newStatus === 'Coordinated' || newStatus === 'Modified') {
      const workIds = JSON.parse(proposal.work_ids);
      const updateStatus = newStatus === 'Coordinated' ? 'Coordinated' : 'Modified';
      const stmt = db.prepare('UPDATE works SET status = ?, start_date = ?, end_date = ? WHERE id = ?');
      for (const wid of workIds) {
        stmt.run(updateStatus, newStart, newEnd, wid);
      }
    } else if (newStatus === 'Rejected') {
      const workIds = JSON.parse(proposal.work_ids);
      const stmt = db.prepare('UPDATE works SET status = ? WHERE id = ?');
      for (const wid of workIds) {
        stmt.run('Rejected', wid);
      }
    }

    const updated = db.prepare('SELECT * FROM coordination_proposals WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      work_ids: JSON.parse(updated.work_ids),
      score_breakdown: updated.score_breakdown ? JSON.parse(updated.score_breakdown) : null,
      scenarios: updated.scenarios ? JSON.parse(updated.scenarios) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
