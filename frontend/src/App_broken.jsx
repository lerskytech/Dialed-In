import React, { useState, useEffect, useMemo } from 'react';

function App() {
  // Form state
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');

  // Data and UI state
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  // Filtering state
  const [filters, setFilters] = useState({
    valueTier: 'all',
    category: 'all',
    city: 'all',
    status: 'all',
    searchText: ''
  });
  const [viewMode, setViewMode] = useState('all');
  const [filterTerm, setFilterTerm] = useState("");

  // Sorting state
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(10);

  // City options
  const cityOptions = [
    { value: 'Miami, FL', label: 'Miami, FL' },
    { value: 'Orlando, FL', label: 'Orlando, FL' },
    { value: 'Tampa, FL', label: 'Tampa, FL' },
    { value: 'Jacksonville, FL', label: 'Jacksonville, FL' },
    { value: 'Atlanta, GA', label: 'Atlanta, GA' },
    { value: 'Charlotte, NC', label: 'Charlotte, NC' },
    { value: 'Nashville, TN', label: 'Nashville, TN' },
    { value: 'Austin, TX', label: 'Austin, TX' },
    { value: 'Houston, TX', label: 'Houston, TX' },
    { value: 'Dallas, TX', label: 'Dallas, TX' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'HVAC', label: 'HVAC & Air Conditioning' },
    { value: 'Plumbing', label: 'Plumbing Services' },
    { value: 'Electrical', label: 'Electrical Services' },
    { value: 'Roofing', label: 'Roofing & Gutters' },
    { value: 'Landscaping', label: 'Landscaping & Lawn Care' },
    { value: 'Cleaning', label: 'Cleaning Services' },
    { value: 'Pest Control', label: 'Pest Control' },
    { value: 'Security', label: 'Security Systems' }
  ];

  // Load leads from backend
  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3001/api/leads');
      
      if (!response.ok) {
        throw new Error('Failed to load leads');
      }
      
      const data = await response.json();
      setLeads(data);
      setDemoMode(false);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Could not connect to backend. Using demo mode.');
      setDemoMode(true);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // Load leads on component mount
  useEffect(() => {
    loadLeads();
  }, []);

  // Search for new leads
  const handleSearch = async () => {
    if (!city || !category) {
      setError('Please select both city and category');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, category })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      setSuccess(`Found ${result.data.length} new leads!`);
      
      // Reload leads to show new results
      await loadLeads();
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Apply filters and pagination
  const { paginatedLeads, totalPages } = useMemo(() => {
    // First apply the old filter term
    const filtered = leads.filter(lead =>
      lead.name?.toLowerCase().includes(filterTerm.toLowerCase()) ||
      lead.city?.toLowerCase().includes(filterTerm.toLowerCase()) ||
      lead.category?.toLowerCase().includes(filterTerm.toLowerCase())
    );

    // Then apply new filters
    const filteredLeads = filtered.filter(lead => {
      // Value tier filter
      if (filters.valueTier !== 'all' && lead.valueTier !== filters.valueTier) return false;
      
      // Category filter
      if (filters.category !== 'all' && lead.category !== filters.category) return false;
      
      // City filter
      if (filters.city !== 'all' && lead.city !== filters.city) return false;
      
      // Status filter
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      
      // Search text filter
      if (filters.searchText && !lead.name.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
      
      // View mode filter
      if (viewMode !== 'all') {
        const tierMapping = {
          'premium': 'Premium',
          'high': 'High', 
          'medium': 'Medium',
          'standard': 'Standard'
        };
        if (lead.valueTier !== tierMapping[viewMode] && !(viewMode === 'standard' && !lead.valueTier)) return false;
      }
      
      return true;
    });

    // Sort
    const sorted = [...filteredLeads].sort((a, b) => {
      const valA = a[sortKey] || '';
      const valB = b[sortKey] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const pages = Math.ceil(sorted.length / leadsPerPage);
    const startIndex = (currentPage - 1) * leadsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + leadsPerPage);

    return { paginatedLeads: paginated, totalPages: pages };
  }, [leads, filterTerm, sortKey, sortOrder, currentPage, leadsPerPage, filters, viewMode]);

  // Metrics
  const totalLeads = leads.length;
  const notCalled = leads.filter(l => l.status !== 'called').length;
  const interested = leads.filter(l => l.status === 'interested').length;
  const converted = leads.filter(l => l.status === 'converted').length;

  // Handle status change
  const handleStatusChange = (leadId, newStatus) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
  };

  // Handle delete lead
  const handleDeleteLead = (leadId) => {
    setLeads(leads.filter(lead => lead.id !== leadId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Dialed-In</h1>
            <p className="text-xl text-gray-300 mb-6">
              Premium lead generation with value-based ranking.<br />
              Find the highest-value prospects in your market.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <div className="bg-blue-800/80 rounded-xl px-6 py-4 shadow-lg text-center">
              <div className="text-2xl font-bold">{totalLeads}</div>
              <div className="uppercase text-xs tracking-widest text-blue-200">TOTAL LEADS</div>
            </div>
            <div className="bg-orange-800/80 rounded-xl px-6 py-4 shadow-lg text-center">
              <div className="text-2xl font-bold">{notCalled}</div>
              <div className="uppercase text-xs tracking-widest text-orange-200">NOT CALLED</div>
            </div>
            <div className="bg-green-800/80 rounded-xl px-6 py-4 shadow-lg text-center">
              <div className="text-2xl font-bold">{interested}</div>
              <div className="uppercase text-xs tracking-widest text-green-200">INTERESTED</div>
            </div>
            <div className="bg-purple-800/80 rounded-xl px-6 py-4 shadow-lg text-center">
              <div className="text-2xl font-bold">{converted}</div>
              <div className="uppercase text-xs tracking-widest text-purple-200">CONVERTED</div>
            </div>
          </div>
          
          {/* Value Tier Summary - Clickable for Filtering */}
          {leads.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <button 
                onClick={() => setViewMode(viewMode === 'premium' ? 'all' : 'premium')}
                className={`rounded-lg px-4 py-3 shadow-lg text-center transition-all hover:scale-105 ${
                  viewMode === 'premium' ? 'bg-purple-700 ring-2 ring-purple-400' : 'bg-purple-900/80 hover:bg-purple-800'
                }`}
              >
                <div className="text-lg font-bold">{leads.filter(l => l.valueTier === 'Premium').length}</div>
                <div className="text-xs text-purple-200">PREMIUM (80+)</div>
              </button>
              <button 
                onClick={() => setViewMode(viewMode === 'high' ? 'all' : 'high')}
                className={`rounded-lg px-4 py-3 shadow-lg text-center transition-all hover:scale-105 ${
                  viewMode === 'high' ? 'bg-blue-700 ring-2 ring-blue-400' : 'bg-blue-900/80 hover:bg-blue-800'
                }`}
              >
                <div className="text-lg font-bold">{leads.filter(l => l.valueTier === 'High').length}</div>
                <div className="text-xs text-blue-200">HIGH (60-79)</div>
              </button>
              <button 
                onClick={() => setViewMode(viewMode === 'medium' ? 'all' : 'medium')}
                className={`rounded-lg px-4 py-3 shadow-lg text-center transition-all hover:scale-105 ${
                  viewMode === 'medium' ? 'bg-green-700 ring-2 ring-green-400' : 'bg-green-900/80 hover:bg-green-800'
                }`}
              >
                <div className="text-lg font-bold">{leads.filter(l => l.valueTier === 'Medium').length}</div>
                <div className="text-xs text-green-200">MEDIUM (40-59)</div>
              </button>
              <button 
                onClick={() => setViewMode(viewMode === 'standard' ? 'all' : 'standard')}
                className={`rounded-lg px-4 py-3 shadow-lg text-center transition-all hover:scale-105 ${
                  viewMode === 'standard' ? 'bg-gray-700 ring-2 ring-gray-400' : 'bg-gray-900/80 hover:bg-gray-800'
                }`}
              >
                <div className="text-lg font-bold">{leads.filter(l => l.valueTier === 'Standard' || !l.valueTier).length}</div>
                <div className="text-xs text-gray-200">STANDARD (&lt;40)</div>
              </button>
            </div>
          )}
          
          {/* Advanced Filters */}
          {leads.length > 0 && (
            <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <h3 className="text-sm font-semibold text-gray-300 mr-2">FILTER & ORGANIZE:</h3>
                
                {/* Search Text */}
                <input
                  type="text"
                  placeholder="Search by business name..."
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                  className="bg-slate-700 border border-slate-500 rounded px-3 py-1 text-sm text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
                
                {/* Category Filter */}
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="bg-slate-700 border border-slate-500 rounded px-3 py-1 text-sm text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {[...new Set(leads.map(l => l.category))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                {/* City Filter */}
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  className="bg-slate-700 border border-slate-500 rounded px-3 py-1 text-sm text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="all">All Cities</option>
                  {[...new Set(leads.map(l => l.city))].map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                
                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="bg-slate-700 border border-slate-500 rounded px-3 py-1 text-sm text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="Not Called">Not Called</option>
                  <option value="Interested">Interested</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Converted">Converted</option>
                </select>
                
                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setFilters({valueTier: 'all', category: 'all', city: 'all', status: 'all', searchText: ''});
                    setViewMode('all');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Clear All
                </button>
                
                {/* Results Count */}
                <div className="text-sm text-gray-400 ml-auto">
                  Showing {paginatedLeads.length} of {leads.length} leads
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Search Form */}
        <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* City Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="">Select a city...</option>
                {cityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="">Select a category...</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={searching || !city || !category}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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

        {/* Leads Table */}
        {leads.length > 0 && (
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Business Name</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Value Score</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Tier</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Rating</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Reviews</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Phone</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Category</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">City</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-200">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-800 transition">
                      <td className="px-4 py-2 font-semibold">{lead.name}</td>
                      <td className="px-4 py-2">
                        <span className="text-lg font-bold text-blue-400">{lead.valueScore || 0}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          lead.valueTier === 'Premium' ? 'bg-purple-700 text-purple-100' :
                          lead.valueTier === 'High' ? 'bg-blue-700 text-blue-100' :
                          lead.valueTier === 'Medium' ? 'bg-green-700 text-green-100' :
                          'bg-gray-700 text-gray-100'
                        }`}>
                          {lead.valueTier || 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-yellow-400">★ {lead.rating || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-400">{lead.reviewCount ? `${lead.reviewCount} reviews` : 'No reviews'}</span>
                      </td>
                      <td className="px-4 py-2">{lead.phone || '-'}</td>
                      <td className="px-4 py-2">{lead.category}</td>
                      <td className="px-4 py-2">{lead.city}</td>
                      <td className="px-4 py-2 flex gap-2">
                        {lead.phone && (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs mr-2"
                            onClick={() => window.open(`tel:${lead.phone.replace(/[^\d]/g, '')}`)}
                          >
                            Call
                          </button>
                        )}
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                          onClick={() => handleDeleteLead(lead.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-slate-700 px-4 py-3 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 text-white px-3 py-1 rounded text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 text-white px-3 py-1 rounded text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {leads.length === 0 && !loading && (
          <div className="bg-blue-900/80 border border-blue-600 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Welcome to Dialed-In!</h2>
            <p className="mb-2">Start by selecting a city and category above, then click <span className="font-semibold text-blue-300">Find New Leads</span> to discover prospects in your market.</p>
            <p className="text-sm text-blue-200">Try <span className="font-mono">Miami, FL</span> and <span className="font-mono">HVAC</span> to see sample results.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
