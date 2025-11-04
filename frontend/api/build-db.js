const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const DB_PATH = path.join(__dirname, 'db.sqlite');

// Delete existing DB file to ensure a fresh build
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑️ Deleted existing database file.');
}

const db = new Database(DB_PATH, { verbose: console.log });

const sampleLeads = [
  {
    name: 'Skyler\'s Web Design',
    rating: 4.9,
    reviewCount: 150,
    address: '123 Main St, San Francisco, CA',
    googlePlaceId: 'ChIJ-S3b5Y-AhYARAd5A0y-VwA0',
    city: 'San Francisco',
    category: 'Web Designer',
    phone: '(123) 456-7890',
    website: 'https://skyler.com',
    businessStatus: 'OPERATIONAL',
    contributedBy: 'system'
  },
  {
    name: 'Eden\'s SEO Services',
    rating: 4.8,
    reviewCount: 120,
    address: '456 Market St, San Francisco, CA',
    googlePlaceId: 'ChIJ-S3b5Y-AhYARAd5A0y-VwA1',
    city: 'San Francisco',
    category: 'Marketing Agency',
    phone: '(234) 567-8901',
    website: 'https://eden.com',
    businessStatus: 'OPERATIONAL',
    contributedBy: 'system'
  }
];

function runSchema(db) {
  return new Promise((resolve, reject) => {
    db.transaction(() => {
      console.log('🚀 Creating database schema...');
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
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          contributedBy TEXT,
          notes TEXT,
          status TEXT DEFAULT 'uncalled',
          valueTier TEXT,
          valueScore INTEGER
        )
      `, (err) => { if (err) return reject(err); });

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
      `, (err) => { if (err) return reject(err); });

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
        if (err) return reject(err);
        console.log('✅ Schema created successfully.');
        resolve();
      });
    });
  });
}

function seedLeads(db) {
  return new Promise((resolve, reject) => {
    console.log('🌱 Seeding sample leads...');
    const stmt = db.prepare(`
      INSERT INTO leads (name, rating, reviewCount, address, googlePlaceId, city, category, phone, website, businessStatus, contributedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const lead of sampleLeads) {
      stmt.run(lead.name, lead.rating, lead.reviewCount, lead.address, lead.googlePlaceId, lead.city, lead.category, lead.phone, lead.website, lead.businessStatus, lead.contributedBy);
    }
    stmt.finalize((err) => {
      if (err) return reject(err);
      console.log(`✅ Seeded ${sampleLeads.length} sample leads.`);
      resolve();
    });
  });
}

function seedLocations(db) {
  return new Promise((resolve, reject) => {
    console.log('🌱 Seeding location data from uscities.csv...');
    const locations = [];
    fs.createReadStream(path.join(__dirname, 'uscities.csv'))
      .pipe(csv())
      .on('data', (data) => locations.push(data))
      .on('end', () => {
        const stmt = db.prepare('INSERT INTO locations (id, city, state_id, state_name, county_name, zips, population) VALUES (?, ?, ?, ?, ?, ?, ?)');
        db.run('BEGIN TRANSACTION');
        for (const loc of locations) {
          stmt.run(loc.id, loc.city, loc.state_id, loc.state_name, loc.county_name, loc.zips, parseInt(loc.population, 10) || 0);
        }
        db.run('COMMIT', (err) => {
            if(err) return reject(err);
            stmt.finalize((err) => {
                if (err) return reject(err);
                console.log(`✅ Successfully seeded ${locations.length} locations.`);
                resolve();
            });
        });
      })
      .on('error', (error) => reject(error));
  });
}

async function build() {
  try {
    await runSchema(db);
    await seedLeads(db);
    await seedLocations(db);
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing the database:', err.message);
        process.exit(1);
      }
      console.log('🎉 Database build complete.');
    });
  } catch (error) {
    console.error('❌ An error occurred during the build process:', error);
    process.exit(1);
  }
}

build();
