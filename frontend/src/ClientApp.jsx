import React from 'react';

const ClientApp = () => {
  return (
    <div className="bg-gray-50 font-sans leading-normal tracking-normal">
      <nav className="bg-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">EVE_3.0</div>
          <div>
            <a href="#" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded">Home</a>
            <a href="#" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded">About</a>
            <a href="#" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded">Packages</a>
            <a href="#" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-full">Get Free Analysis</a>
          </div>
        </div>
      </nav>

      <header className="bg-white py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-gray-900">Stop Guessing. Start Growing.</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">EVE_3.0 gives you a transparent look at your business's performance and connects you with ready-to-convert customers. No robots, just real results.</p>
          <div className="mt-8">
            <a href="#" className="bg-indigo-600 text-white text-lg font-semibold hover:bg-indigo-700 px-8 py-4 rounded-full">Get Your Free Business Examination</a>
          </div>
        </div>
      </header>

      <section id="value-prop" className="py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800">Human-First, AI-Assisted</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">We use AI as a helpful middleman to find opportunities. All client conversations are managed by real, professional people dedicated to your success.</p>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 EVE_3.0 Lead Navigator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ClientApp;
