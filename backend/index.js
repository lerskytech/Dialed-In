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
    const { city, category, cities, categories, maxLeads = 25, userApiKey } = req.body;
    
    // Support both single and multi-selection modes
    const citiesToSearch = cities && cities.length > 0 ? cities : (city ? [city] : []);
    const categoriesToSearch = categories && categories.length > 0 ? categories : (category ? [category] : []);
    
    if (citiesToSearch.length === 0 || categoriesToSearch.length === 0) {
      return res.status(400).json({ error: 'At least one city and one category are required.' });
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
        return res.status(400).json({ error: 'Upgrade API Key in settings to unlock this feature' });
      }
    }
    
    // Calculate even distribution across all city/category combinations
    const totalCombinations = citiesToSearch.length * categoriesToSearch.length;
    const baseLeadsPerCombo = Math.floor(maxLeads / totalCombinations);
    const remainder = maxLeads % totalCombinations;
    
    console.log(`🔍 Multi-search: ${citiesToSearch.length} cities × ${categoriesToSearch.length} categories = ${totalCombinations} combinations`);
    console.log(`📊 Distribution: ${baseLeadsPerCombo} leads per combo (${remainder} extra distributed to first combos)`);
    
    let allPlaces = [];
    let comboIndex = 0;
    const searchResults = [];
    
    // Search each city/category combination
    for (const cityToSearch of citiesToSearch) {
      for (const categoryToSearch of categoriesToSearch) {
        // Add extra leads to first few combinations if there's remainder
        const leadsForThisCombo = baseLeadsPerCombo + (comboIndex < remainder ? 1 : 0);
        
        console.log(`🔍 Searching: ${categoryToSearch} in ${cityToSearch} (${leadsForThisCombo} leads)`);
        const places = await searchPlaces(cityToSearch, categoryToSearch, apiKeyToUse, leadsForThisCombo);
        console.log(`✅ Found ${places.length} real leads for ${categoryToSearch} in ${cityToSearch}`);
        
        allPlaces = [...allPlaces, ...places];
        searchResults.push({
          city: cityToSearch,
          category: categoryToSearch,
          requested: leadsForThisCombo,
          found: places.length
        });
        
        comboIndex++;
      }
    }
    
    console.log(`📈 Total leads found: ${allPlaces.length} across ${totalCombinations} combinations`);
    
    // Handle dynamic rebalancing if needed
    if (allPlaces.length < maxLeads) {
      const shortfall = maxLeads - allPlaces.length;
      console.log(`⚖️ Rebalancing: ${shortfall} leads short, attempting to redistribute...`);
      
      // Find combinations that had fewer leads than requested
      const underperformingCombos = searchResults.filter(result => result.found < result.requested);
      const availableCapacity = underperformingCombos.reduce((sum, combo) => sum + (combo.requested - combo.found), 0);
      
      if (availableCapacity > 0) {
        console.log(`🔄 Redistributing ${shortfall} leads across combinations with capacity`);
        // Additional rebalancing logic could be implemented here
      }
    }
    
    // Store in database with contributor tracking
    const stmt = db.prepare(`INSERT OR IGNORE INTO leads (name, rating, reviewCount, address, googlePlaceId, city, category, phone, website, valueScore, valueTier, contributedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    // Contributor name already determined above
    
    // Track actual new leads added (not duplicates)
    let newLeadsAdded = 0;
    for (const place of allPlaces) {
      const result = stmt.run(place.name, place.rating, place.reviewCount, place.address, place.googlePlaceId, place.city, place.category, place.phone || null, place.website || null, place.valueScore, place.valueTier, contributorName);
      if (result.changes > 0) {
        newLeadsAdded++;
      }
    }
    stmt.finalize();
    
    console.log(`🎉 Actually added ${newLeadsAdded} new leads (${allPlaces.length - newLeadsAdded} were duplicates)`);
    res.json({ 
      data: allPlaces,
      newLeads: newLeadsAdded,
      totalFound: allPlaces.length,
      duplicates: allPlaces.length - newLeadsAdded,
      searchSummary: {
        totalCombinations,
        citiesToSearch,
        categoriesToSearch,
        searchResults
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import leads from CSV data (restore functionality)
app.post('/api/import-leads', (req, res) => {
  try {
    const { leads } = req.body;
    
    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'Invalid leads data. Expected array of leads.' });
    }
    
    const stmt = db.prepare(`INSERT OR IGNORE INTO leads (name, rating, reviewCount, address, googlePlaceId, city, category, phone, website, valueScore, valueTier, contributedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    let importedCount = 0;
    for (const lead of leads) {
      // Generate a unique googlePlaceId if not provided
      const placeId = lead.googlePlaceId || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = stmt.run(
        lead.name || 'Unknown Business',
        parseFloat(lead.rating) || null,
        parseInt(lead.reviewCount) || null,
        lead.address || '',
        placeId,
        lead.city || '',
        lead.category || 'Unknown',
        lead.phone || null,
        lead.website || null,
        parseInt(lead.valueScore) || 0,
        lead.valueTier || 'Standard',
        lead.contributedBy || 'Imported'
      );
      
      if (result.changes > 0) {
        importedCount++;
      }
    }
    
    stmt.finalize();
    
    console.log(`📥 Imported ${importedCount} leads successfully`);
    res.json({ 
      message: `Successfully imported ${importedCount} leads`, 
      imported: importedCount,
      total: leads.length 
    });
  } catch (error) {
    console.error('Import error:', error);
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
// Clear all leads from database (for fake data removal)
app.delete('/api/leads/clear', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM leads');
    const result = stmt.run();
    stmt.finalize();
    
    console.log(`🗑️ Cleared ${result.changes} leads from database`);
    res.json({ 
      message: `Successfully cleared ${result.changes} leads from database`,
      cleared: result.changes 
    });
  } catch (error) {
    console.error('❌ Error clearing leads:', error);
    res.status(500).json({ error: error.message });
  }
});



app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('✅ Database initialized');
});

module.exports = app;
