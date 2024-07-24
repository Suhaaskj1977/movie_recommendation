import React, { useState } from 'react';
import { recommendationService } from '../services/api';
import DNA from './DNA';

const Navbar = () => (
  <nav className="bg-[#1A120B] p-4">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-[#E5E5CB] text-2xl font-bold">CineGenome</h1>
      <button className="text-[#E5E5CB] hover:text-[#D5CEA3]">Login</button>
    </div>
  </nav>
);

const MovieCard = ({ movie }) => (
  <div className="bg-[#3C2A21] p-4 rounded-lg shadow-lg">
    <h3 className="text-[#E5E5CB] text-xl font-semibold">{movie}</h3>
    {/* You can add an image here later */}
  </div>
);

const MovieRecommendations = () => {
  const [showForm, setShowForm] = useState(true);
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
      setShowForm(false);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#E5E5CB]">
      <Navbar />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="absolute inset-0 z-0 opacity-30">
          <DNA />
        </div>
        {showForm ? (
          <div className="w-full max-w-2xl bg-[#D5CEA3] p-8 rounded-lg shadow-xl relative z-10">
            <h2 className="text-4xl font-bold mb-8 text-[#1A120B] text-center">
              Discover Your Movie DNA
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="movieName" className="block text-[#1A120B] mb-2 font-semibold">Movie Name</label>
                <input
                  id="movieName"
                  type="text"
                  value={movieName}
                  onChange={(e) => setMovieName(e.target.value)}
                  required
                  className="w-full p-3 border border-[#3C2A21] rounded-lg focus:ring-2 focus:ring-[#1A120B] focus:border-[#1A120B] bg-[#E5E5CB] text-[#1A120B]"
                  placeholder="Enter movie name"
                />
              </div>
              <div>
                <label htmlFor="movieLanguage" className="block text-[#1A120B] mb-2 font-semibold">Movie Language</label>
                <input
                  id="movieLanguage"
                  type="text"
                  value={movieLanguage}
                  onChange={(e) => setMovieLanguage(e.target.value)}
                  required
                  className="w-full p-3 border border-[#3C2A21] rounded-lg focus:ring-2 focus:ring-[#1A120B] focus:border-[#1A120B] bg-[#E5E5CB] text-[#1A120B]"
                  placeholder="Enter movie language"
                />
              </div>
              <div>
                <label htmlFor="yearGap" className="block text-[#1A120B] mb-2 font-semibold">Year Gap</label>
                <input
                  id="yearGap"
                  type="text"
                  value={yearGap}
                  onChange={(e) => setYearGap(e.target.value)}
                  className="w-full p-3 border border-[#3C2A21] rounded-lg focus:ring-2 focus:ring-[#1A120B] focus:border-[#1A120B] bg-[#E5E5CB] text-[#1A120B]"
                  placeholder="e.g., '0-5'"
                />
              </div>
              <div>
                <label htmlFor="k" className="block text-[#1A120B] mb-2 font-semibold">Number of Recommendations</label>
                <select
                  id="k"
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="w-full p-3 border border-[#3C2A21] rounded-lg focus:ring-2 focus:ring-[#1A120B] focus:border-[#1A120B] bg-[#E5E5CB] text-[#1A120B]"
                >
                  {[5, 10, 15, 20].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-[#3C2A21] text-[#E5E5CB] py-3 px-6 rounded-lg text-xl hover:bg-[#1A120B] transition-colors duration-300 shadow-lg">
                Get Recommendations
              </button>
            </form>

            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-[#D5CEA3] p-8 rounded-lg shadow-xl relative z-10">
            <h2 className="text-3xl font-bold mb-6 text-[#1A120B] text-center">Recommended Movies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((movie, index) => (
                <MovieCard key={index} movie={movie} />
              ))}
            </div>
            <button 
              onClick={() => setShowForm(true)} 
              className="mt-8 bg-[#3C2A21] text-[#E5E5CB] py-2 px-4 rounded-lg hover:bg-[#1A120B] transition-colors duration-300 shadow-lg"
            >
              Back to Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieRecommendations;