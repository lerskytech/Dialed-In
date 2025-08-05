// Simple Google Places API Lead Generation - REAL DATA ONLY

async function searchPlaces(city, category, apiKey, maxLeads = 25) {
  const GOOGLE_PLACES_API_KEY = apiKey || process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Missing Google Places API key. Please configure your API key in settings.');
  }
  console.log(`🔍 Searching for REAL ${category} businesses in ${city}`);
  
  try {
    // Use single optimized search term to prevent timeouts
    const primaryTerm = `${category} ${city}`;
    console.log(`🔍 Searching for: ${primaryTerm}`);
    
    const allLeads = await fetchGooglePlacesData(primaryTerm, GOOGLE_PLACES_API_KEY, maxLeads);
    console.log(`✅ Found ${allLeads.length} real businesses`);
    
    if (allLeads.length === 0) {
      return [];
    }
    
    // Remove duplicates
    const uniqueLeads = removeDuplicates(allLeads);
    
    // Add value-based ranking to prioritize high-value leads
    const rankedLeads = addValueRanking(uniqueLeads);
    console.log(`🎯 After ranking: ${rankedLeads.length} unique REAL businesses (ranked by value)`);
    
    // Limit leads first, then enrich only what we need to prevent timeouts
    const limitedLeads = rankedLeads.slice(0, maxLeads);
    console.log(`🎯 Limited to ${limitedLeads.length} leads before enrichment`);
    
    // Enrich only the limited set with phone numbers to save time
    const enrichedLeads = await enrichLeadsWithPhoneNumbers(limitedLeads, GOOGLE_PLACES_API_KEY);
    console.log(`📞 Final result: ${enrichedLeads.length} leads with phone numbers`);
    
    return enrichedLeads;
    
  } catch (error) {
    console.error('❌ Error fetching real data:', error);
    throw error;
  }
}

// Generate search terms for Google Places API
function generateSearchTerms(city, category) {
  const baseTerms = {
    'HVAC': ['HVAC', 'air conditioning', 'heating cooling', 'AC repair', 'furnace repair'],
    'Plumbing': ['plumber', 'plumbing services', 'drain cleaning', 'pipe repair'],
    'Electrical': ['electrician', 'electrical services', 'wiring', 'electrical repair'],
    'Legal Services': ['lawyer', 'attorney', 'law firm', 'legal services'],
    'Real Estate': ['real estate agent', 'realtor', 'property management'],
    'Restaurant': ['restaurant', 'dining', 'food service', 'cafe'],
    'Auto Repair': ['auto repair', 'car service', 'mechanic', 'automotive'],
    'Dentist': ['dentist', 'dental office', 'orthodontist', 'dental care'],
    'Roofing': ['roofing', 'roofer', 'roof repair', 'roofing contractor'],
    'Landscaping': ['landscaping', 'lawn care', 'gardening', 'landscape design'],
    'Cleaning Services': ['cleaning service', 'house cleaning', 'commercial cleaning'],
    'Pest Control': ['pest control', 'exterminator', 'bug control'],
    'Insurance': ['insurance', 'insurance agent', 'insurance agency'],
    'Accounting': ['accountant', 'accounting', 'tax service', 'CPA'],
    'Marketing': ['marketing', 'advertising', 'digital marketing'],
    'IT Services': ['IT services', 'computer repair', 'tech support'],
    'Fitness': ['gym', 'fitness center', 'personal trainer'],
    'Veterinarian': ['veterinarian', 'vet', 'animal hospital'],
    'Chiropractor': ['chiropractor', 'chiropractic', 'spine care'],
    'Physical Therapy': ['physical therapy', 'physical therapist', 'rehabilitation']
  };
  
  const terms = baseTerms[category] || [category.toLowerCase()];
  const cityName = city.split(',')[0]; // "Miami, FL" -> "Miami"
  
  const searchTerms = [];
  for (const term of terms) {
    searchTerms.push(`${term} in ${cityName}`);
  }
  
  return searchTerms;
}

// Fetch data from Google Places API (New) Text Search with pagination support
async function fetchGooglePlacesData(query, apiKey, maxLeads = 25) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const allPlaces = [];
  let nextPageToken = null;
  const maxRequestsPerSearch = Math.min(Math.ceil(maxLeads / 20), 10); // Limit to 10 requests max (200 results)
  let requestCount = 0;
  
  console.log(`🔍 Fetching up to ${maxLeads} leads with pagination...`);
  
  do {
    const requestBody = {
      textQuery: query,
      maxResultCount: 20, // Google Places API (New) max per request
      locationBias: {
        rectangle: {
          low: { latitude: 25.7617, longitude: -80.1918 }, // Miami area - will be dynamic later
          high: { latitude: 25.7817, longitude: -80.1718 }
        }
      }
    };
    
    // Add pagination token if available
    if (nextPageToken) {
      requestBody.pageToken = nextPageToken;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,nextPageToken'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API Error:', errorText);
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.places && data.places.length > 0) {
      const mappedPlaces = data.places.map(place => ({
        name: place.displayName?.text || 'Unknown Business',
        address: place.formattedAddress || 'Address not available',
        rating: place.rating || null,
        reviewCount: place.userRatingCount || 0,
        googlePlaceId: place.id,
        phone: place.nationalPhoneNumber || null,
        website: place.websiteUri || null
      }));
      
      allPlaces.push(...mappedPlaces);
      console.log(`📍 Batch ${requestCount + 1}: Found ${mappedPlaces.length} places (Total: ${allPlaces.length})`);
    }
    
    // Check for next page token
    nextPageToken = data.nextPageToken || null;
    requestCount++;
    
    // Add small delay between requests to avoid rate limiting
    if (nextPageToken && requestCount < maxRequestsPerSearch) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
  } while (nextPageToken && requestCount < maxRequestsPerSearch && allPlaces.length < maxLeads);
  
  console.log(`✅ Pagination complete: ${allPlaces.length} total places found in ${requestCount} requests`);
  return allPlaces;
}

// Enhanced duplicate removal and corporation filtering
function removeDuplicates(leads) {
  const seen = new Set();
  const seenNames = new Set();
  
  return leads.filter(lead => {
    // Remove exact duplicates by Google Place ID
    if (seen.has(lead.googlePlaceId)) {
      return false;
    }
    
    // Remove near-duplicate business names (normalize and compare)
    const normalizedName = lead.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    if (seenNames.has(normalizedName)) {
      return false;
    }
    
    // Filter out corporations and large chains
    const name = lead.name.toLowerCase();
    const corporateIndicators = [
      'corporation', 'corp', 'inc', 'llc', 'ltd', 'limited',
      'walmart', 'target', 'home depot', 'lowes', 'costco',
      'mcdonalds', 'burger king', 'subway', 'starbucks',
      'cvs', 'walgreens', 'rite aid', 'publix', 'kroger',
      'bank of america', 'wells fargo', 'chase', 'citibank',
      'at&t', 'verizon', 't-mobile', 'sprint'
    ];
    
    const isCorporation = corporateIndicators.some(indicator => 
      name.includes(indicator)
    );
    
    if (isCorporation) {
      console.log(`🚫 Filtered out corporation: ${lead.name}`);
      return false;
    }
    
    // Add to seen sets
    seen.add(lead.googlePlaceId);
    seenNames.add(normalizedName);
    return true;
  });
}

// Add value-based ranking to prioritize high-value REAL leads
function addValueRanking(leads) {
  return leads.map(lead => {
    let valueScore = 0;
    
    // Rating score (0-50 points)
    if (lead.rating) {
      valueScore += (lead.rating / 5) * 50;
    }
    
    // Review count score (0-30 points)
    if (lead.reviewCount) {
      if (lead.reviewCount >= 500) valueScore += 30;
      else if (lead.reviewCount >= 100) valueScore += 25;
      else if (lead.reviewCount >= 50) valueScore += 20;
      else if (lead.reviewCount >= 20) valueScore += 15;
      else if (lead.reviewCount >= 10) valueScore += 10;
      else valueScore += 5;
    }
    
    // Business name quality indicators (0-20 points) - favor local businesses
    const name = lead.name.toLowerCase();
    if (name.includes('professional') || name.includes('expert') || name.includes('premium')) valueScore += 10;
    if (name.includes('emergency') || name.includes('24/7') || name.includes('24 hour')) valueScore += 8;
    if (name.includes('local') || name.includes('family') || name.includes('custom')) valueScore += 5;
    // Small business indicators
    if (name.includes('& sons') || name.includes('& daughter') || name.includes('brothers') || name.includes('sisters')) valueScore += 5;
    
    // Address quality (established businesses) (0-10 points)
    if (lead.address && lead.address.includes('Suite') || lead.address.includes('Unit')) valueScore += 5;
    if (lead.address && !lead.address.includes('PO Box')) valueScore += 5;
    
    return {
      ...lead,
      valueScore: Math.round(valueScore),
      valueTier: getValueTier(valueScore)
    };
  }).sort((a, b) => b.valueScore - a.valueScore); // Sort by highest value first
}

// Determine value tier based on score
function getValueTier(score) {
  if (score >= 80) return 'Premium';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Standard';
}

// Enrich leads with phone numbers using Google Places Details API (with timeout protection)
async function enrichLeadsWithPhoneNumbers(leads, apiKey) {
  console.log(`📞 Enriching ${leads.length} leads with phone numbers...`);
  const enrichedLeads = [];
  
  // Process in smaller batches to prevent timeouts
  const batchSize = 5;
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    for (const lead of batch) {
      try {
        // Add timeout to prevent hanging
        const details = await Promise.race([
          fetchPlaceDetails(lead.googlePlaceId, apiKey),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        
        enrichedLeads.push({
          ...lead,
          phone: details.phone || null,
          website: details.website || null,
          email: details.email || null
        });
      } catch (error) {
        // Keep the lead even if enrichment fails or times out
        enrichedLeads.push({
          ...lead,
          phone: null,
          website: null,
          email: null
        });
      }
    }
    
    // Small delay between batches
    if (i + batchSize < leads.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return enrichedLeads;
}

// Fetch detailed information for a place using Google Places Details API (New)
async function fetchPlaceDetails(placeId, apiKey) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'nationalPhoneNumber,websiteUri,editorialSummary,businessStatus'
    }
  });
  
  const data = await resp.json();
  
  if (data.error) {
    console.log(`⚠️ Places Details API error: ${data.error.message}`);
    return {};
  }
  
  // Extract email from editorial summary if available
  let email = null;
  if (data.editorialSummary && data.editorialSummary.text) {
    const emailMatch = data.editorialSummary.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      email = emailMatch[0];
    }
  }
  
  return {
    phone: data.nationalPhoneNumber || null,
    website: data.websiteUri || null,
    email: email,
    businessStatus: data.businessStatus || null
  };
}

module.exports = { searchPlaces };
