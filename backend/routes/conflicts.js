const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { detectConflicts } = require('../services/conflictEngine');
const { findCoordinationOpportunities } = require('../services/coordinationEngine');

function getAllWorks() {
  return db.prepare(`
    SELECT w.*, a.name as agency_name, a.type as agency_type
    FROM works w JOIN agencies a ON w.agency_id = a.id
    ORDER BY w.start_date ASC
  `).all();
}

function getRoadHistory() {
  return db.prepare('SELECT * FROM road_history ORDER BY start_date DESC').all();
}

router.get('/', (req, res) => {
  try {
    const works = getAllWorks();
    const history = getRoadHistory();
    const conflicts = detectConflicts(works);
    res.json(conflicts.map(c => ({
      ...c,
      coordination_score: findCoordinationOpportunities(c.works, history)[0]?.coordination_score || 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
