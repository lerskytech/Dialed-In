const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

async function searchPlaces(city, category) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Google Places API key is missing or not configured.');
  }

  const query = `${category} in ${city}`;

  try {
    const response = await client.textSearch({
      params: {
        query: query,
        key: apiKey,
      },
      timeout: 5000, // optional
    });

    if (response.data.status === 'OK') {
      return response.data.results.map(place => ({
        name: place.name,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        address: place.formatted_address,
        googlePlaceId: place.place_id,
        phone: null, // Phone number requires a separate Places Details request
      }));
    } else {
      console.error('Google Places API Error:', response.data.status, response.data.error_message);
      throw new Error(`Google Places API Error: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Error fetching data from Google Places API:', error);
    throw error;
  }
}

module.exports = { searchPlaces };
