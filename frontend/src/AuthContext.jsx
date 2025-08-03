import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check for stored token and user name on app load
    const storedToken = localStorage.getItem('dialed-in-token');
    const storedUserName = localStorage.getItem('dialed-in-user-name');
    if (storedToken && storedUserName) {
      setToken(storedToken);
      setUserName(storedUserName);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (accessToken) => {
    // Token to user mapping
    const tokenUserMap = {
      'dialed-in-partner-access-2024': 'Skyler',
      'dialed-in-business-partner-2024': 'Eden'
    };
    
    if (tokenUserMap[accessToken]) {
      setToken(accessToken);
      setUserName(tokenUserMap[accessToken]);
      setIsAuthenticated(true);
      localStorage.setItem('dialed-in-token', accessToken);
      localStorage.setItem('dialed-in-user-name', tokenUserMap[accessToken]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUserName('');
    setIsAuthenticated(false);
    localStorage.removeItem('dialed-in-token');
    localStorage.removeItem('dialed-in-user-name');
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    isAuthenticated,
    token,
    userName,
    login,
    logout,
    getAuthHeaders,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
