const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/database');

initDatabase();

// Auto-seed if empty
const { db } = require('./db/database');
const workCount = db.prepare('SELECT COUNT(*) as c FROM works').get().c;
if (workCount === 0) {
  require('./db/seed');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/works', require('./routes/works'));
app.use('/api/conflicts', require('./routes/conflicts'));
app.use('/api/coordination', require('./routes/coordination'));
app.use('/api/roads', require('./routes/roads'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/agencies', (req, res) => {
  try {
    const agencies = db.prepare('SELECT * FROM agencies ORDER BY name').all();
    res.json(agencies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TrenchSync API' });
});

app.listen(PORT, () => {
  console.log(`TrenchSync API running on http://localhost:${PORT}`);
});
