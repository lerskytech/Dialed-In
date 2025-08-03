const { initDb } = require('../lib/database');

exports.handler = async function(event, context) {
  try {
    const db = await initDb();
    const leads = await db.all('SELECT * FROM leads ORDER BY name');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leads),
    };
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch leads from database.' }),
    };
  }
};
