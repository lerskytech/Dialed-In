import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('spreeleads-token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
        } else {
          // Token expired
          setIsAuthenticated(false);
          localStorage.removeItem('spreeleads-token');
        }
      } catch (e) {
        // Invalid token
        setIsAuthenticated(false);
        localStorage.removeItem('spreeleads-token');
      }
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password, token) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Login failed.' };
      }

      if (data.token) {
        setToken(data.token);
        localStorage.setItem('spreeleads-token', data.token);
      }
      
      return data; // This will include { success: true, ... } or { twoFactorRequired: true, ... }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Could not connect to the server.' };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Registration failed.' };
      }

      return data; // This will include { success: true, userId, qrCodeUrl }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Could not connect to the server.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('spreeleads-token');
    setToken(null);
  };

  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  const value = {
    isAuthenticated,
    token,
    loading,
    login,
    register,
    logout,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
