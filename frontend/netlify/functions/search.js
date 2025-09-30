const { initDb } = require('../lib/database');
const { searchPlaces } = require('../lib/placesService');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { city, category } = JSON.parse(event.body);

    if (!city || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'City and category are required.' }),
      };
    }

    const places = await searchPlaces(city, category);
    const db = await initDb();

    let newLeadsCount = 0;
    for (const place of places) {
      try {
        const result = await db.run(
          'INSERT INTO leads (place_id, name, address, city, category, rating, reviewCount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          place.place_id,
          place.name,
          place.formatted_address,
          city,
          category,
          place.rating,
          place.user_ratings_total
        );
        if (result.changes > 0) {
          newLeadsCount++;
        }
      } catch (err) {
        // Ignore unique constraint errors, as it means the lead already exists.
        if (!err.message.includes('UNIQUE constraint failed')) {
          console.error('Database insert error:', err);
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Search complete. Added ${newLeadsCount} new leads.` }),
    };
  } catch (err) {
    console.error('Search function error:', err);
    if (err.message.includes('API key not valid')) {
       return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Google Places API key is missing or invalid. Please configure it in your environment variables.' }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to search for new leads.' }),
    };
  }
};
