import React from 'react';

function LeadFilters({ filters, setFilters, filterOptions, onSortChange }) {
  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSortChange = (e) => {
    onSortChange(e.target.name, e.target.value);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-3 gap-4 sm:gap-2">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="sortBy" className="text-sm font-medium text-gray-300">Sort By:</label>
          <select id="sortBy" name="sortBy" value={filters.sortBy} onChange={handleSortChange} className="bg-slate-700 border-slate-600 rounded p-1 text-sm">
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            <option value="valueTier">Value Tier</option>
            <option value="city">City</option>
            <option value="createdAt">Date Added</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sortOrder" className="text-sm font-medium text-gray-300">Order:</label>
          <select id="sortOrder" name="sortOrder" value={filters.sortOrder} onChange={handleSortChange} className="bg-slate-700 border-slate-600 rounded p-1 text-sm">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        <select name="filterCity" value={filters.filterCity} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm">
          <option value="">All Cities</option>
          {filterOptions.cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <select name="filterCategory" value={filters.filterCategory} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm">
          <option value="">All Categories</option>
          {filterOptions.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)} 
        </select>
        <select name="filterValueTier" value={filters.filterValueTier} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm">
          <option value="">All Value Tiers</option>
          <option value="Premium">Premium</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Standard">Standard</option>
        </select>
        <select name="filterStatus" value={filters.filterStatus} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm">
          <option value="">All Statuses</option>
          <option value="uncalled">Uncalled</option>
          <option value="called">Called</option>
          <option value="unanswered">Unanswered</option>
        </select>
        <select name="filterRating" value={filters.filterRating} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm">
          <option value="">All Ratings</option>
          <option value="4.5">4.5+</option>
          <option value="4">4+</option>
          <option value="3">3+</option>
          <option value="2">2+</option>
        </select>
      </div>
    </div>
  );
}

export default LeadFilters;
