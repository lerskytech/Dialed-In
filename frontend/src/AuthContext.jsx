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
    const storedToken = localStorage.getItem('4aivr-token');
    const storedUserName = localStorage.getItem('4aivr-user-name');
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
      '4aivr-partner-access-2024': 'Skyler',
      '4aivr-business-partner-2024': 'Eden'
    };
    
    if (tokenUserMap[accessToken]) {
      setToken(accessToken);
      setUserName(tokenUserMap[accessToken]);
      setIsAuthenticated(true);
      localStorage.setItem('4aivr-token', accessToken);
      localStorage.setItem('4aivr-user-name', tokenUserMap[accessToken]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUserName('');
    setIsAuthenticated(false);
    localStorage.removeItem('4aivr-token');
    localStorage.removeItem('4aivr-user-name');
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
