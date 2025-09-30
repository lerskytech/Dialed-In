import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center items-center space-x-4 mt-4">
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
        className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-white">Page {currentPage} of {totalPages}</span>
      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
