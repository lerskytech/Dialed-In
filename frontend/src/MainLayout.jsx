import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Header from './Header';
import { useAuth } from './AuthContext';

const MainLayout = () => {
  const { logout, userName, getAuthHeaders } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header 
        userName={userName}
        onLogout={logout} 
      />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard getAuthHeaders={getAuthHeaders} />} />
          {/* Other nested routes can go here */}
        </Routes>
      </main>
    </div>
  );
};

export default MainLayout;
