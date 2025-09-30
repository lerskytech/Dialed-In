import React, { useState } from 'react';
import Papa from 'papaparse';

const Sidebar = ({ onScrape, leads, selectedLeads }) => {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (city && category) {
      setIsScanning(true);
      setScanError(null);
      try {
        await onScrape(city, category);
      } catch (error) {
        console.error('Scanning failed in Sidebar:', error);
        setScanError(error.response?.data?.message || 'An unexpected error occurred. Please try again.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleExport = () => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : leads;
    if (dataToExport.length === 0) {
      alert('No leads to export.');
      return;
    }
    const csv = Papa.unparse(dataToExport);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <aside className="w-full md:w-72 bg-white dark:bg-gray-800 p-4 space-y-6 rounded-lg shadow-md flex-shrink-0">
      <h2 className="text-xl font-bold">Actions</h2>

      <button
        onClick={handleExport}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-green-400 disabled:cursor-not-allowed transition duration-300"
        disabled={leads.length === 0}
      >
        Export Leads
      </button>

      <hr className="dark:border-gray-600"/>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-4">Lead Scanner</h2>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., San Francisco"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Category</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Restaurants"
            required
          />
        </div>

        {scanError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Scan Failed</p>
              <p className="text-sm">{scanError}</p>
            </div>
        )}

        <button 
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-300"
          disabled={isScanning}
        >
          {isScanning ? 'Scanning...' : 'Scan for Leads'}
        </button>
      </form>
    </aside>
  );
};

export default Sidebar;
