import { useState } from 'react';

function AIAgentPanel({ selectedLead }) {
  const [isLoading, setIsLoading] = useState(false);
  const [callResult, setCallResult] = useState(null);

  const handleInitiateCall = async () => {
    if (!selectedLead) return;

    setIsLoading(true);
    setCallResult(null);

    try {
      const response = await fetch('/api/agent/start-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: selectedLead.phone, 
          leadData: selectedLead 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to initiate call.');
      }

      setCallResult({ success: true, message: result.message });
    } catch (error) {
      setCallResult({ success: false, message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedLead) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-bold text-white mb-2">AI Agent Control</h3>
        <p className="text-gray-400">Select a lead to enable AI actions.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-bold text-white mb-2">AI Agent Control</h3>
      <p className="text-gray-300 mb-4">Selected Lead: <span className="font-semibold text-cyan-400">{selectedLead.name}</span></p>
      <button
        onClick={handleInitiateCall}
        disabled={isLoading}
        className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 disabled:bg-gray-600 transition-colors duration-300"
      >
        {isLoading ? 'Initiating...' : 'Initiate AI Call'}
      </button>
      {callResult && (
        <div className={`mt-4 p-3 rounded-lg ${callResult.success ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          <p>{callResult.message}</p>
        </div>
      )}
    </div>
  );
}

export default AIAgentPanel;
