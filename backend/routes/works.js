const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

function enrichWork(work) {
  const agency = db.prepare('SELECT * FROM agencies WHERE id = ?').get(work.agency_id);
  return { ...work, agency_name: agency?.name || 'Unknown', agency_type: agency?.type || '' };
}

router.get('/', (req, res) => {
  try {
    const { work_type, agency, priority, status, road } = req.query;
    let sql = `
      SELECT w.*, a.name as agency_name, a.type as agency_type
      FROM works w JOIN agencies a ON w.agency_id = a.id
      WHERE 1=1
    `;
    const params = [];
    if (work_type) { sql += ' AND w.work_type = ?'; params.push(work_type); }
    if (agency) { sql += ' AND a.name LIKE ?'; params.push(`%${agency}%`); }
    if (priority) { sql += ' AND w.priority = ?'; params.push(priority); }
    if (status) { sql += ' AND w.status = ?'; params.push(status); }
    if (road) { sql += ' AND w.road_name LIKE ?'; params.push(`%${road}%`); }
    sql += ' ORDER BY w.start_date ASC';
    const works = db.prepare(sql).all(...params);
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const work = db.prepare(`
      SELECT w.*, a.name as agency_name, a.type as agency_type
      FROM works w JOIN agencies a ON w.agency_id = a.id WHERE w.id = ?
    `).get(req.params.id);
    if (!work) return res.status(404).json({ error: 'Work not found' });
    res.json(work);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      agency_id, work_type, road_name, location, start_date, end_date,
      duration, priority, closure_type, description, lat, lng
    } = req.body;

    const errors = [];
    if (!agency_id) errors.push('Agency is required');
    if (!work_type) errors.push('Work type is required');
    if (!road_name?.trim()) errors.push('Road name is required');
    if (!location?.trim()) errors.push('Location is required');
    if (!start_date) errors.push('Start date is required');
    if (!end_date) errors.push('End date is required');
    if (!priority) errors.push('Priority is required');
    if (!closure_type) errors.push('Road closure type is required');

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      errors.push('End date cannot be before start date');
    }

    if (errors.length > 0) return res.status(400).json({ errors });

    const computedDuration = duration || (
      Math.round((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1
    );

    const result = db.prepare(`
      INSERT INTO works (agency_id, work_type, road_name, location, start_date, end_date,
        duration, priority, closure_type, description, lat, lng, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Planned')
    `).run(
      agency_id, work_type, road_name.trim(), location.trim(), start_date, end_date,
      computedDuration, priority, closure_type, description || '', lat || null, lng || null
    );

    const work = enrichWork(db.prepare('SELECT * FROM works WHERE id = ?').get(result.lastInsertRowid));
    res.status(201).json({ message: 'Planned work submitted successfully', work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    db.prepare('UPDATE works SET status = ? WHERE id = ?').run(status, req.params.id);
    const work = enrichWork(db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id));
    res.json(work);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
