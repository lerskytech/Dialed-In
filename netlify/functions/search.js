const { searchPlaces } = require('../../backend/placesService');

// Simple authentication check
const isAuthenticated = (headers) => {
  const authHeader = headers.authorization;
  if (!authHeader) return false;
  
  // Simple token-based auth - replace with your preferred method
  const token = authHeader.replace('Bearer ', '');
  const validTokens = [
    process.env.DIALED_IN_ACCESS_TOKEN_1 || 'dialed-in-partner-access-2024',
    process.env.DIALED_IN_ACCESS_TOKEN_2 || 'dialed-in-business-partner-2024'
  ];
  
  return validTokens.includes(token);
};

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Check authentication
  if (!isAuthenticated(event.headers)) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Unauthorized access' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { city, category } = JSON.parse(event.body);
    
    if (!city || !category) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'City and category are required' })
      };
    }

    const places = await searchPlaces(city, category);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: `${places.length} leads found`, 
        data: places 
      })
    };
    
  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
