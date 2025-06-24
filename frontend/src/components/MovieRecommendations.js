import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { recommendationService } from '../services/api';

const MovieRecommendations = () => {
  const [showForm, setShowForm] = useState(true);
  const [movieName, setMovieName] = useState('');
  const [movieLanguage, setMovieLanguage] = useState('');
  const [yearGap, setYearGap] = useState('');
  const [k, setK] = useState(5);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecommendations([]);
    setIsLoading(true);

    try {
      const result = await recommendationService.getRecommendations(movieName, movieLanguage, yearGap, k);
      const moviesWithPosters = await Promise.all(result.map(async (movie) => {
        try {
          const movieDetails = await recommendationService.getMovieDetails(movie);
          // Original script returns names, so we create an object
          return { Title: movie, Poster: movieDetails.Poster };
        } catch {
          return { Title: movie, Poster: null };
        }
      }));
      setRecommendations(moviesWithPosters);
      setShowForm(false);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const MovieCard = ({ movie, index }) => (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      {movie.Poster && movie.Poster !== 'N/A' ? (
        <div className="aspect-[2/3] overflow-hidden">
          <img 
            src={movie.Poster} 
            alt={`${movie.Title} poster`} 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 14a2 2 0 002 2h10a2 2 0 002-2L17 4M9 10v4M15 10v4" />
          </svg>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{movie.Title}</h3>
        {movie.Year && (
          <p className="text-gray-500 text-sm">{movie.Year}</p>
        )}
        {movie.Genre && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-1">{movie.Genre}</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-12">
                <motion.h1 
                  className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Discover Movies
                </motion.h1>
                <motion.p 
                  className="text-xl text-gray-600 max-w-lg mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Tell us about a movie you love, and we'll find similar films you'll enjoy
                </motion.p>
              </div>

              {/* Form */}
              <motion.div
                className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Movie Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Movie Title
                    </label>
                    <input
                      type="text"
                      value={movieName}
                      onChange={(e) => setMovieName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                      placeholder="e.g., The Dark Knight, Inception, Pulp Fiction"
                    />
                  </div>

                  {/* Movie Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <input
                      type="text"
                      value={movieLanguage}
                      onChange={(e) => setMovieLanguage(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                      placeholder="e.g., English, Spanish, French"
                    />
                  </div>

                  {/* Year Gap */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Range (Optional)
                    </label>
                    <input
                      type="text"
                      value={yearGap}
                      onChange={(e) => setYearGap(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                      placeholder="e.g., 2010-2020 or leave blank for all years"
                    />
                  </div>

                  {/* Number of Recommendations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Recommendations
                    </label>
                    <select
                      value={k}
                      onChange={(e) => setK(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    >
                      {[5, 10, 15, 20].map((num) => (
                        <option key={num} value={num}>
                          {num} movies
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Finding recommendations...</span>
                      </div>
                    ) : (
                      'Get Recommendations'
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Results Header */}
              <div className="text-center mb-12">
                <motion.h1 
                  className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Recommended for You
                </motion.h1>
                <motion.p 
                  className="text-xl text-gray-600"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Based on "{movieName}" • {recommendations.length} movies found
                </motion.p>
              </div>

              {/* Movies Grid */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {recommendations.map((movie, index) => (
                  <MovieCard key={index} movie={movie} index={index} />
                ))}
              </motion.div>

              {/* Back Button */}
              <div className="text-center">
                <motion.button 
                  onClick={() => setShowForm(true)}
                  className="bg-white text-gray-900 py-3 px-8 rounded-xl font-semibold border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Search Again
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MovieRecommendations;
