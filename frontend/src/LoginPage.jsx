import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password, twoFactorToken);

    if (result.success) {
      navigate('/');
    } else if (result.twoFactorRequired) {
      setError('Please enter your 2FA token to complete the login.');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-8 w-full max-w-md">
        <div className="text-center">
          <img src="/SL1.png" alt="Dialed-In Logo" className="w-24 h-24 mx-auto mb-4" />
          <p className="text-sm text-gray-400 mt-2">Private Access Required</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password..."
              className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              required
            />
          </div>

          {twoFactorRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                2FA Token
              </label>
              <input
                type="text"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                placeholder="Enter your 6-digit code"
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-900/80 border border-red-600 text-red-200 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Authenticating...' : 'Access System'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">
              Sign up now
            </Link>
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
