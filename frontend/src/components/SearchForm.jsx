import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useAuth } from '../AuthContext';

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

const selectStyles = {
  control: (base) => ({ ...base, backgroundColor: '#334155', borderColor: '#475569', boxShadow: 'none', '&:hover': { borderColor: '#475569' } }),
  menu: (base) => ({ ...base, backgroundColor: '#334155' }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, { isFocused, isSelected }) => ({ ...base, backgroundColor: isSelected ? '#16a34a' : isFocused ? '#475569' : '#334155', color: 'white', '&:active': { backgroundColor: '#15803d' } }),
  multiValue: (base) => ({ ...base, backgroundColor: '#16a34a' }),
  multiValueLabel: (base) => ({ ...base, color: 'white' }),
  input: (base) => ({ ...base, color: 'white' }),
  singleValue: (base) => ({ ...base, color: 'white' }),
};

function SearchForm({ onSearchComplete, setTotalCost }) {
  const { getAuthHeaders, token } = useAuth();
  const [states, setStates] = useState([]);
  const [counties, setCounties] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxLeads, setMaxLeads] = useState(25);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('/api/locations/states', {
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        setStates(data);
      } catch (err) {
        setError('Failed to load states.');
      }
    };
    if (token) {
      fetchStates();
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
    const fetchCounties = async () => {
      if (!selectedState) return;
      try {
        const response = await fetch(`/api/locations/counties?state=${selectedState}`, {
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        setCounties(data);
      } catch (err) {
        setError('Failed to load counties.');
      }
    };
    fetchCounties();
  }, [selectedState, getAuthHeaders]);

  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedCounty) return;
      try {
        const response = await fetch(`/api/locations/cities?county=${selectedCounty}`, {
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        setCities(data);
      } catch (err) {
        setError('Failed to load cities.');
      }
    };
    fetchCities();
  }, [selectedCounty, getAuthHeaders]);

  const handleSearch = async () => {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      return setError('Please save your API key before searching.');
    }
    const categoriesToSearch = selectedCategories.map(c => c.value);
    if (!selectedCity || categoriesToSearch.length === 0) return setError('Please select a city and at least one category');
    try {
      setSearching(true); setError(null); setSuccess(null);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ cities: [selectedCity], categories: categoriesToSearch, maxLeads, apiKey })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Search failed. Please check your settings.');
      }
      const newCount = result.newLeads || result.data.length;
      const totalFound = result.totalFound || result.data.length;
      setSuccess(newCount === totalFound ? `Found ${newCount} new leads!` : `Found ${newCount} new leads (${totalFound - newCount} were duplicates)`);
      const cost = (totalFound / 1000) * 17; // $17 per 1000 results
      setTotalCost(prevCost => prevCost + cost);
      onSearchComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
          <select onChange={(e) => setSelectedState(e.target.value)} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
            <option value="">Select State</option>
            {states.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">County</label>
          <select onChange={(e) => setSelectedCounty(e.target.value)} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
            <option value="">Select County</option>
            {counties.map(county => <option key={county} value={county}>{county}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
          <select onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none">
            <option value="">Select City</option>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Categories (Multi-Select)</label>
          <Select
            isMulti
            options={categoryOptions}
            value={selectedCategories}
            onChange={setSelectedCategories}
            className="w-full text-sm"
            classNamePrefix="react-select"
            placeholder="Select categories..."
            menuPortalTarget={document.body}
            styles={selectStyles}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Leads</label>
          <select value={maxLeads} onChange={(e) => setMaxLeads(parseInt(e.target.value))} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 sm:py-2 text-white focus:border-blue-400 focus:outline-none touch-manipulation text-base sm:text-sm">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={2000}>2000</option>
          </select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <button onClick={handleSearch} disabled={searching || !selectedCity || selectedCategories.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 sm:py-2 px-4 rounded-lg transition-colors touch-manipulation text-base sm:text-sm">
            {searching ? 'Searching...' : 'Find New Leads'}
          </button>
        </div>
      </div>
      {error && <div className="bg-red-900/80 border border-red-600 text-red-200 px-4 py-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-900/80 border border-green-600 text-green-200 px-4 py-2 rounded mb-4">{success}</div>}
    </div>
  );
}

export default SearchForm;
