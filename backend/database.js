const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { seedDatabase } = require('./seed');

const DB_PATH = path.join(__dirname, 'db.sqlite');
let db;

function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to connect to SQLite DB:', err.message);
        return reject(err);
      }
      console.log('✅ SQLite DB connection established.');
    });

    db.serialize(() => {
      let completed = 0;
      const total = 8; // Total number of table operations

      const checkDone = () => {
        completed++;
        if (completed === total) {
          console.log('✅ SQLite DB tables are ready.');
          // Seed the database if it's empty
          seedDatabase(db)
            .then(() => seedLocations(db)) // Seed locations after other tables are ready
            .then(() => resolve(db))
            .catch(reject);
        }
      };

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
        if (err) console.error('Error creating leads table:', err);
        checkDone();
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          subscription_tier TEXT DEFAULT 'free',
          api_key TEXT,
          api_usage INTEGER DEFAULT 0,
          monthly_limit INTEGER DEFAULT 750,
          two_factor_secret TEXT,
          two_factor_enabled INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err);
        checkDone();
      });

      db.run(`ALTER TABLE leads ADD COLUMN contributedBy TEXT`, () => { checkDone(); });
      db.run(`ALTER TABLE leads ADD COLUMN notes TEXT`, () => { checkDone(); });
      db.run(`ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'uncalled'`, () => { checkDone(); });
      db.run(`ALTER TABLE leads ADD COLUMN valueTier TEXT`, () => { checkDone(); });
      db.run(`ALTER TABLE leads ADD COLUMN valueScore INTEGER`, () => { checkDone(); });

      db.run(`
        CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY,
          city TEXT,
          state_id TEXT,
          state_name TEXT,
          county_name TEXT,
          zips TEXT,
          population INTEGER
        )
      `, (err) => {
        if (err) console.error('Error creating locations table:', err);
        checkDone();
      });
    });
  });
}

function seedLocations(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM locations', (err, row) => {
      if (err) return reject(err);
      if (row.count > 0) {
        console.log('✅ Location data already seeded.');
        return resolve();
      }

      console.log('🌱 Seeding location data from uscities.csv...');
      const locationsToInsert = [];
      fs.createReadStream(path.join(__dirname, 'uscities.csv'))
        .pipe(csv())
        .on('data', (data) => locationsToInsert.push(data))
        .on('end', () => {
          db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            const stmt = db.prepare('INSERT INTO locations (id, city, state_id, state_name, county_name, zips, population) VALUES (?, ?, ?, ?, ?, ?, ?)');
            for (const loc of locationsToInsert) {
              stmt.run(loc.id, loc.city, loc.state_id, loc.state_name, loc.county_name, loc.zips, parseInt(loc.population, 10) || 0);
            }
            stmt.finalize((err) => {
              if (err) return reject(err);
              db.run('COMMIT', (err) => {
                if (err) return reject(err);
                console.log(`✅ Successfully seeded ${locationsToInsert.length} locations.`);
                resolve();
              });
            });
          });
        })
        .on('error', (error) => reject(error));
    });
  });
}

module.exports = {
  initDb,
  get db() { return db; }
};
