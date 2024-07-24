import React, { useState } from 'react';
import { recommendationService } from '../services/api';
import DNA from './DNA';

const MovieRecommendations = () => {
  const [showForm, setShowForm] = useState(false);
  const [movieName, setMovieName] = useState('');
  const [movieLanguage, setMovieLanguage] = useState('');
  const [yearGap, setYearGap] = useState('');
  const [k, setK] = useState(5);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecommendations([]);

    try {
      const result = await recommendationService.getRecommendations(movieName, movieLanguage, yearGap, k);
      setRecommendations(result);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen font-sans">
      <div className="absolute inset-0 z-0">
        <DNA />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white text-center shadow-text">
          Discover Your Movie DNA
        </h1>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-blue-500 py-3 px-6 rounded-full text-xl hover:bg-blue-100 transition-colors duration-300 shadow-lg"
          >
            Explore Recommendations
          </button>
        ) : (
          <div className="w-full max-w-2xl bg-white bg-opacity-90 p-8 rounded-lg shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="movieName" className="block text-gray-700 mb-2 font-semibold">Movie Name:</label>
                <input
                  id="movieName"
                  type="text"
                  value={movieName}
                  onChange={(e) => setMovieName(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="movieLanguage" className="block text-gray-700 mb-2 font-semibold">Movie Language:</label>
                <input
                  id="movieLanguage"
                  type="text"
                  value={movieLanguage}
                  onChange={(e) => setMovieLanguage(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="yearGap" className="block text-gray-700 mb-2 font-semibold">Year Gap (e.g., '0-5'):</label>
                <input
                  id="yearGap"
                  type="text"
                  value={yearGap}
                  onChange={(e) => setYearGap(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="k" className="block text-gray-700 mb-2 font-semibold">Number of Recommendations:</label>
                <select
                  id="k"
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[5, 10, 15, 20].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg text-xl hover:bg-blue-600 transition-colors duration-300 shadow-lg">
                Get Recommendations
              </button>
            </form>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            {recommendations.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Recommended Movies:</h2>
                <ul className="space-y-2">
                  {recommendations.map((movie, index) => (
                    <li key={index} className="text-gray-700 bg-white bg-opacity-50 p-2 rounded">{movie}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieRecommendations;