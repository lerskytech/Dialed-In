import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import UserSettings from './UserSettings';

function App() {
  const { isAuthenticated, loading: authLoading, getAuthHeaders, logout, userName, token } = useAuth();

  // All hooks must be declared before any conditional returns
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
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
    { value: 'Atlanta, GA', label: 'Atlanta, GA' },
    { value: 'Houston, TX', label: 'Houston, TX' },
    { value: 'Dallas, TX', label: 'Dallas, TX' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'HVAC', label: 'HVAC & Air Conditioning' },
    { value: 'Plumbing', label: 'Plumbing Services' },
    { value: 'Electrical', label: 'Electrical Services' },
    { value: 'Roofing', label: 'Roofing & Repair' },
    { value: 'Restaurant', label: 'Restaurants' },
    { value: 'Retail', label: 'Retail Stores' }
  ];

  // Load leads function
  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads', {
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

  // Load leads on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
    }
  }, [isAuthenticated]);

  // Download functions
  const downloadCSV = () => {
    if (leads.length === 0) {
      setError('No leads to download');
      return;
    }

    const headers = ['Business Name', 'Rating', 'Review Count', 'Value Tier', 'Value Score', 'Phone', 'Address', 'City', 'Category', 'Website', 'Found By', 'Date Added'];
    
    const csvData = leads.map(lead => [
      lead.name || '',
      lead.rating || '',
      lead.reviewCount || '',
      lead.valueTier || 'Standard',
      lead.valueScore || 0,
      lead.phone || '',
      lead.address || '',
      lead.city || '',
      lead.category || '',
      lead.website || '',
      lead.contributedBy || 'Unknown',
      lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dialed-in-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setSuccess(`Downloaded ${leads.length} leads as CSV`);
  };

  const downloadJSON = () => {
    if (leads.length === 0) {
      setError('No leads to download');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalLeads: leads.length,
      exportedBy: userName,
      leads: leads.map(lead => ({
        businessName: lead.name,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        valueTier: lead.valueTier || 'Standard',
        valueScore: lead.valueScore || 0,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        category: lead.category,
        website: lead.website,
        foundBy: lead.contributedBy,
        dateAdded: lead.createdAt
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dialed-in-leads-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    setSuccess(`Downloaded ${leads.length} leads as JSON`);
  };

  // Search function
  const handleSearch = async () => {
    if (!city || !category) {
      setError('Please select both city and category');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSuccess(null);

      const userApiKey = localStorage.getItem(`dialed-in-api-key-${token}`);
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ 
          city, 
          category,
          maxLeads,
          userApiKey
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
        <header className="text-center mb-12">
          <div className="flex justify-between items-center mb-4">
            <div className="text-left">
              <div className="text-sm text-gray-400">Logged in as:</div>
              <div className="text-lg font-semibold text-white">{userName}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Dialed-In</h1>
            <p className="text-xl text-gray-300">Premium Lead Generation System</p>
          </div>
        </header>

        {/* Search Form */}
        <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

            {/* Max Leads Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Leads</label>
              <select
                value={maxLeads}
                onChange={(e) => setMaxLeads(parseInt(e.target.value))}
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value={10}>10 leads (~$0.17)</option>
                <option value={25}>25 leads (~$0.43)</option>
                <option value={50}>50 leads (~$0.85)</option>
                <option value={100}>100 leads (~$1.70)</option>
                <option value={200}>200 leads (~$3.40)</option>
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

        {/* Leads Display */}
        <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              Generated Leads ({leads.length})
            </h2>
            {leads.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={downloadCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  📊 Download CSV
                </button>
                <button
                  onClick={downloadJSON}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  📋 Download JSON
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="px-4 py-3 text-gray-300 font-semibold">Business</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Rating</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Value</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Phone</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Website</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">City</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Found by</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                          <a href={`tel:${lead.phone}`} className="text-blue-400 hover:text-blue-300">
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500">No phone</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.website ? (
                          <a 
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 hover:underline inline-flex items-center gap-1"
                          >
                            🌐 Website
                          </a>
                        ) : (
                          <span className="text-gray-500">No website</span>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{color: '#ffffff'}}>{lead.city}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.contributedBy === 'Skyler' ? 'bg-blue-700 text-blue-100' :
                          lead.contributedBy === 'Eden' ? 'bg-green-700 text-green-100' :
                          'bg-gray-700 text-gray-100'
                        }`}>
                          {lead.contributedBy || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
