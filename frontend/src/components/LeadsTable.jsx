import React from 'react';

function LeadsTable({ leads, loading, onUpdateStatus, onUpdateNotes }) {
  if (loading) {
    return <div className="text-center py-4">Loading leads...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700 table-fixed">
        <thead className="bg-slate-800">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6 w-1/4">Name</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white w-1/12">Rating</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white w-1/12">Value Tier</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white w-1/6">City</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white w-1/6">Phone / Website</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white w-1/6">Status</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white w-1/6">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6 break-words">
                <a href={`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${lead.googlePlaceId}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                  {lead.name}
                </a>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{lead.rating}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{lead.valueTier || 'Standard'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{lead.city}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                {lead.phone && <div><a href={`tel:${lead.phone}`} className="text-blue-400 hover:text-blue-300">{lead.phone}</a></div>}
                {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Website</a>}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                <select 
                  value={lead.status || 'uncalled'}
                  onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                  className="bg-slate-700 border-slate-600 rounded p-1 text-sm w-full"
                >
                  <option value="uncalled">Uncalled</option>
                  <option value="called">Called</option>
                  <option value="unanswered">Unanswered</option>
                </select>
              </td>
              <td className="px-3 py-4 text-sm text-gray-300">
                <textarea 
                  defaultValue={lead.notes || ''} 
                  onBlur={(e) => onUpdateNotes(lead.id, e.target.value)} 
                  className="w-full bg-slate-700 border-slate-600 rounded p-1 text-sm"
                  rows={1}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeadsTable;
