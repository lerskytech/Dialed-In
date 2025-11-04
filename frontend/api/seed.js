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
  },
  {
    name: 'Bay Area Web Pros',
    rating: 4.7,
    reviewCount: 95,
    address: '789 Mission St, San Francisco, CA',
    googlePlaceId: 'ChIJ-S3b5Y-AhYARAd5A0y-VwA2',
    city: 'San Francisco',
    category: 'Web Designer',
    phone: '(345) 678-9012',
    website: 'https://bayareapros.com',
    businessStatus: 'OPERATIONAL',
    contributedBy: 'system'
  },
  {
    name: 'Golden Gate Marketing',
    rating: 4.6,
    reviewCount: 80,
    address: '101 Post St, San Francisco, CA',
    googlePlaceId: 'ChIJ-S3b5Y-AhYARAd5A0y-VwA3',
    city: 'San Francisco',
    category: 'Marketing Agency',
    phone: '(456) 789-0123',
    website: 'https://ggmarketing.com',
    businessStatus: 'CLOSED_TEMPORARILY',
    contributedBy: 'system'
  }
];

function seedDatabase(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM leads', (err, row) => {
      if (err) {
        return reject(err);
      }

      if (row.count === 0) {
        console.log('🌱 Database is empty. Seeding with sample leads...');
        const stmt = db.prepare(`
          INSERT INTO leads (name, rating, reviewCount, address, googlePlaceId, city, category, phone, website, businessStatus, contributedBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let completed = 0;
        sampleLeads.forEach(lead => {
          stmt.run(
            lead.name,
            lead.rating,
            lead.reviewCount,
            lead.address,
            lead.googlePlaceId,
            lead.city,
            lead.category,
            lead.phone,
            lead.website,
            lead.businessStatus,
            lead.contributedBy,
            (err) => {
              if (err) {
                console.error('Error inserting seed data:', err);
              }
              completed++;
              if (completed === sampleLeads.length) {
                stmt.finalize(err => {
                  if (err) return reject(err);
                  console.log(`🌱 Seeded ${sampleLeads.length} sample leads.`);
                  resolve();
                });
              }
            }
          );
        });
      } else {
        console.log('✅ Database already contains data. Skipping seed.');
        resolve();
      }
    });
  });
}

module.exports = { seedDatabase };
