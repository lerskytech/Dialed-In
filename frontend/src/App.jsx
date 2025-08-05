import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import UserSettings from './UserSettings';
import LoginPage from './LoginPage';

function App() {
  const { isAuthenticated, loading: authLoading, getAuthHeaders, logout, userName, token } = useAuth();

  // All hooks must be declared before any conditional returns
  const [userApiKey, setUserApiKey] = useState('');
  
  // Filtering and sorting state
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValueTier, setFilterValueTier] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [city, setCity] = useState(''); // Keep for backward compatibility
  const [category, setCategory] = useState(''); // Keep for backward compatibility
  const [maxLeads, setMaxLeads] = useState(25);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // City options
  const cityOptions = [
    { value: 'Miami, FL', label: 'Miami, FL' },
    { value: 'Orlando, FL', label: 'Orlando, FL' },
    { value: 'Tampa, FL', label: 'Tampa, FL' },
    { value: 'Jacksonville, FL', label: 'Jacksonville, FL' },
    { value: 'Palm Beach County, FL', label: 'Palm Beach County, FL' },
    { value: 'Broward County, FL', label: 'Broward County, FL' },
    { value: 'Treasure Coast, FL', label: 'Treasure Coast, FL' },
    { value: 'Atlanta, GA', label: 'Atlanta, GA' },
    { value: 'Houston, TX', label: 'Houston, TX' },
    { value: 'Dallas, TX', label: 'Dallas, TX' },
    { value: 'Asheville, NC', label: 'Asheville, NC' },
    { value: 'Nashville, TN', label: 'Nashville, TN' },
    { value: 'Charleston, SC', label: 'Charleston, SC' },
    { value: 'Virginia Beach, VA', label: 'Virginia Beach, VA' },
    { value: 'Charlotte, NC', label: 'Charlotte, NC' },
    { value: 'Raleigh, NC', label: 'Raleigh, NC' },
    { value: 'Greenville, SC', label: 'Greenville, SC' },
    { value: 'Honolulu, HI', label: 'Honolulu, HI' },
    { value: 'Seattle, WA', label: 'Seattle, WA' },
    { value: 'Portland, OR', label: 'Portland, OR' },
    { value: 'Los Angeles, CA', label: 'Los Angeles, CA' },
    { value: 'San Francisco, CA', label: 'San Francisco, CA' },
    { value: 'Salt Lake City, UT', label: 'Salt Lake City, UT' },
    { value: 'Denver, CO', label: 'Denver, CO' },
    { value: 'Boulder, CO', label: 'Boulder, CO' },
    { value: 'Colorado Springs, CO', label: 'Colorado Springs, CO' },
    { value: 'Traverse City, MI', label: 'Traverse City, MI' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'HVAC', label: 'HVAC & Air Conditioning' },
    { value: 'Plumbing', label: 'Plumbing Services' },
    { value: 'Electrical', label: 'Electrical Services' },
    { value: 'Roofing', label: 'Roofing & Repair' },
    { value: 'Event Planner', label: 'Event Planners' },
    { value: 'Garage Door Repair', label: 'Garage Door Repair Companies' },
    { value: 'Pest Control', label: 'Pest Control Services' },
    { value: 'Pool Cleaning', label: 'Pool Cleaning & Maintenance' },
    { value: 'Hair Salon', label: 'Hair Salons' },
    { value: 'Boutique', label: 'Boutiques' },
    { value: 'Barber', label: 'Barber Shops' },
    { value: 'Plastic Surgeon', label: 'Plastic Surgeons' },
    { value: 'Massage Therapist', label: 'Massage Therapists' },
    { value: 'Real Estate Agent', label: 'Real Estate Agents' },
    { value: 'Chiropractor', label: 'Chiropractors' },
    { value: 'Dermatologist', label: 'Dermatologists' },
    { value: 'Financial Advisor', label: 'Financial Advisors' },
    { value: 'Private Tutor', label: 'Private Tutors' },
    { value: 'Auto Repair', label: 'Auto Repair' },
    { value: 'Family Law Attorney', label: 'Family Law Attorneys' },
    { value: 'Immigration Attorney', label: 'Immigration Attorneys' },
    { value: 'Personal Injury Attorney', label: 'Personal Injury Attorneys' },
    { value: 'Personal Trainer', label: 'Personal Trainers' },
    { value: 'Landscaping', label: 'Landscaping Services' },
    { value: 'Spa', label: 'Spas' },
    { value: 'Psychic', label: 'Psychics' },
    { value: 'Lounge', label: 'Lounges' },
    { value: 'Catering', label: 'Catering Services' }
  ];

  // Load leads function
  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://dialed-in.onrender.com/api/leads', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Loaded ${data.length} total leads from database`);
        setLeads(data);
      } else {
        console.error('Failed to load leads:', response.status);
      }
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update lead status
  const updateLeadStatus = async (leadId, status) => {
    try {
      const response = await fetch(`https://dialed-in.onrender.com/api/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        // Update local state
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === leadId ? { ...lead, status } : lead
          )
        );
      } else {
        console.error('Failed to update lead status:', response.status);
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  // Update lead notes
  const updateLeadNotes = async (leadId, notes) => {
    try {
      const response = await fetch(`https://dialed-in.onrender.com/api/leads/${leadId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        // Update local state
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === leadId ? { ...lead, notes } : lead
          )
        );
      } else {
        console.error('Failed to update lead notes:', response.status);
      }
    } catch (error) {
      console.error('Error updating lead notes:', error);
    }
  };

  // Load leads on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
    }
  }, [isAuthenticated]);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];
    
    // Apply filters
    if (filterCategory) {
      filtered = filtered.filter(lead => lead.category === filterCategory);
    }
    
    if (filterValueTier) {
      filtered = filtered.filter(lead => lead.valueTier === filterValueTier);
    }
    
    if (filterRating) {
      const minRating = parseFloat(filterRating);
      filtered = filtered.filter(lead => lead.rating && lead.rating >= minRating);
    }
    
    if (filterCity) {
      filtered = filtered.filter(lead => lead.city === filterCity);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'valueTier':
          const tierOrder = { 'Premium': 4, 'High': 3, 'Medium': 2, 'Standard': 1 };
          aValue = tierOrder[a.valueTier] || 0;
          bValue = tierOrder[b.valueTier] || 0;
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'status':
          const statusOrder = { 'called': 3, 'unanswered': 2, 'uncalled': 1 };
          aValue = statusOrder[a.status || 'uncalled'] || 1;
          bValue = statusOrder[b.status || 'uncalled'] || 1;
          break;
        default: // name
          aValue = a.name || '';
          bValue = b.name || '';
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return filtered;
  }, [leads, filterCategory, filterValueTier, filterRating, filterCity, sortBy, sortOrder]);

  // Get unique cities from leads for filter dropdown
  const uniqueCities = useMemo(() => {
    const cities = [...new Set(leads.map(lead => lead.city).filter(Boolean))];
    return cities.sort();
  }, [leads]);

  // Download functions
  const downloadCSV = () => {
    if (leads.length === 0) {
      setError('No leads to download');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Rating,Reviews,Address,Phone,Website,Value Score,Value Tier,Contributed By\n" +
      leads.map(lead => 
        `"${lead.name}",${lead.rating},${lead.reviewCount},"${lead.address}","${lead.phone || ''}","${lead.website || ''}",${lead.valueScore},"${lead.valueTier}","${lead.contributedBy}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dialed_in_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess(`Downloaded ${leads.length} leads as CSV`);
  };

  const downloadJSON = () => {
    if (leads.length === 0) {
      setError('No leads to download');
      return;
    }

    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", "dialed_in_leads.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess(`Downloaded ${leads.length} leads as JSON`);
  };

  // Search function
  // Helper functions for multi-selection
  const toggleCitySelection = (cityValue) => {
    setSelectedCities(prev => 
      prev.includes(cityValue) 
        ? prev.filter(c => c !== cityValue)
        : [...prev, cityValue]
    );
  };

  const toggleCategorySelection = (categoryValue) => {
    setSelectedCategories(prev => 
      prev.includes(categoryValue) 
        ? prev.filter(c => c !== categoryValue)
        : [...prev, categoryValue]
    );
  };

  const handleSearch = async () => {
    // Support both single and multi-selection modes
    const citiesToSearch = selectedCities.length > 0 ? selectedCities : (city ? [city] : []);
    const categoriesToSearch = selectedCategories.length > 0 ? selectedCategories : (category ? [category] : []);
    
    if (citiesToSearch.length === 0 || categoriesToSearch.length === 0) {
      setError('Please select at least one city and one category');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSuccess(null);

      // Load API key from localStorage based on user token
      const apiKey = localStorage.getItem(`dialed-in-api-key-${token}`);
      
      const response = await fetch('https://dialed-in.onrender.com/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ 
          cities: citiesToSearch,
          categories: categoriesToSearch,
          maxLeads,
          userApiKey: apiKey
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      const newCount = result.newLeads || result.data.length;
      const totalFound = result.totalFound || result.data.length;
      
      if (newCount === totalFound) {
        setSuccess(`Found ${newCount} new leads!`);
      } else {
        setSuccess(`Found ${newCount} new leads (${totalFound - newCount} were duplicates)`);
      }
      
      // Small delay to ensure database write is complete, then refresh leads
      setTimeout(async () => {
        await loadLeads();
      }, 100);
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Show loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 sm:gap-0">
            <div className="text-center sm:text-left">
              <div className="text-sm text-gray-400">Logged in as:</div>
              <div className="text-lg font-semibold text-white">{userName}</div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded text-sm transition-colors touch-manipulation"
              >
                ⚙️ <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded text-sm transition-colors touch-manipulation"
              >
                <span className="sm:hidden">🚪</span><span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">Dialed-In</h1>
            <p className="text-lg sm:text-xl text-gray-300">Premium Lead Generation System</p>
          </div>
        </header>

        {/* Search Form */}
        <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Multi-Select Cities */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cities (Multi-Select)</label>
              
              {/* Selected Cities Display */}
              {selectedCities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedCities.map(cityValue => {
                    const cityLabel = cityOptions.find(opt => opt.value === cityValue)?.label || cityValue;
                    return (
                      <span key={cityValue} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        {cityLabel}
                        <button 
                          onClick={() => toggleCitySelection(cityValue)}
                          className="hover:bg-blue-700 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* City Selection Dropdown */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !selectedCities.includes(e.target.value)) {
                    toggleCitySelection(e.target.value);
                  }
                }}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 sm:py-2 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base sm:text-sm max-h-48 overflow-y-auto"
              >
                <option value="">Add a city...</option>
                {cityOptions.filter(option => !selectedCities.includes(option.value)).map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Multi-Select Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categories (Multi-Select)</label>
              
              {/* Selected Categories Display */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedCategories.map(categoryValue => {
                    const categoryLabel = categoryOptions.find(opt => opt.value === categoryValue)?.label || categoryValue;
                    return (
                      <span key={categoryValue} className="bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        {categoryLabel}
                        <button 
                          onClick={() => toggleCategorySelection(categoryValue)}
                          className="hover:bg-green-700 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* Category Selection Dropdown */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !selectedCategories.includes(e.target.value)) {
                    toggleCategorySelection(e.target.value);
                  }
                }}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 sm:py-2 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base sm:text-sm max-h-48 overflow-y-auto"
              >
                <option value="">Add a category...</option>
                {categoryOptions.filter(option => !selectedCategories.includes(option.value)).map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Max Leads Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Leads</label>
              <select
                value={maxLeads}
                onChange={(e) => setMaxLeads(parseInt(e.target.value))}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 sm:py-2 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base sm:text-sm"
              >
                <option value={10}>10 leads (~$0.17)</option>
                <option value={25}>25 leads (~$0.43)</option>
                <option value={50}>50 leads (~$0.85)</option>
                <option value={100}>100 leads (~$1.70)</option>
                <option value={200}>200 leads (~$3.40)</option>
                <option value={500}>500 leads (~$8.50)</option>
                <option value={1000}>1000 leads (~$17.00)</option>
                <option value={2000}>2000 leads (~$34.00)</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={handleSearch}
                disabled={searching || (selectedCities.length === 0 && !city) || (selectedCategories.length === 0 && !category)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 sm:py-2 px-4 rounded-lg transition-colors touch-manipulation text-base sm:text-sm"
              >
                {searching ? 'Searching...' : 'Find New Leads'}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-900/80 border border-red-600 text-red-200 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/80 border border-green-600 text-green-200 px-4 py-2 rounded mb-4">
              {success}
            </div>
          )}
        </div>

        {/* Filtering and Sorting Controls */}
        <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-3 gap-4 sm:gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">Filter and Sort Leads</h2>
            {/* Mobile: Stack filters vertically - centered */}
            <div className="flex flex-col gap-3 sm:hidden items-center w-full">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {/* City Filter */}
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base"
              >
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Value Tier Filter */}
              <select
                value={filterValueTier}
                onChange={(e) => setFilterValueTier(e.target.value)}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base"
              >
                <option value="">All Value Tiers</option>
                <option value="Premium">Premium</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Standard">Standard</option>
              </select>

              {/* Rating Filter */}
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base"
              >
                <option value="">All Ratings</option>
                <option value="5">5+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  // Automatically set to descending for Most Recent
                  if (e.target.value === 'createdAt') {
                    setSortOrder('desc');
                  }
                }}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base"
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="valueTier">Sort by Value Tier</option>
                <option value="city">Sort by City</option>
                <option value="createdAt">Sort by Most Recent</option>
                <option value="status">Sort by Status</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex gap-2 flex-wrap w-full">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-36 bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm flex-shrink-0"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {/* City Filter */}
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full sm:w-32 bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm flex-shrink-0"
              >
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Value Tier Filter */}
              <select
                value={filterValueTier}
                onChange={(e) => setFilterValueTier(e.target.value)}
                className="w-full sm:w-36 bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm flex-shrink-0"
              >
                <option value="">All Value Tiers</option>
                <option value="Premium">Premium</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Standard">Standard</option>
              </select>

              {/* Rating Filter */}
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full sm:w-32 bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm flex-shrink-0"
              >
                <option value="">All Ratings</option>
                <option value="5">5+</option>
                <option value="4">4+</option>
                <option value="3">3+</option>
                <option value="2">2+</option>
                <option value="1">1+</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  // Automatically set to descending for Most Recent
                  if (e.target.value === 'createdAt') {
                    setSortOrder('desc');
                  }
                }}
                className="w-full sm:w-32 bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm flex-shrink-0"
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="valueTier">Value Tier</option>
                <option value="city">City</option>
                <option value="createdAt">Most Recent</option>
                <option value="status">Status</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full sm:w-28 bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm flex-shrink-0"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generated Leads Section */}
        <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Generated Leads ({filteredAndSortedLeads.length})</h2>
            {leads.length > 0 && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={downloadCSV}

                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  📊 <span className="hidden sm:inline">Download </span>CSV
                </button>
                <button
                  onClick={downloadJSON}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  📋 <span className="hidden sm:inline">Download </span>JSON
                </button>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading leads...</div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">No leads found. Start by searching for leads above.</div>
            </div>
          ) : filteredAndSortedLeads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">No leads match your current filters. Try adjusting the filters above.</div>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block lg:hidden space-y-4">
                {filteredAndSortedLeads.map((lead, index) => (
                  <div key={lead.id || index} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 space-y-3">
                    {/* Business Name & Address */}
                    <div>
                      <a 
                        href={`https://www.google.com/maps/search/${encodeURIComponent(lead.name + ' ' + lead.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline block mb-1 touch-manipulation"
                      >
                        {lead.name}
                      </a>
                      <div className="text-sm text-white mb-2">{lead.address}</div>
                      <div className="text-sm text-white">{lead.city}</div>
                    </div>
                    
                    {/* Rating & Value */}
                    <div className="flex justify-between items-center">
                      <div>
                        {lead.rating ? (
                          <div className="text-yellow-400 text-sm">★ {lead.rating} ({lead.reviewCount} reviews)</div>
                        ) : (
                          <span className="text-gray-500 text-sm">No rating</span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.valueTier === 'Premium' ? 'bg-purple-700 text-purple-100' :
                        lead.valueTier === 'High' ? 'bg-blue-700 text-blue-100' :
                        lead.valueTier === 'Medium' ? 'bg-green-700 text-green-100' :
                        'bg-gray-700 text-gray-100'
                      }`}>
                        {lead.valueTier || 'Standard'}
                      </span>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex justify-between items-center">
                      <div>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-blue-400 hover:text-blue-300 text-sm block touch-manipulation">
                            📞 {lead.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">📞 No phone</span>
                        )}
                      </div>
                      <div>
                        {lead.website ? (
                          <a 
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 hover:underline text-sm block touch-manipulation"
                          >
                            🌐 Website
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">🌐 No website</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Status & Notes */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Status:</span>
                        <select
                          value={lead.status || 'uncalled'}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className={`px-3 py-1 rounded text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation ${
                            (lead.status || 'uncalled') === 'called' 
                              ? 'bg-green-700 text-green-100' 
                              : (lead.status || 'uncalled') === 'unanswered'
                              ? 'bg-yellow-600 text-yellow-100'
                              : 'bg-orange-700 text-orange-100'
                          }`}
                        >
                          <option value="uncalled">Uncalled</option>
                          <option value="called">Called</option>
                          <option value="unanswered">Unanswered</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Notes:</label>
                        <input
                          type="text"
                          value={lead.notes || ''}
                          onChange={(e) => updateLeadNotes(lead.id, e.target.value)}
                          placeholder="Add notes..."
                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm focus:border-blue-400 focus:outline-none touch-manipulation"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <colgroup>
                    <col className="w-1/4" />
                    <col className="w-1/8" />
                    <col className="w-1/8" />
                    <col className="w-1/8" />
                    <col className="w-1/8" />
                    <col className="w-1/8" />
                    <col className="w-1/8" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="px-4 py-3 text-gray-300 font-semibold">Business</th>
                      <th className="px-4 py-3 text-gray-300 font-semibold">Rating</th>
                      <th className="px-4 py-3 text-gray-300 font-semibold">Value</th>
                      <th className="px-4 py-3 text-gray-300 font-semibold">Phone</th>
                      <th className="px-4 py-3 text-gray-300 font-semibold">Website</th>
                      <th className="px-4 py-3 text-gray-300 font-semibold">City</th>
                      <th className="px-4 py-3 text-gray-300 font-semibold">Status</th>
                      <th className="px-4 py-3 text-gray-300 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedLeads.map((lead, index) => (
                      <tr key={lead.id || index} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            <a 
                              href={`https://www.google.com/maps/search/${encodeURIComponent(lead.name + ' ' + lead.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                            >
                              {lead.name}
                            </a>
                          </div>
                          <div className="text-sm" style={{color: '#ffffff'}}>{lead.address}</div>
                        </td>
                        <td className="px-4 py-3">
                          {lead.rating ? (
                            <div>
                              <div className="text-yellow-400">★ {lead.rating}</div>
                              <div className="text-xs text-gray-400">({lead.reviewCount} reviews)</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">No rating</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            lead.valueTier === 'Premium' ? 'bg-purple-700 text-purple-100' :
                            lead.valueTier === 'High' ? 'bg-blue-700 text-blue-100' :
                            lead.valueTier === 'Medium' ? 'bg-green-700 text-green-100' :
                            'bg-gray-700 text-gray-100'
                          }`}>
                            {lead.valueTier || 'Standard'} ({lead.valueScore || 0})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {lead.phone ? (
                            <a href={`tel:${lead.phone}`} className="text-blue-400 hover:text-blue-300 whitespace-nowrap">
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-gray-500 whitespace-nowrap">No phone</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.website ? (
                            <a 
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              🌐 Website
                            </a>
                          ) : (
                            <span className="text-gray-500 whitespace-nowrap">No website</span>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{color: '#ffffff'}}>{lead.city}</td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.status || 'uncalled'}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                              (lead.status || 'uncalled') === 'called' 
                                ? 'bg-green-700 text-green-100' 
                                : (lead.status || 'uncalled') === 'unanswered'
                                ? 'bg-yellow-600 text-yellow-100'
                                : 'bg-orange-700 text-orange-100'
                            }`}
                          >
                            <option value="uncalled">Uncalled</option>
                            <option value="called">Called</option>
                            <option value="unanswered">Unanswered</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={lead.notes || ''}
                            onChange={(e) => updateLeadNotes(lead.id, e.target.value)}
                            placeholder="Add notes..."
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs focus:border-blue-400 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Settings Modal */}
      {showSettings && (
        <UserSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
