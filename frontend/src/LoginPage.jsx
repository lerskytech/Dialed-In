import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const LoginPage = () => {
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (login(accessToken)) {
      // Login successful - AuthContext will handle the redirect
    } else {
      setError('Invalid access token. Please contact your business partner for the correct token.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dialed-In</h1>
          <p className="text-gray-300">Premium Lead Generation System</p>
          <p className="text-sm text-gray-400 mt-2">Private Access Required</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your access token..."
              className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/80 border border-red-600 text-red-200 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !accessToken}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Authenticating...' : 'Access System'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Need access? Contact your business partner for the access token.
          </p>
        </div>

        <div className="mt-8 bg-blue-900/50 border border-blue-600 rounded p-4">
          <h3 className="text-sm font-semibold text-blue-200 mb-2">System Features:</h3>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Real-time lead generation from Google Places</li>
            <li>• Value-based ranking and scoring</li>
            <li>• Advanced filtering and organization</li>
            <li>• Phone numbers and contact information</li>
            <li>• Secure private access for business partners</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
