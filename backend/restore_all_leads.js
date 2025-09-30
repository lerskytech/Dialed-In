const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const leadsFilePath = path.join(__dirname, '1st leads.json');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error('❌ Failed to connect to the database:', err.message);
  }
  console.log('✅ Connected to the correct database (db.sqlite).');
  restoreLeads();
});

function restoreLeads() {
  try {
    console.log(`Reading leads from: ${leadsFilePath}`);
    const leadsDataString = fs.readFileSync(leadsFilePath, 'utf8');
    const leadsData = JSON.parse(leadsDataString);
    console.log(`✅ Successfully read ${leadsData.length} leads from the file.`);

    if (leadsData.length === 0) {
      console.log('No leads to import. Exiting.');
      return db.close();
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION', function(err) {
        if (err) {
          console.error('❌ Failed to begin transaction:', err.message);
          return db.close();
        }

        const stmt = db.prepare(`INSERT OR IGNORE INTO leads (
            name, rating, reviewCount, address, googlePlaceId, city, category, 
            phone, website, valueScore, valueTier, contributedBy, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        let count = 0;
        for (const lead of leadsData) {
          stmt.run(
            lead.name, lead.rating, lead.reviewCount, lead.address, lead.googlePlaceId,
            lead.city, lead.category, lead.phone, lead.website, lead.valueScore,
            lead.valueTier, lead.contributedBy, lead.createdAt
          );
          count++;
        }
        console.log(`... prepared ${count} leads for insertion.`);

        stmt.finalize((err) => {
          if (err) {
            console.error('❌ Error finalizing statement:', err.message);
            return db.run('ROLLBACK', () => db.close());
          }

          db.run('COMMIT', function(err) {
            if (err) {
              console.error('❌ Error committing transaction:', err.message);
              return db.run('ROLLBACK', () => db.close());
            }

            console.log(`✅ Transaction committed. ${leadsData.length} leads were processed.`);
            
            db.get('SELECT COUNT(*) as total FROM leads', (err, row) => {
              if (err) {
                console.error('Error getting final count:', err);
              } else {
                console.log(`Total leads in database: ${row.total}`);
              }
              db.close();
              console.log('\n✅ Lead restoration completed successfully!');
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ A critical error occurred during the restoration process:', error);
    if (db) db.close();
  }
}
