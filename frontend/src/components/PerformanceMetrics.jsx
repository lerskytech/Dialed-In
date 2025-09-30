import React from 'react';

const PerformanceMetrics = ({ leads }) => {
  if (leads.length === 0) {
    return null;
  }

  const totalRating = leads.reduce((acc, lead) => acc + (parseFloat(lead.ratingValue) || 0), 0);
  const averageRating = (totalRating / leads.filter(lead => lead.ratingValue !== 'N/A').length).toFixed(2);

  const totalReviews = leads.reduce((acc, lead) => acc + (parseInt(lead.reviewCount, 10) || 0), 0);
  const averageReviews = (totalReviews / leads.length).toFixed(0);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">Performance Snapshot</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageRating}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Reviews</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageReviews}</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
