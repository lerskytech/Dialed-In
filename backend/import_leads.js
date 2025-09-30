const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'dialed-in-leads.db');
const db = new sqlite3.Database(dbPath);

// Create table if it doesn't exist
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

async function importLeads() {
    try {
        // Read the JSON file with all the leads (check multiple possible filenames)
        let leadsData;
        const possibleFiles = ['1st leads.json', 'user_leads.json', 'leads_restore.json', 'complete_leads_restore.json'];
        
        for (const filename of possibleFiles) {
            try {
                if (fs.existsSync(filename)) {
                    leadsData = JSON.parse(fs.readFileSync(filename, 'utf8'));
                    console.log(`Reading leads from: ${filename}`);
                    break;
                }
            } catch (error) {
                console.log(`Could not read ${filename}: ${error.message}`);
            }
        }
        
        if (!leadsData) {
            console.error('No valid leads file found. Please save your JSON data as user_leads.json');
            return;
        }
        
        console.log(`Found ${leadsData.length} leads to import`);
        
        let imported = 0;
        let duplicates = 0;
        let errors = 0;
        
        // Prepare the insert statement
        const stmt = db.prepare(`INSERT OR IGNORE INTO leads (
            name, rating, reviewCount, address, googlePlaceId, city, category, 
            phone, website, valueScore, valueTier, contributedBy, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        for (const lead of leadsData) {
            try {
                const result = stmt.run(
                    lead.name,
                    lead.rating,
                    lead.reviewCount,
                    lead.address,
                    lead.googlePlaceId,
                    lead.city,
                    lead.category,
                    lead.phone,
                    lead.website,
                    lead.valueScore,
                    lead.valueTier,
                    lead.contributedBy,
                    lead.createdAt
                );
                
                if (result.changes > 0) {
                    imported++;
                } else {
                    duplicates++;
                }
            } catch (error) {
                console.error(`Error importing lead ${lead.name}:`, error.message);
                errors++;
            }
        }
        
        stmt.finalize();
        
        console.log('\n=== IMPORT SUMMARY ===');
        console.log(`Total leads processed: ${leadsData.length}`);
        console.log(`Successfully imported: ${imported}`);
        console.log(`Duplicates skipped: ${duplicates}`);
        console.log(`Errors: ${errors}`);
        
        // Verify final count
        db.get('SELECT COUNT(*) as total FROM leads', (err, row) => {
            if (err) {
                console.error('Error getting final count:', err);
            } else {
                console.log(`Total leads in database: ${row.total}`);
            }
            
            db.close();
            console.log('\nImport completed successfully!');
        });
        
    } catch (error) {
        console.error('Error reading leads file:', error);
        db.close();
    }
}

// Run the import
importLeads();
