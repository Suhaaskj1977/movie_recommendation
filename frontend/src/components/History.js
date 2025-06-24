import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { recommendationService } from '../services/api';
import { format } from 'date-fns';

const History = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await recommendationService.getHistory();
        setHistory(data);
      } catch (err) {
        setError(err.error || 'Failed to fetch history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const HistoryCard = ({ item, index }) => (
    <motion.div
      className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">Searched for:</p>
          <h3 className="font-bold text-lg text-gray-800">"{item.searchQuery.movieName}"</h3>
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(item.createdAt), 'MMMM d, yyyy h:mm a')}
          </p>
        </div>
        <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {item.recommendations.length} results
        </span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Top Recommendations:</h4>
        <ul className="space-y-1">
          {item.recommendations.slice(0, 3).map((rec, i) => (
            <li key={i} className="text-sm text-gray-600 flex justify-between">
              <span>{rec.Title} ({rec.Year})</span>
              <span className="font-medium text-green-600">{Math.round(rec.similarity_score * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return <div className="text-center p-10">Loading history...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900">Your History</h1>
        <p className="text-lg text-gray-600 mt-2">A log of your past movie discoveries.</p>
      </div>
      {history.length > 0 ? (
        <div className="space-y-6">
          {history.map((item, index) => (
            <HistoryCard key={item._id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white rounded-2xl p-12">
          <h3 className="text-xl font-semibold text-gray-800">No History Yet</h3>
          <p className="text-gray-500 mt-2">
            Go make a search on the recommendations page to start building your history!
          </p>
        </div>
      )}
    </div>
  );
};

export default History; 