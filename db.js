// db.js
// -----------------------------------------------------------------------------
// Lightweight SQLite database for Urban DNA.
//
//  - `users`      -> real accounts for the login page (bcrypt-hashed passwords)
//  - `city_cells` -> demo "urban data" cache. Whenever someone clicks anywhere
//                    on the 3D map, we look up (or deterministically generate
//                    and store) synthetic-but-consistent stats for that spot,
//                    so the same location always returns the same numbers and
//                    ANY location on earth returns *something* instead of only
//                    the few hardcoded Pune polygons the old build shipped with.
// -----------------------------------------------------------------------------
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'urban-dna.sqlite3');

import fs from 'fs';
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS city_cells (
  cell_key TEXT PRIMARY KEY,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  road_name TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ---- users -----------------------------------------------------------------
export const Users = {
  create({ name, email, passwordHash }) {
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    );
    const info = stmt.run(name, email.toLowerCase().trim(), passwordHash);
    return this.findById(info.lastInsertRowid);
  },
  findByEmail(email) {
    return db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(String(email).toLowerCase().trim());
  },
  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
};

// ---- demo city-data grid -----------------------------------------------------
// Snap lat/lng to a small grid so nearby clicks resolve to the same "road"
// (mirrors how a real roads/segments table would key by tile).
const GRID_STEP = 0.004; // ~400m
export function cellKeyFor(lat, lng) {
  const g = (v) => Math.round(v / GRID_STEP) * GRID_STEP;
  return `${g(lat).toFixed(4)},${g(lng).toFixed(4)}`;
}

export const CityCells = {
  get(key) {
    const row = db.prepare('SELECT * FROM city_cells WHERE cell_key = ?').get(key);
    if (!row) return null;
    return { ...row, data: JSON.parse(row.data) };
  },
  put({ key, lat, lng, roadName, data }) {
    db.prepare(
      `INSERT INTO city_cells (cell_key, lat, lng, road_name, data)
       VALUES (@key, @lat, @lng, @roadName, @data)
       ON CONFLICT(cell_key) DO UPDATE SET data = excluded.data`
    ).run({ key, lat, lng, roadName, data: JSON.stringify(data) });
    return this.get(key);
  },
};
