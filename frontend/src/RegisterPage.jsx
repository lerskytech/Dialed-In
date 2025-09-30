import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const result = await register(email, password);

        if (result.success) {
            navigate('/verify-2fa', { state: { userId: result.userId, qrCodeUrl: result.qrCodeUrl } });
        } else {
            setError(result.message || 'Registration failed. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
            <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-8 w-full max-w-md">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
                    <p className="text-gray-300 mt-2">Join the ultimate lead generation platform.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Choose a strong password..."
                            className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                            required
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

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
                            Log in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
