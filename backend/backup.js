const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class LeadBackupSystem {
  constructor(dbPath = './dialed-in-leads.db') {
    this.dbPath = dbPath;
    this.backupDir = './backups';
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Export all leads to JSON backup
  async exportLeads() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all('SELECT * FROM leads ORDER BY createdAt DESC', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupDir, `leads-backup-${timestamp}.json`);
        
        const backupData = {
          timestamp: new Date().toISOString(),
          totalLeads: rows.length,
          leads: rows
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        console.log(`✅ Backup created: ${backupFile} (${rows.length} leads)`);
        resolve({ file: backupFile, count: rows.length });
      });

      db.close();
    });
  }

  // Import leads from JSON backup
  async importLeads(backupFile) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(backupFile)) {
        reject(new Error(`Backup file not found: ${backupFile}`));
        return;
      }

      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      const db = new sqlite3.Database(this.dbPath);

      const stmt = db.prepare(`INSERT OR IGNORE INTO leads (
        name, rating, reviewCount, address, googlePlaceId, city, category,
        phone, website, valueScore, valueTier, contributedBy, businessStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      let importedCount = 0;
      
      for (const lead of backupData.leads) {
        const result = stmt.run(
          lead.name, lead.rating, lead.reviewCount, lead.address,
          lead.googlePlaceId, lead.city, lead.category, lead.phone,
          lead.website, lead.valueScore, lead.valueTier, lead.contributedBy,
          lead.businessStatus, lead.createdAt
        );
        
        if (result.changes > 0) {
          importedCount++;
        }
      }

      stmt.finalize();
      db.close();

      console.log(`✅ Imported ${importedCount} leads from backup`);
      resolve({ imported: importedCount, total: backupData.leads.length });
    });
  }

  // Automatic daily backup
  startAutomaticBackup() {
    // Backup immediately
    this.exportLeads();
    
    // Then backup every 6 hours
    setInterval(() => {
      this.exportLeads().catch(console.error);
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('🔄 Automatic backup system started (every 6 hours)');
  }

  // Get latest backup file
  getLatestBackup() {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('leads-backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    return files.length > 0 ? path.join(this.backupDir, files[0]) : null;
  }
}

module.exports = LeadBackupSystem;
