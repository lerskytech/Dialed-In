import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserSettings = ({ onClose }) => {
  const { getAuthHeaders } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/user', {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          if (data.api_key) {
            setApiKey(data.api_key);
          }
        } else {
          setError('Failed to load user data.');
        }
      } catch (err) {
        setError('Could not connect to the server.');
      }
    };

    fetchUserData();
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        setError('Failed to start the upgrade process.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    }
    setLoading(false);
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!apiKey.trim()) {
      setError('Please enter a valid Google Places API key');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/user/api-key', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        setSuccess('API key saved successfully!');
      } else {
        setError('Failed to save API key.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    }
    setLoading(false);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-full max-w-lg mx-auto my-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">User Settings</h2>
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg text-sm"
          >
            Close
          </button>
        </div>

        {userData && (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="text-md font-semibold text-white mb-2">Subscription Details</h3>
            <p className="text-sm text-gray-300">Plan: <span className="font-bold capitalize">{userData.subscription_tier}</span></p>
            <p className="text-sm text-gray-300">Monthly Usage: <span className="font-bold">{userData.api_usage} / {userData.monthly_limit}</span> leads</p>
            <div className="w-full bg-gray-600 rounded-full h-2.5 mt-2">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(userData.api_usage / userData.monthly_limit) * 100}%` }}></div>
            </div>
            {userData.subscription_tier === 'free' && (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Redirecting...' : 'Upgrade to Pro (5,000 leads/month for $59.99)'}
              </button>
            )}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Cost Tracking (Estimate)</h3>
            <div className="p-4 bg-slate-700 rounded-lg space-y-3">
              <p className="text-sm text-gray-300">The Places API (New) has a cost associated with each lead found. We estimate this to be around <span className="font-bold text-white">$0.03 per lead</span>.</p>
              {userData && (
                <div>
                  <p className="text-sm text-gray-300">Your estimated usage cost this month:</p>
                  <p className="text-2xl font-bold text-white">${(userData.api_usage * 0.03).toFixed(2)}</p>
                </div>
              )}
              <div className="bg-green-900/50 border border-green-600 rounded p-3">
                <h4 className="text-sm font-semibold text-green-200 mb-1">Take Advantage of Google's Free Tier!</h4>
                <p className="text-xs text-green-300">Google Cloud offers a <span className="font-bold">$200 monthly credit</span> for Maps Platform products. For most users, this means your usage on SpreeLeads will be free. Always check your Google Cloud billing account for the most accurate cost information.</p>
              </div>
            </div>
          </div>


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
