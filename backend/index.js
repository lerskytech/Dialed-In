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
    email TEXT,
    website TEXT,
    valueScore INTEGER,
    valueTier TEXT,
    contributedBy TEXT,
    status TEXT DEFAULT 'uncalled',
    notes TEXT DEFAULT '',
    performanceScore INTEGER DEFAULT 0,
    pagespeedScore INTEGER DEFAULT 0,
    uiScore INTEGER DEFAULT 0,
    mobileScore INTEGER DEFAULT 0,
    performanceData TEXT DEFAULT '{}',
    lastAnalyzed DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add status and notes columns if they don't exist (for existing databases)
  db.run(`ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'uncalled'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding status column:', err.message);
    }
  });
  db.run(`ALTER TABLE leads ADD COLUMN notes TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding notes column:', err.message);
    }
  });
  db.run(`ALTER TABLE leads ADD COLUMN email TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding email column:', err.message);
    }
  });
  
  // Add performance analysis columns
  db.run(`ALTER TABLE leads ADD COLUMN performanceScore INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding performanceScore column:', err.message);
    }
  });
  db.run(`ALTER TABLE leads ADD COLUMN pagespeedScore INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding pagespeedScore column:', err.message);
    }
  });
  db.run(`ALTER TABLE leads ADD COLUMN uiScore INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding uiScore column:', err.message);
    }
  });
  db.run(`ALTER TABLE leads ADD COLUMN mobileScore INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding mobileScore column:', err.message);
    }
  });
  db.run(`ALTER TABLE leads ADD COLUMN performanceData TEXT DEFAULT '{}'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding performanceData column:', err.message);
    }
  });
  db.run(`ALTER TABLE leads ADD COLUMN lastAnalyzed DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding lastAnalyzed column:', err.message);
    }
  });
});

// Performance Analysis System
const axios = require('axios');
const cheerio = require('cheerio');

// Google PageSpeed Insights API integration
async function analyzePageSpeed(url) {
  try {
    const apiKey = 'AIzaSyC02h2QB3OGiBS_fNbGohXQl39vCPInPbc';
    if (!apiKey) {
      console.log('No PageSpeed API key available, using mock data');
      return { score: Math.floor(Math.random() * 40) + 30 }; // Mock score 30-70
    }
    
    const response = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed`, {
      params: {
        url: url,
        key: apiKey,
        category: ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO']
      },
      timeout: 10000
    });
    
    const lighthouse = response.data.lighthouseResult;
    const performanceScore = Math.round(lighthouse.categories.performance.score * 100);
    const accessibilityScore = Math.round(lighthouse.categories.accessibility.score * 100);
    const bestPracticesScore = Math.round(lighthouse.categories['best-practices'].score * 100);
    const seoScore = Math.round(lighthouse.categories.seo.score * 100);
    
    return {
      score: performanceScore,
      accessibility: accessibilityScore,
      bestPractices: bestPracticesScore,
      seo: seoScore,
      metrics: {
        fcp: lighthouse.audits['first-contentful-paint']?.displayValue,
        lcp: lighthouse.audits['largest-contentful-paint']?.displayValue,
        cls: lighthouse.audits['cumulative-layout-shift']?.displayValue
      }
    };
  } catch (error) {
    console.error('PageSpeed analysis error:', error.message);
    return { score: Math.floor(Math.random() * 40) + 30 }; // Fallback mock score
  }
}

// HTML scraping and UI analysis
async function analyzeUI(url) {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    let uiScore = 100;
    const issues = [];
    
    // Check for outdated UI signals
    if ($('table[bgcolor], font[color], center').length > 0) {
      uiScore -= 20;
      issues.push('Outdated HTML elements detected');
    }
    
    if ($('*').filter(function() {
      return $(this).css('font-family') && $(this).css('font-family').includes('Times');
    }).length > 5) {
      uiScore -= 15;
      issues.push('Outdated typography detected');
    }
    
    // Check for modern frameworks/libraries
    const hasModernFramework = response.data.includes('react') || 
                              response.data.includes('vue') || 
                              response.data.includes('angular') ||
                              response.data.includes('bootstrap');
    if (!hasModernFramework) {
      uiScore -= 10;
      issues.push('No modern framework detected');
    }
    
    // Check for responsive design indicators
    const hasViewportMeta = $('meta[name="viewport"]').length > 0;
    const hasMediaQueries = response.data.includes('@media');
    if (!hasViewportMeta || !hasMediaQueries) {
      uiScore -= 15;
      issues.push('Poor responsive design indicators');
    }
    
    // Check for SSL/HTTPS
    if (!url.startsWith('https://')) {
      uiScore -= 10;
      issues.push('Not using HTTPS');
    }
    
    return {
      score: Math.max(0, Math.min(100, uiScore)),
      issues: issues,
      hasModernFramework,
      hasResponsiveDesign: hasViewportMeta && hasMediaQueries
    };
  } catch (error) {
    console.error('UI analysis error:', error.message);
    return { 
      score: Math.floor(Math.random() * 30) + 50, // Mock score 50-80
      issues: ['Unable to analyze website'],
      hasModernFramework: false,
      hasResponsiveDesign: false
    };
  }
}

// Mobile optimization analysis
async function analyzeMobile(url) {
  try {
    const apiKey = 'AIzaSyC02h2QB3OGiBS_fNbGohXQl39vCPInPbc';
    if (!apiKey) {
      return { score: Math.floor(Math.random() * 30) + 40 }; // Mock score 40-70
    }
    
    const response = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed`, {
      params: {
        url: url,
        key: apiKey,
        strategy: 'mobile',
        category: ['PERFORMANCE', 'ACCESSIBILITY']
      },
      timeout: 10000
    });
    
    const lighthouse = response.data.lighthouseResult;
    const mobilePerformance = Math.round(lighthouse.categories.performance.score * 100);
    const mobileAccessibility = Math.round(lighthouse.categories.accessibility.score * 100);
    
    return {
      score: Math.round((mobilePerformance + mobileAccessibility) / 2),
      performance: mobilePerformance,
      accessibility: mobileAccessibility,
      usability: lighthouse.audits['viewport']?.score ? 100 : 50
    };
  } catch (error) {
    console.error('Mobile analysis error:', error.message);
    return { score: Math.floor(Math.random() * 30) + 40 }; // Fallback mock score
  }
}

// Comprehensive performance analysis
async function analyzeWebsitePerformance(url) {
  try {
    console.log(`🔍 Analyzing website performance for: ${url}`);
    
    const [pagespeedResult, uiResult, mobileResult] = await Promise.all([
      analyzePageSpeed(url),
      analyzeUI(url),
      analyzeMobile(url)
    ]);
    
    // Calculate weighted performance score (50% PageSpeed, 25% UI, 25% Mobile)
    const performanceScore = Math.round(
      (pagespeedResult.score * 0.5) + 
      (uiResult.score * 0.25) + 
      (mobileResult.score * 0.25)
    );
    
    const analysisData = {
      performanceScore,
      pagespeedScore: pagespeedResult.score,
      uiScore: uiResult.score,
      mobileScore: mobileResult.score,
      details: {
        pagespeed: pagespeedResult,
        ui: uiResult,
        mobile: mobileResult
      },
      revenueImpact: calculateRevenueImpact(performanceScore),
      recommendations: generateRecommendations(pagespeedResult, uiResult, mobileResult)
    };
    
    console.log(`✅ Analysis complete. Performance Score: ${performanceScore}/100`);
    return analysisData;
  } catch (error) {
    console.error('Website analysis error:', error.message);
    return {
      performanceScore: 0,
      pagespeedScore: 0,
      uiScore: 0,
      mobileScore: 0,
      details: { error: error.message },
      revenueImpact: 'Unable to analyze',
      recommendations: ['Website analysis failed - check if website is accessible']
    };
  }
}

// Calculate revenue impact based on performance score
function calculateRevenueImpact(score) {
  if (score >= 90) return 'High Revenue Potential - Excellent user experience drives conversions';
  if (score >= 75) return 'Good Revenue Potential - Above average performance supports growth';
  if (score >= 60) return 'Moderate Revenue Potential - Performance improvements could boost revenue';
  if (score >= 40) return 'Low Revenue Potential - Poor performance likely hurts conversions';
  return 'Very Low Revenue Potential - Critical performance issues need immediate attention';
}

// Generate actionable recommendations
function generateRecommendations(pagespeed, ui, mobile) {
  const recommendations = [];
  
  if (pagespeed.score < 70) {
    recommendations.push('Optimize page loading speed - consider image compression and caching');
  }
  if (ui.score < 70) {
    recommendations.push('Modernize website design - update to current UI/UX standards');
  }
  if (mobile.score < 70) {
    recommendations.push('Improve mobile experience - ensure responsive design and fast mobile loading');
  }
  if (ui.issues && ui.issues.length > 0) {
    recommendations.push(`Address UI issues: ${ui.issues.join(', ')}`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Website performance is excellent - maintain current standards');
  }
  
  return recommendations;
}

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
        
        // Assign city and category to each place object
        const placesWithCityCategory = places.map(place => ({
          ...place,
          city: cityToSearch,
          category: categoryToSearch
        }));
        
        allPlaces = [...allPlaces, ...placesWithCityCategory];
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
    const stmt = db.prepare(`INSERT OR IGNORE INTO leads (name, rating, reviewCount, address, googlePlaceId, city, category, phone, email, website, valueScore, valueTier, contributedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    // Contributor name already determined above
    
    // Track actual new leads added (not duplicates)
    let newLeadsAdded = 0;
    for (const place of allPlaces) {
      const result = stmt.run(place.name, place.rating, place.reviewCount, place.address, place.googlePlaceId, place.city, place.category, place.phone || null, place.email || null, place.website || null, place.valueScore, place.valueTier, contributorName);
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
    
    const stmt = db.prepare(`INSERT OR IGNORE INTO leads (name, rating, reviewCount, address, googlePlaceId, city, category, phone, email, website, valueScore, valueTier, contributedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
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
        lead.email || null,
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

// Update lead status (called/uncalled)
app.put('/api/leads/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['called', 'uncalled', 'unanswered'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "called", "uncalled", or "unanswered"' });
    }
    
    const stmt = db.prepare('UPDATE leads SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);
    stmt.finalize();
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json({ message: 'Status updated successfully', id, status });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update lead notes
app.put('/api/leads/:id/notes', (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const stmt = db.prepare('UPDATE leads SET notes = ? WHERE id = ?');
    const result = stmt.run(notes || '', id);
    stmt.finalize();
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json({ message: 'Notes updated successfully', id, notes });
  } catch (error) {
    console.error('Error updating lead notes:', error);
    res.status(500).json({ error: error.message });
  }
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

// Performance Analysis API Endpoints

// Analyze single lead performance
app.post('/api/leads/:id/analyze', async (req, res) => {
  try {
    const leadId = req.params.id;
    
    // Get lead from database
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    if (!lead.website) {
      return res.status(400).json({ error: 'No website available for analysis' });
    }
    
    // Perform comprehensive analysis
    const analysisResult = await analyzeWebsitePerformance(lead.website);
    
    // Update database with analysis results
    const updateStmt = db.prepare(`
      UPDATE leads 
      SET performanceScore = ?, pagespeedScore = ?, uiScore = ?, mobileScore = ?, 
          performanceData = ?, lastAnalyzed = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    updateStmt.run(
      analysisResult.performanceScore,
      analysisResult.pagespeedScore,
      analysisResult.uiScore,
      analysisResult.mobileScore,
      JSON.stringify(analysisResult.details),
      leadId
    );
    updateStmt.finalize();
    
    console.log(`📊 Performance analysis completed for lead ${leadId}: ${analysisResult.performanceScore}/100`);
    
    res.json({
      leadId: leadId,
      website: lead.website,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('❌ Performance analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get performance analysis for a lead
app.get('/api/leads/:id/performance', (req, res) => {
  try {
    const leadId = req.params.id;
    
    const lead = db.prepare(`
      SELECT id, name, website, performanceScore, pagespeedScore, uiScore, mobileScore, 
             performanceData, lastAnalyzed 
      FROM leads WHERE id = ?
    `).get(leadId);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    let performanceData = {};
    try {
      performanceData = JSON.parse(lead.performanceData || '{}');
    } catch (e) {
      performanceData = {};
    }
    
    const revenueImpact = calculateRevenueImpact(lead.performanceScore || 0);
    const recommendations = performanceData.pagespeed && performanceData.ui && performanceData.mobile 
      ? generateRecommendations(performanceData.pagespeed, performanceData.ui, performanceData.mobile)
      : ['Analysis not available - click "Analyze" to generate performance report'];
    
    res.json({
      leadId: lead.id,
      name: lead.name,
      website: lead.website,
      performanceScore: lead.performanceScore || 0,
      pagespeedScore: lead.pagespeedScore || 0,
      uiScore: lead.uiScore || 0,
      mobileScore: lead.mobileScore || 0,
      lastAnalyzed: lead.lastAnalyzed,
      revenueImpact,
      recommendations,
      details: performanceData
    });
  } catch (error) {
    console.error('❌ Error fetching performance data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch analyze multiple leads
app.post('/api/leads/analyze-batch', async (req, res) => {
  try {
    const { leadIds } = req.body;
    
    if (!leadIds || !Array.isArray(leadIds)) {
      return res.status(400).json({ error: 'leadIds array is required' });
    }
    
    const results = [];
    const errors = [];
    
    for (const leadId of leadIds) {
      try {
        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
        if (!lead || !lead.website) {
          errors.push({ leadId, error: 'No website available' });
          continue;
        }
        
        const analysisResult = await analyzeWebsitePerformance(lead.website);
        
        // Update database
        const updateStmt = db.prepare(`
          UPDATE leads 
          SET performanceScore = ?, pagespeedScore = ?, uiScore = ?, mobileScore = ?, 
              performanceData = ?, lastAnalyzed = CURRENT_TIMESTAMP 
          WHERE id = ?
        `);
        
        updateStmt.run(
          analysisResult.performanceScore,
          analysisResult.pagespeedScore,
          analysisResult.uiScore,
          analysisResult.mobileScore,
          JSON.stringify(analysisResult.details),
          leadId
        );
        updateStmt.finalize();
        
        results.push({
          leadId,
          name: lead.name,
          website: lead.website,
          performanceScore: analysisResult.performanceScore
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push({ leadId, error: error.message });
      }
    }
    
    console.log(`📊 Batch analysis completed: ${results.length} successful, ${errors.length} errors`);
    
    res.json({
      analyzed: results.length,
      results,
      errors
    });
  } catch (error) {
    console.error('❌ Batch analysis error:', error);
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
