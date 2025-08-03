const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function initDb() {
  try {
    const db = await open({
      filename: './leads.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rating REAL,
        reviewCount INTEGER,
        phone TEXT,
        address TEXT,
        city TEXT NOT NULL,
        category TEXT NOT NULL,
        googlePlaceId TEXT UNIQUE
      );
    `);

    console.log('Database initialized successfully.');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

module.exports = { initDb };
