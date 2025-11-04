const Database = require('better-sqlite3');
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

    try {
      db = new Database(DB_PATH, { readonly: true });
      console.log('✅ SQLite DB connection established.');
      resolve(db);
    } catch (err) {
      console.error('❌ Failed to connect to SQLite DB:', err.message);
      reject(err);
    }
  });
}

module.exports = {
  initDb,
  get db() { return db; }
};
