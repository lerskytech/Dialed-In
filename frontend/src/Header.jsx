import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon, CogIcon, LogoutIcon } from '@heroicons/react/solid';

const Header = ({ userName, onLogout }) => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <img src="/SL1.png" alt="Dialed-In Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-white">Dialed-In</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex justify-center w-full rounded-md border border-slate-600 px-4 py-2 bg-slate-700 text-sm font-medium text-gray-300 hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                  {userName}
                  <ChevronDownIcon
                    className="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"
                    aria-hidden="true"
                  />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-slate-700 divide-y divide-slate-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onLogout}
                        className={`${active ? 'bg-red-500 text-white' : 'text-gray-300'}
                          group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      >
                        <LogoutIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
