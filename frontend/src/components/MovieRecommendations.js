import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { recommendationService, api } from '../services/api';
import Select from 'react-select';

const MovieRecommendations = () => {
  const [mode, setMode] = useState('search'); // 'search' or 'discover'
  const [showForm, setShowForm] = useState(true);
  
  // Search Form State
  const [movieName, setMovieName] = useState('');
  const [yearGap, setYearGap] = useState('');
  const [k, setK] = useState(5);

  // Discover Form State
  const [discoverGenres, setDiscoverGenres] = useState([]);
  const [discoverLanguages, setDiscoverLanguages] =useState([]);

  // General State
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Language Clarification State
  const [languageOptions, setLanguageOptions] = useState(null);
  const [pendingMovieName, setPendingMovieName] = useState('');

  // Data for selects
  const [allGenres, setAllGenres] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [genresRes, languagesRes] = await Promise.all([
          api.get('/recommendations/genres'),
          api.get('/recommendations/languages')
        ]);
        setAllGenres(genresRes.data.genres.map(g => ({ value: g, label: g })));
        setAllLanguages(languagesRes.data.languages.map(l => ({ value: l, label: l })));
      } catch (err) {
        console.error("Failed to fetch genres/languages", err);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLanguageOptions(null);
    try {
      const result = await recommendationService.getRecommendations(movieName, null, yearGap, k);
      setRecommendations(result.recommendations);
      setShowForm(false);
    } catch (err) {
      if (err.requiresLanguage) {
        setError(err.error);
        setLanguageOptions(err.languageOptions);
        setPendingMovieName(movieName);
      } else {
        setError(err.error || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscoverSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const genres = discoverGenres.map(g => g.value);
      const languages = discoverLanguages.map(l => l.value);
      const result = await recommendationService.discoverMovies(genres, languages, k);
      setRecommendations(result.recommendations);
      setShowForm(false);
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = async (selectedLanguage) => {
    setError('');
    setIsLoading(true);
    setLanguageOptions(null);

    try {
      const result = await recommendationService.getRecommendations(pendingMovieName, selectedLanguage, yearGap, k);
      setRecommendations(result.recommendations);
      setShowForm(false);
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setShowForm(true);
    setMovieName('');
    setYearGap('');
    setRecommendations([]);
    setError('');
    setLanguageOptions(null);
  }

  const MovieCard = ({ movie, index }) => (
    <motion.div
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 hover:shadow-xl hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="p-5">
        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">{movie.Title}</h3>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>{movie.Year}</span>
          <span className="font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{movie.Language}</span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{movie.Genre}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Match Score</span>
          <span className="font-bold text-green-600">{Math.round(movie.similarity_score * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${movie.similarity_score * 100}%` }}></div>
        </div>
      </div>
    </motion.div>
  );

  const SearchForm = () => (
    <form onSubmit={handleSearchSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Movie Title</label>
        <input type="text" value={movieName} onChange={(e) => setMovieName(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="e.g., Baahubali, KGF"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year Gap (Optional)</label>
          <input type="text" value={yearGap} onChange={(e) => setYearGap(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="e.g., 2010-2020"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How many?</label>
          <input type="number" value={k} onChange={(e) => setK(parseInt(e.target.value, 10))} min="1" max="20" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"/>
        </div>
      </div>
      {/* Language Clarification */}
      {languageOptions && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-3">{error}. Please choose one:</p>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((opt, i) => (
              <button key={i} type="button" onClick={() => handleLanguageSelect(opt.Language)} className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600">
                {opt.Language} ({opt.Year})
              </button>
            ))}
          </div>
        </motion.div>
      )}
      {error && !languageOptions && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-gray-800 disabled:opacity-50">
        {isLoading ? 'Searching...' : 'Find Recommendations'}
      </motion.button>
    </form>
  );

  const DiscoverForm = () => (
    <form onSubmit={handleDiscoverSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Genres</label>
        <Select
          isMulti
          options={allGenres}
          value={discoverGenres}
          onChange={setDiscoverGenres}
          placeholder="Select one or more genres..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
        <Select
          isMulti
          options={allLanguages}
          value={discoverLanguages}
          onChange={setDiscoverLanguages}
          placeholder="Select one or more languages..."
        />
      </div>
       <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How many?</label>
          <input type="number" value={k} onChange={(e) => setK(parseInt(e.target.value, 10))} min="1" max="20" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"/>
       </div>
      <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-gray-800 disabled:opacity-50">
        {isLoading ? 'Searching...' : 'Discover Movies'}
      </motion.button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">Movie Discovery</h1>
                <p className="text-lg text-gray-600">Find your next favorite film, with or without a title in mind.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 flex space-x-2">
                <button onClick={() => setMode('search')} className={`w-1/2 py-3 rounded-xl font-semibold ${mode === 'search' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600'}`}>
                  Search by Title
                </button>
                <button onClick={() => setMode('discover')} className={`w-1/2 py-3 rounded-xl font-semibold ${mode === 'discover' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600'}`}>
                  Discover by Filter
                </button>
              </div>

              <motion.div className="bg-white rounded-2xl shadow-lg p-8" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                {mode === 'search' ? <SearchForm /> : <DiscoverForm />}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900">Recommendations</h1>
                <p className="text-lg text-gray-600 mt-2">Based on your love for "{pendingMovieName || movieName}"</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendations.map((movie, index) => <MovieCard key={index} movie={movie} index={index} />)}
              </div>
              <div className="text-center mt-12">
                <button onClick={resetSearch} className="bg-white text-gray-800 py-2 px-6 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-100">
                  Search Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MovieRecommendations;
