const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// The database is now built during the deployment process.
// This file just connects to the existing database.
const DB_PATH = path.join(__dirname, 'db.sqlite');
let db;

function initDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('❌ Failed to connect to SQLite DB:', err.message);
        return reject(err);
      }
      console.log('✅ SQLite DB connection established.');
      resolve(db);
    });
  });
}

module.exports = {
  initDb,
  get db() { return db; }
};
