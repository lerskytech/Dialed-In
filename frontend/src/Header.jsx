import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon, CogIcon, LogoutIcon } from '@heroicons/react/solid';

const Header = ({ userName, onLogout, totalCost }) => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">Spree Leads</h1>
            </div>
          </div>
                    <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter API Key"
                className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="apiKeyInput"
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm"
                onClick={() => {
                  const apiKey = document.getElementById('apiKeyInput').value;
                  localStorage.setItem('apiKey', apiKey);
                  alert('API Key Saved!');
                }}
              >
                Save
              </button>
            </div>
            <div className="text-white text-sm">
              Estimated Cost: ${totalCost.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
