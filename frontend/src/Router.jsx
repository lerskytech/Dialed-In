import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ClientApp from './ClientApp';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientApp />} />
        <Route path="/dashboard" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
