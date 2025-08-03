// Minimal SQLite3 database helper for LeadNavigatorAI
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'leads.db');

let db;

function initDb() {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite DB:', err.message);
      process.exit(1);
    }
    db.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rating REAL,
        reviewCount INTEGER,
        address TEXT,
        googlePlaceId TEXT UNIQUE,
        city TEXT,
        category TEXT,
        phone TEXT,
        website TEXT,
        businessStatus TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating leads table:', err);
      } else {
        console.log('SQLite DB initialized.');
      }
    });
  
    // Add new columns to existing table if they don't exist
    db.run(`ALTER TABLE leads ADD COLUMN phone TEXT`, () => {});
    db.run(`ALTER TABLE leads ADD COLUMN website TEXT`, () => {});
    db.run(`ALTER TABLE leads ADD COLUMN businessStatus TEXT`, () => {});
    return db;
  });
}

module.exports = {
  initDb,
  get db() { return db; }
};
