import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import LeadFilters from './components/LeadFilters';
import LeadsTable from './components/LeadsTable';
import Pagination from './components/Pagination';

import { useAuth } from './AuthContext';

function Dashboard({ setTotalCost }) {
  const { getAuthHeaders, token } = useAuth();

    const [filters, setFilters] = useState({
    filterCategory: '',
    filterValueTier: '',
    filterRating: '',
    filterCity: '',
    filterStatus: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
    const [leads, setLeads] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [totalCost, setLocalTotalCost] = useState(0);
  const [filterOptions, setFilterOptions] = useState({ cities: [], categories: [] });

  useEffect(() => {
    // This effect runs when the component mounts and whenever the token changes.
    // It ensures that data is only loaded when the user is properly authenticated.
    if (token) { // Only run if the token is available
      const fetchFilterOptions = async () => {
        try {
          setError(null); // Clear previous errors
          const response = await fetch('http://localhost:3001/api/leads/meta', { headers: getAuthHeaders() });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to load filter options');
          }
          setFilterOptions(await response.json());
        } catch (err) {
          setError(err.message);
        }
      };
      fetchFilterOptions();
    }
  }, [token, getAuthHeaders]); // Depend on token and getAuthHeaders

  const loadLeads = async () => {
            const params = new URLSearchParams({ ...filters, page: currentPage });

    for (const [key, value] of params.entries()) {
      if (!value) {
        params.delete(key);
      }
    }
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/leads?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load leads');
      }
            const data = await response.json();
      setLeads(data.leads);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId, status) => {
    try {
      const response = await fetch(`http://localhost:3001/api/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...lead, status } : lead));
      } else {
        console.error('Failed to update lead status:', response.status);
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const updateLeadNotes = async (leadId, notes) => {
    try {
      const response = await fetch(`http://localhost:3001/api/leads/${leadId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ notes })
      });
      if (response.ok) {
        setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...lead, notes } : lead));
      } else {
        console.error('Failed to update lead notes:', response.status);
      }
    } catch (error) {
      console.error('Error updating lead notes:', error);
    }
  };

      useEffect(() => {
    if (token) {
      loadLeads();
    }
  }, [filters, currentPage, token, getAuthHeaders]);

  const handleSortChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredAndSortedLeads = leads;

  
  const downloadCSV = () => {
    if (leads.length === 0) return setError('No leads to download');
    const csvContent = "data:text/csv;charset=utf-8," + "Name,Rating,Reviews,Address,Phone,Email,Website,Value Score,Value Tier,Status,Notes,Contributed By\n" + leads.map(l => `\"${l.name}\",${l.rating},${l.reviewCount},\"${l.address}\",\"${l.phone || ''}\",\"${l.email || ''}\",\"${l.website || ''}\",${l.valueScore},\"${l.valueTier}\",\"${l.status || 'uncalled'}\",\"${l.notes || ''}\",\"${l.contributedBy}\"`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "spreeleads_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(`Downloaded ${leads.length} leads as CSV`);
  };

  const clearAllLeads = async () => {
    if (!window.confirm('Are you sure you want to delete all leads? This cannot be undone.')) return;
    try {
      const response = await fetch('http://localhost:3001/api/leads/clear', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setLeads([]);
        setSuccess('All leads have been deleted.');
      } else {
        setError('Failed to delete leads.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }
  };

  const downloadJSON = () => {
    if (leads.length === 0) return setError('No leads to download');
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", "spreeleads_leads.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(`Downloaded ${leads.length} leads as JSON`);
  };

  
  

  return (
    <main className="container mx-auto px-4 py-8">
      <SearchForm onSearchComplete={loadLeads} setTotalCost={setTotalCost} />

      <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-3 gap-4 sm:gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-white">Filtered Leads ({leads.length})</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={downloadCSV} className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg text-sm">Download CSV</button>
            <button onClick={downloadJSON} className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg text-sm">Download JSON</button>
            <button onClick={clearAllLeads} className="bg-red-800 hover:bg-red-900 text-white font-medium py-2 px-4 rounded-lg text-sm">Clear All Leads</button>
          </div>
        </div>
        <LeadFilters filters={filters} setFilters={setFilters} filterOptions={filterOptions} onSortChange={handleSortChange} />
        <LeadsTable leads={filteredAndSortedLeads} loading={loading} onUpdateStatus={updateLeadStatus} onUpdateNotes={updateLeadNotes} />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </main>
  );
}

export default Dashboard;
