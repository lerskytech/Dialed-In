const database = require('./database');

const searchLocations = (query) => {
  return new Promise((resolve, reject) => {
    const db = database.db;
    if (!db) return reject(new Error('Database not initialized'));

    const lowerCaseQuery = (query || '').toLowerCase();

    let sql;
    const params = [];

    if (!lowerCaseQuery) {
      sql = 'SELECT * FROM locations ORDER BY population DESC LIMIT 25';
    } else {
      sql = 'SELECT * FROM locations WHERE lower(city) LIKE ? ORDER BY population DESC LIMIT 25';
      params.push(lowerCaseQuery + '%');
    }

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      
      const results = rows.map(row => ({
        id: row.id,
        value: `${row.city}, ${row.state_id}`,
        label: `${row.city}, ${row.state_id}`,
      }));

      resolve(results);
    });
  });
};

// Dummy functions to avoid breaking imports in index.js
const loadLocations = async () => Promise.resolve();
const clearLocations = () => {};

module.exports = { loadLocations, clearLocations, searchLocations };
