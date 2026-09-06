const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

router.get('/:roadName/history', (req, res) => {
  try {
    const roadName = decodeURIComponent(req.params.roadName);
    const history = db.prepare(`
      SELECT * FROM road_history WHERE road_name LIKE ? ORDER BY start_date DESC
    `).all(`%${roadName}%`);

    const plannedWorks = db.prepare(`
      SELECT w.*, a.name as agency_name FROM works w
      JOIN agencies a ON w.agency_id = a.id
      WHERE w.road_name LIKE ? AND w.status IN ('Planned', 'Awaiting Approval')
      ORDER BY w.start_date ASC
    `).all(`%${roadName}%`);

    res.json({
      road_name: roadName,
      history,
      planned_works: plannedWorks,
      intervention_count: history.length + plannedWorks.length,
      warning: history.length >= 2
        ? 'This road has recent intervention history. Consider coordination before approving another excavation.'
        : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const roads = db.prepare(`
      SELECT road_name, COUNT(*) as intervention_count
      FROM road_history GROUP BY road_name ORDER BY intervention_count DESC
    `).all();
    res.json(roads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
