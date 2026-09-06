const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { detectConflicts } = require('../services/conflictEngine');
const { findCoordinationOpportunities } = require('../services/coordinationEngine');

router.get('/stats', (req, res) => {
  try {
    const works = db.prepare(`
      SELECT w.*, a.name as agency_name FROM works w
      JOIN agencies a ON w.agency_id = a.id
    `).all();

    const history = db.prepare('SELECT * FROM road_history').all();
    const conflicts = detectConflicts(works.filter(w => w.status !== 'Rejected'));
    const opportunities = findCoordinationOpportunities(works.filter(w => w.status !== 'Rejected'), history);
    const coordinated = works.filter(w => w.status === 'Coordinated').length;
    const proposals = db.prepare('SELECT * FROM coordination_proposals').all();

    const roadDisruption = {};
    works.forEach(w => {
      if (!roadDisruption[w.road_name]) roadDisruption[w.road_name] = 0;
      roadDisruption[w.road_name]++;
    });
    const highDisruptionRoads = Object.entries(roadDisruption)
      .filter(([, count]) => count >= 3)
      .map(([road]) => road);

    const topOpportunities = opportunities.slice(0, 5).map(o => ({
      road_name: o.road_name,
      projects: o.works.map(w => w.work_type).join(' + '),
      score: o.coordination_score,
      status: o.works.some(w => w.status === 'Coordinated') ? 'Coordinated'
        : proposals.find(p => p.road_name === o.road_name && p.status === 'Awaiting Approval')
          ? 'Awaiting Approval' : 'Recommended',
      work_count: o.project_count
    }));

    const monthlyActivity = [
      { month: 'Jan', planned: 4, conflicts: 2, coordinated: 1 },
      { month: 'Feb', planned: 6, conflicts: 3, coordinated: 2 },
      { month: 'Mar', planned: 8, conflicts: 4, coordinated: 2 },
      { month: 'Apr', planned: 5, conflicts: 2, coordinated: 3 },
      { month: 'May', planned: 7, conflicts: 3, coordinated: 2 },
      { month: 'Jun', planned: 9, conflicts: 5, coordinated: 4 },
      { month: 'Jul', planned: 6, conflicts: 3, coordinated: 2 },
      { month: 'Aug', planned: works.length, conflicts: conflicts.length, coordinated }
    ];

    res.json({
      planned_works: works.length,
      conflicts_detected: conflicts.length,
      coordination_opportunities: opportunities.filter(o => o.coordination_score >= 40).length,
      coordinated_projects: coordinated,
      high_disruption_roads: highDisruptionRoads.length,
      recent_interventions: history.length,
      high_disruption_road_names: highDisruptionRoads,
      top_opportunities: topOpportunities,
      monthly_activity: monthlyActivity,
      is_simulated: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
