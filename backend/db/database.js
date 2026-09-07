const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'trenchsync.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id INTEGER NOT NULL,
      work_type TEXT NOT NULL,
      road_name TEXT NOT NULL,
      location TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      priority TEXT NOT NULL,
      closure_type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Planned',
      lat REAL,
      lng REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS coordination_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_group_id TEXT NOT NULL,
      work_ids TEXT NOT NULL,
      road_name TEXT NOT NULL,
      spatial_score REAL NOT NULL,
      schedule_score REAL NOT NULL,
      history_score REAL NOT NULL,
      duration_score REAL NOT NULL,
      traffic_score REAL NOT NULL,
      priority_score REAL NOT NULL,
      total_score REAL NOT NULL,
      recommendation TEXT NOT NULL,
      reasons TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coordination_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      road_name TEXT NOT NULL,
      work_ids TEXT NOT NULL,
      proposed_start TEXT NOT NULL,
      proposed_end TEXT NOT NULL,
      score REAL NOT NULL,
      status TEXT DEFAULT 'Awaiting Approval',
      reason TEXT,
      score_breakdown TEXT,
      scenarios TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS road_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      road_name TEXT NOT NULL,
      work_type TEXT NOT NULL,
      agency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'Completed',
      description TEXT
    );
  `);
}

module.exports = { db, initDatabase };
