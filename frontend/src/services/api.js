// src/services/api.js
import axios from 'axios';

// Use a production-ready environment variable for the API URL
const API_URL = process.env.REACT_APP_API_URL ;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


const authService = {
    login: async (email, password) => {
      try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
      } catch (error) {
        console.error('Login error details:', error.response?.data || error.message);
        throw error;
      }
    },
  
  register: async (name, email, password) => {
    return api.post('/auth/register', { name, email, password });
  },
  
  logout: () => {
    // The AuthContext will handle state updates.
    // This function's only job is to clear storage.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
};


const recommendationService = {
    getRecommendations: async (movieName, movieLanguage, yearGap, k) => {
      console.log('Sending request to:', `${API_URL}/recommendations`);
      const payload = { movieName, yearGap, k };
      if (movieLanguage) {
        payload.movieLanguage = movieLanguage;
      }

      try {
        const response = await api.post('/recommendations', payload);
        console.log('Received response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching recommendations:', error.response ? error.response.data : error.message);
        // Forward the specific error from the backend
        throw error.response.data;
      }
    },

    getHistory: async () => {
      try {
        const response = await api.get('/recommendations/history');
        return response.data.history;
      } catch (error) {
        console.error('Error fetching recommendation history:', error.response ? error.response.data : error.message);
        throw error.response.data;
      }
    },

    getMovieDetails: async (movie) => {
      // For now, return a placeholder poster
      // In a real app, you'd call an external API like OMDB or TMDB
      return {
        Poster: 'https://via.placeholder.com/300x450/cccccc/666666?text=Movie+Poster'
      };
    },

    discoverMovies: async (genres, languages, k) => {
      try {
        const payload = { genres, languages, k };
        const response = await api.post('/recommendations/discover', payload);
        return response.data;
      } catch (error) {
        console.error('Error discovering movies:', error.response ? error.response.data : error.message);
        throw error.response.data;
      }
    },
};
  export { api, authService, recommendationService };