const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { searchPlaces } = require('./placesService');
require('dotenv').config();

// Fail-fast environment variable validation
if (!process.env.GOOGLE_PLACES_API_KEY) {
  console.error('❌ Missing GOOGLE_PLACES_API_KEY');
  console.error('Please check your .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

// Persistent SQLite database setup - saves all leads permanently
const db = new sqlite3.Database('./dialed-in-leads.db', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to persistent SQLite database: dialed-in-leads.db');
});
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS leads (
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
    valueScore INTEGER,
    valueTier TEXT,
    contributedBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API Routes
app.post('/api/search', async (req, res) => {
  try {
    const { city, category, maxLeads = 25, userApiKey } = req.body;
    if (!city || !category) {
      return res.status(400).json({ error: 'City and category are required.' });
    }
    
    // Get contributor name from token to determine API key requirements
    const authHeader = req.headers.authorization;
    const userToken = authHeader ? authHeader.replace('Bearer ', '') : 'anonymous';
    const contributorName = userToken === 'dialed-in-partner-access-2024' ? 'Skyler' : 
                           userToken === 'dialed-in-business-partner-2024' ? 'Eden' : 'Unknown';
    
    // Determine which API key to use based on user
    let apiKeyToUse;
    if (contributorName === 'Skyler') {
      // Skyler can use either his personal API key or the system fallback
      apiKeyToUse = userApiKey || process.env.GOOGLE_PLACES_API_KEY;
    } else {
      // All other users (including Eden) MUST provide their own API key
      apiKeyToUse = userApiKey;
    }
    
    if (!apiKeyToUse) {
      if (contributorName === 'Skyler') {
        return res.status(400).json({ error: 'No API key available. Please configure your Google Places API key in settings.' });
      } else {
        return res.status(400).json({ error: `${contributorName} must configure their own Google Places API key in settings to generate leads. Contact Skyler for API key setup instructions.` });
      }
    }
    
    console.log(`🔍 Searching for ${category} in ${city} (max ${maxLeads} leads)...`);
    const places = await searchPlaces(city, category, apiKeyToUse, maxLeads);
    console.log(` Found ${places.length} real leads`);
    
    // Store in database with contributor tracking
    const stmt = db.prepare(`INSERT OR IGNORE INTO leads (name, rating, reviewCount, address, googlePlaceId, city, category, phone, website, valueScore, valueTier, contributedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    // Contributor name already determined above
    
    // Track actual new leads added (not duplicates)
    let newLeadsAdded = 0;
    for (const place of places) {
      const result = stmt.run(place.name, place.rating, place.reviewCount, place.address, place.googlePlaceId, city, category, place.phone || null, place.website || null, place.valueScore, place.valueTier, contributorName);
      if (result.changes > 0) {
        newLeadsAdded++;
      }
    }
    stmt.finalize();
    
    console.log(`🎉 Actually added ${newLeadsAdded} new leads (${places.length - newLeadsAdded} were duplicates)`);
    res.json({ message: `${newLeadsAdded} new leads found`, data: places, totalFound: places.length, newLeads: newLeadsAdded });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all shared leads (collaborative access)
app.get('/api/leads', (req, res) => {
  // Return all leads for collaborative access between Skyler and Eden
  db.all('SELECT * FROM leads ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log(`📊 API returning ${rows.length} leads to frontend`);
    res.json(rows);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('✅ Database initialized');
});

module.exports = app;
