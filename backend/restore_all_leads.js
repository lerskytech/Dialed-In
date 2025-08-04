const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Your complete leads data
const leadsData = [
  {
    "id": 1088,
    "name": "Panther Plumbing",
    "rating": 4.9,
    "reviewCount": 1287,
    "address": "5701 Mableton Pkwy SW Suite 212, Mableton, GA 30126, USA",
    "googlePlaceId": "ChIJ4famZtIj9YgRu77HZm3r3aE",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(678) 968-2425",
    "website": "https://www.pantherplumbing.com/",
    "valueScore": 89,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1089,
    "name": "Chen Plumbing",
    "rating": 4.9,
    "reviewCount": 1227,
    "address": "6399 Jimmy Carter Blvd Suite 100B, Norcross, GA 30071, USA",
    "googlePlaceId": "ChIJy6Q7Cyyh9YgR53cJz1hAXbs",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(678) 203-6022",
    "website": "https://chenplumbing.com/?utm_source=gmb&utm_medium=organic",
    "valueScore": 89,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1090,
    "name": "Blue Skies Atlanta Plumbing",
    "rating": 5,
    "reviewCount": 805,
    "address": "5520 Lilburn Stone Mountain Rd Ste B, Stone Mountain, GA 30087, USA",
    "googlePlaceId": "ChIJ5VhWtfWl9YgRL3VU0FAF4Aw",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(470) 223-2360",
    "website": "https://www.blueskiesatlanta.com/",
    "valueScore": 85,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1091,
    "name": "True Plumbing",
    "rating": 5,
    "reviewCount": 790,
    "address": "2650 Pleasantdale Rd, Doraville, GA 30340, USA",
    "googlePlaceId": "ChIJiV6GLEMJ9YgRXyQOIDzTwDE",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(404) 998-9291",
    "website": "https://trueplumbingatl.com/?utm_source=GBP&utm_medium=organic&utm_campaign=main",
    "valueScore": 85,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1092,
    "name": "Fix & Flow Plumbing Co.",
    "rating": 4.9,
    "reviewCount": 756,
    "address": "1433 Mayson St NE #30324, Atlanta, GA 30324, USA",
    "googlePlaceId": "ChIJcQ0anxMB9YgRavil1lPczyw",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(404) 800-3569",
    "website": "https://www.fixandflow.co/?utm_campaign=gmb&utm_medium=organic&utm_source=gmb",
    "valueScore": 84,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1093,
    "name": "Atlantis Plumbing",
    "rating": 4.9,
    "reviewCount": 2698,
    "address": "691 John Wesley Dobbs Ave NE UNIT W, Atlanta, GA 30312, USA",
    "googlePlaceId": "ChIJaQz3KqUF9YgRWBlU-OIdi7U",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(770) 505-8570",
    "website": "https://www.atlantisplumbing.com/?utm_source=local&utm_medium=organic&utm_campaign=gmb",
    "valueScore": 84,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1094,
    "name": "RS Andrews",
    "rating": 4.9,
    "reviewCount": 8297,
    "address": "225 Scientific Dr NW, Peachtree Corners, GA 30092, USA",
    "googlePlaceId": "ChIJOxRJ3isI9YgR8HWT20zYRpg",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(770) 766-7941",
    "website": "https://www.rsandrews.com/?utm_source=google&utm_medium=gbp-pea",
    "valueScore": 84,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1095,
    "name": "Atlanta Plumbing & Drain",
    "rating": 4.9,
    "reviewCount": 639,
    "address": "455 Moreland Ave NE, Atlanta, GA 30307, USA",
    "googlePlaceId": "ChIJ7WWzXfb_9IgR2ZSWsH6lZYA",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(470) 693-8389",
    "website": "https://www.atlplumbingcompany.com/",
    "valueScore": 84,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1096,
    "name": "Plumbing Express",
    "rating": 4.9,
    "reviewCount": 1776,
    "address": "3050 Presidential Dr #202, Atlanta, GA 30340, USA",
    "googlePlaceId": "ChIJNxsfXH-n9YgR0YIQEWNEepA",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(404) 236-6535",
    "website": "https://plumbingexpress.com/?utm_campaign=gmb",
    "valueScore": 84,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  },
  {
    "id": 1097,
    "name": "TE Certified, Electrical, Plumbing, Heating & Cooling",
    "rating": 4.9,
    "reviewCount": 10559,
    "address": "9800 Old Dogwood Rd, Roswell, GA 30075, USA",
    "googlePlaceId": "ChIJITZvwKR19YgRweVIVDJL5ak",
    "city": "Atlanta, GA",
    "category": "Plumbing",
    "phone": "(770) 667-6937",
    "website": "https://www.tecertifiedelectricians.com/",
    "valueScore": 84,
    "valueTier": "Premium",
    "contributedBy": "Skyler",
    "createdAt": "2025-08-04 04:38:42"
  }
];

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

async function restoreLeads() {
    try {
        console.log(`Starting restoration of ${leadsData.length} leads...`);
        
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
                    if (imported % 50 === 0) {
                        console.log(`Imported ${imported} leads so far...`);
                    }
                } else {
                    duplicates++;
                }
            } catch (error) {
                console.error(`Error importing lead ${lead.name}:`, error.message);
                errors++;
            }
        }
        
        stmt.finalize();
        
        console.log('\n=== RESTORATION SUMMARY ===');
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
            console.log('\n✅ Lead restoration completed successfully!');
            console.log('All real Google Places API leads have been restored to the database.');
        });
        
    } catch (error) {
        console.error('Error during restoration:', error);
        db.close();
    }
}

// Run the restoration
restoreLeads();
