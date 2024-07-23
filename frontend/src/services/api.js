// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api'; // Note the /api at the end

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
      console.log('Request payload:', { movieName, movieLanguage, yearGap, k });
      try {
        const response = await api.post('/recommendations', { movieName, movieLanguage, yearGap, k });
        console.log('Received response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching recommendations:', error.response ? error.response.data : error.message);
        throw error;
      }
    },
  };
  export { api, authService, recommendationService };