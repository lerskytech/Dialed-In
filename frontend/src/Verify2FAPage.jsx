import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Verify2FAPage = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, qrCodeUrl } = location.state || {};

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:3001/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, token })
            });

            if (response.ok) {
                setSuccess('2FA enabled successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Invalid 2FA token');
            }
        } catch (err) {
            setError('Could not connect to the server.');
        }
        setLoading(false);
    };

    if (!userId || !qrCodeUrl) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center text-white">
                <p>No registration data found. Please <a href="/register" className="underline">register</a> first.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
            <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 sm:p-8 w-full max-w-md text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Set Up Two-Factor Authentication</h2>
                <p className="text-sm sm:text-base text-gray-300 mb-6">Scan the QR code with your authenticator app (like Google Authenticator) and enter the code below.</p>
                
                <div className="bg-white p-2 sm:p-4 rounded-lg inline-block mb-6 w-full max-w-[200px] sm:max-w-xs">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-auto" />
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                            required
                        />
                    </div>

                    {error && <div className="bg-red-900/80 border border-red-600 text-red-200 px-4 py-2 rounded text-sm">{error}</div>}
                    {success && <div className="bg-green-900/80 border border-green-600 text-green-200 px-4 py-2 rounded text-sm">{success}</div>}

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Verify2FAPage;
