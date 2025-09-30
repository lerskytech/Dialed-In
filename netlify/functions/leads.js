// In-memory storage for demo - replace with database in production
let leadsStorage = [];

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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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

  if (event.httpMethod === 'GET') {
    // Return stored leads
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadsStorage)
    };
  }

  if (event.httpMethod === 'POST') {
    // Store new leads
    try {
      const newLeads = JSON.parse(event.body);
      
      // Add new leads to storage (with basic deduplication)
      newLeads.forEach(lead => {
        const existingIndex = leadsStorage.findIndex(l => 
          l.googlePlaceId === lead.googlePlaceId || 
          (l.name === lead.name && l.city === lead.city)
        );
        
        if (existingIndex >= 0) {
          leadsStorage[existingIndex] = { ...leadsStorage[existingIndex], ...lead };
        } else {
          leadsStorage.push({ ...lead, id: Date.now() + Math.random() });
        }
      });
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Leads stored successfully' })
      };
      
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid JSON data' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
