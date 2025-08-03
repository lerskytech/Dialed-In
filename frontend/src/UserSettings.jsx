import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserSettings = ({ onClose }) => {
  const { token } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing API key for this user
    const savedApiKey = localStorage.getItem(`4aivr-api-key-${token}`);
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, [token]);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!apiKey.trim()) {
      setError('Please enter a valid Google Places API key');
      setLoading(false);
      return;
    }

    // Basic API key format validation
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      setError('Invalid API key format. Google Places API keys start with "AIza" and are longer.');
      setLoading(false);
      return;
    }

    // Save API key for this user
    localStorage.setItem(`4aivr-api-key-${token}`, apiKey);
    setSuccess('API key saved successfully! You can now search for leads using your own Google Places quota.');
    setLoading(false);
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Test the API key with a simple search
      const response = await fetch('http://localhost:3002/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('✅ API key is valid and working!');
      } else {
        setError(`❌ API key test failed: ${result.error}`);
      }
    } catch (err) {
      setError('❌ Could not test API key. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 sm:p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">User Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl p-2 touch-manipulation"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Google Places API Key</h3>
            <p className="text-sm text-gray-300 mb-4">
              Enter your own Google Places API key to use your own quota and billing. 
              This keeps your usage separate from other users.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-3 sm:py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none touch-manipulation text-base sm:text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-900/80 border border-red-600 text-red-200 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-900/80 border border-green-600 text-green-200 px-4 py-2 rounded text-sm">
                  {success}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-base sm:text-sm font-medium"
                >
                  {loading ? 'Saving...' : 'Save API Key'}
                </button>
                
                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={loading || !apiKey.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-base sm:text-sm font-medium"
                >
                  Test API Key
                </button>
              </div>
            </form>
          </div>

          <div className="bg-blue-900/50 border border-blue-600 rounded p-4">
            <h4 className="text-sm font-semibold text-blue-200 mb-2">How to get your Google Places API Key:</h4>
            <ol className="text-xs text-blue-300 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the "Places API (New)" service</li>
              <li>Go to "Credentials" and create an API key</li>
              <li>Enable billing on your project (required for Places API)</li>
              <li>Copy your API key and paste it above</li>
            </ol>
          </div>

          <div className="bg-yellow-900/50 border border-yellow-600 rounded p-4">
            <h4 className="text-sm font-semibold text-yellow-200 mb-2">Important Notes:</h4>
            <ul className="text-xs text-yellow-300 space-y-1 list-disc list-inside">
              <li>Your API key is stored locally and only used for your searches</li>
              <li>Each user pays for their own Google Places API usage</li>
              <li>API keys are never shared between users</li>
              <li>You can update your API key anytime in these settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
