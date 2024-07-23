import React, { useState } from 'react';
import { recommendationService } from '../services/api';

const MovieRecommendations = () => {
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
    <div>
      <h1>Movie Recommendations</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="movieName">Movie Name:</label>
          <input
            id="movieName"
            type="text"
            value={movieName}
            onChange={(e) => setMovieName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="movieLanguage">Movie Language:</label>
          <input
            id="movieLanguage"
            type="text"
            value={movieLanguage}
            onChange={(e) => setMovieLanguage(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="yearGap">Year Gap (e.g., '0-5'):</label>
          <input
            id="yearGap"
            type="text"
            value={yearGap}
            onChange={(e) => setYearGap(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="k">Number of Recommendations:</label>
          <select
            id="k"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <button type="submit">Get Recommendations</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {recommendations.length > 0 && (
        <div>
          <h2>Recommended Movies:</h2>
          <ul>
            {recommendations.map((movie, index) => (
              <li key={index}>{movie}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MovieRecommendations;