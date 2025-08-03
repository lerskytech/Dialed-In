import React from 'react';

const LeadDetailModal = ({ lead, averageRating, averageReviews, onClose }) => {
  if (!lead) return null;

  const rating = parseFloat(lead.ratingValue) || 0;
  const reviews = parseInt(lead.reviewCount, 10) || 0;

  const getComparison = (value, average) => {
    if (value > average) return { text: 'Above Average', color: 'text-green-500' };
    if (value < average) return { text: 'Below Average', color: 'text-red-500' };
    return { text: 'Average', color: 'text-gray-500' };
  };

  const ratingComparison = getComparison(rating, averageRating);
  const reviewsComparison = getComparison(reviews, averageReviews);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">{lead.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
            <p className={`text-2xl font-bold ${ratingComparison.color}`}>{rating} <span className="text-sm">({ratingComparison.text})</span></p>
            <p className="text-xs text-gray-400">Avg: {averageRating}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Reviews</p>
            <p className={`text-2xl font-bold ${reviewsComparison.color}`}>{reviews} <span className="text-sm">({reviewsComparison.text})</span></p>
            <p className="text-xs text-gray-400">Avg: {averageReviews}</p>
          </div>
        </div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
