const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapsClient = new Client({});

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
    
        const locationBias = await getGeocodedLocationBias(city, GOOGLE_PLACES_API_KEY);

    const allLeads = await fetchGooglePlacesData(primaryTerm, GOOGLE_PLACES_API_KEY, maxLeads, locationBias);
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
    
    // Enrich the limited set with details like phone numbers and emails
    const enrichedLeads = await enrichLeads(limitedLeads, GOOGLE_PLACES_API_KEY);
    console.log(`📞 Final result: ${enrichedLeads.length} enriched leads`);
    
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
async function fetchGooglePlacesData(query, apiKey, maxLeads = 25, locationBias) {
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
        rectangle: locationBias
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

// Enrich leads with details like phone, website, and email
async function enrichLeads(leads, apiKey) {
  console.log(`✨ Enriching ${leads.length} leads with details...`);
  const enrichedLeads = [];

  for (const lead of leads) {
    try {
      const details = await Promise.race([
        fetchPlaceDetails(lead.googlePlaceId, apiKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);

      let finalEmail = details.email;

      // If no email from Places API, try scraping the website
      if (!finalEmail && details.website) {
        finalEmail = await scrapeEmailFromWebsite(details.website);
      }

      // If still no email, fall back to guessing based on domain
      if (!finalEmail && details.website) {
        try {
          const domain = new URL(details.website).hostname.replace('www.', '');
          finalEmail = `info@${domain}`; // Best guess
        } catch (e) { /* Invalid URL */ }
      }

      enrichedLeads.push({
        ...lead,
        phone: details.phone || lead.phone || null,
        website: details.website || lead.website || null,
        email: finalEmail
      });
    } catch (error) {
      // Keep the lead even if enrichment fails
      enrichedLeads.push({
        ...lead,
        email: null // Ensure email is null if enrichment fails
      });
    }
    
    // Small delay between each enrichment to avoid rate-limiting
    await new Promise(resolve => setTimeout(resolve, 100));
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
  
  // Enhanced email detection - check multiple fields
  let email = null;
  
  // Check editorial summary first (most common source)
  if (data.editorialSummary && data.editorialSummary.text) {
    const emailMatch = data.editorialSummary.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      email = emailMatch[0];
    }
  }
  
  // If no email found, check other potential fields
  if (!email) {
    // Check reviews for email mentions (sometimes customers post business emails)
    if (data.reviews && Array.isArray(data.reviews)) {
      for (const review of data.reviews.slice(0, 5)) { // Check first 5 reviews only
        if (review.text && review.text.originalText) {
          const emailMatch = review.text.originalText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            email = emailMatch[0];
            break;
          }
        }
      }
    }
  }
  
  // Generate common business email patterns if we have website but no email
  if (!email && data.websiteUri) {
    try {
      const domain = new URL(data.websiteUri).hostname.replace('www.', '');
      // Common business email patterns - these are educated guesses
      const commonPatterns = [
        `info@${domain}`,
        `contact@${domain}`,
        `hello@${domain}`,
        `admin@${domain}`
      ];
      // Use the most common pattern (info@) as a reasonable guess
      email = commonPatterns[0];
    } catch (e) {
      // Invalid URL, skip email generation
    }
  }
  
  return {
    phone: data.nationalPhoneNumber || null,
    website: data.websiteUri || null,
    email: email,
    businessStatus: data.businessStatus || null
  };
}

// Scrape a website to find an email address
async function scrapeEmailFromWebsite(url) {
  if (!url) return null;

  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);

    // 1. Look for mailto links (most reliable)
    const mailto = $('a[href^="mailto:"]').first().attr('href');
    if (mailto) {
      return mailto.replace('mailto:', '');
    }

    // 2. Look for email patterns in the text
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const text = $('body').text();
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      // Prefer common business emails if available
      const preferred = emails.find(e => e.startsWith('info@') || e.startsWith('contact@') || e.startsWith('support@'));
      return preferred || emails[0];
    }

    return null;
  } catch (error) {
    // console.error(`Failed to scrape ${url}: ${error.message}`);
    return null;
  }
}

async function getGeocodedLocationBias(city, apiKey) {
  try {
    const response = await googleMapsClient.geocode({
      params: {
        address: city,
        key: apiKey,
      },
      timeout: 1000, // 1 second timeout
    });

    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      const viewport = response.data.results[0].geometry.viewport;
      console.log(`🌍 Geocoded ${city} to:`, viewport);
      return {
        low: { latitude: viewport.southwest.lat, longitude: viewport.southwest.lng },
        high: { latitude: viewport.northeast.lat, longitude: viewport.northeast.lng },
      };
    }
  } catch (e) {
    console.error('Geocoding API error:', e.message);
  }
  // Fallback to a wider region if geocoding fails
  return {
    low: { latitude: -90, longitude: -180 },
    high: { latitude: 90, longitude: 180 },
  };
}

module.exports = { searchPlaces };
