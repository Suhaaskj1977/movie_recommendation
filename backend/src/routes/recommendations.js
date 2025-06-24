const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const { 
  authenticateToken, 
  logActivity, 
  updateLastActivity,
  apiLimiter 
} = require('../middleware/auth');
const {
  validateMovieRecommendation,
  sanitizeInput
} = require('../middleware/validation');

// Reverted to the original recommendation service
const PYTHON_SCRIPT_PATH = path.join(__dirname, '../services/recommendationServices.py');
const VENV_PYTHON_PATH = path.join(__dirname, '../../venv/bin/python');

// Get movie recommendations
router.post('/', 
  apiLimiter,
  authenticateToken,
  sanitizeInput,
  validateMovieRecommendation,
  updateLastActivity,
  logActivity('GET_RECOMMENDATIONS'),
  async (req, res, next) => {
    console.log('Received request for recommendations');
    console.log('Request body:', req.body);
    console.log('User:', req.user.email);

    const { movieName, movieLanguage, yearGap, k } = req.body;

    try {
      console.log('Spawning Python process');
      console.log('Python script path:', PYTHON_SCRIPT_PATH);
      console.log('Virtual environment Python path:', VENV_PYTHON_PATH);
      
      const pythonProcess = spawn(VENV_PYTHON_PATH, [
        PYTHON_SCRIPT_PATH,
        movieName,
        movieLanguage,
        yearGap || '',
        k ? k.toString() : '5'
      ]);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        console.log('Received data from Python script:', data.toString());
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python script error: ${data}`);
        errorString += data.toString();
      });

      pythonProcess.on('error', (error) => {
        console.error(`Error spawning Python process: ${error}`);
        res.status(500).json({ 
          error: 'Failed to start recommendation service',
          code: 'SERVICE_START_ERROR'
        });
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        
        if (code !== 0) {
          return res.status(500).json({ 
            error: 'An error occurred while processing the recommendation',
            code: 'RECOMMENDATION_PROCESSING_ERROR',
            details: errorString || 'Unknown error'
          });
        }
        
        try {
          // The original script returns a simple list of movie names
          const recommendations = JSON.parse(dataString);
          console.log('Sending recommendations:', recommendations);
          
          res.json(recommendations); // Send back the array directly
        } catch (error) {
          console.error('Error parsing Python script output:', error);
          res.status(500).json({ 
            error: 'An error occurred while processing the recommendation response',
            code: 'RESPONSE_PARSING_ERROR'
          });
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      next(error);
    }
  }
);

// Get recommendation history for user
router.get('/history',
  apiLimiter,
  authenticateToken,
  updateLastActivity,
  logActivity('GET_RECOMMENDATION_HISTORY'),
  async (req, res) => {
    try {
      // TODO: Implement recommendation history tracking
      // This would require a new model to store recommendation requests
      res.json({
        message: 'Recommendation history feature coming soon',
        history: []
      });
    } catch (error) {
      console.error('Get recommendation history error:', error);
      res.status(500).json({
        error: 'Server error while fetching recommendation history',
        code: 'HISTORY_FETCH_ERROR'
      });
    }
  }
);

// Get available movie languages
router.get('/languages',
  apiLimiter,
  authenticateToken,
  updateLastActivity,
  logActivity('GET_LANGUAGES'),
  async (req, res) => {
    try {
      // TODO: Extract languages from the movie dataset
      const languages = [
        'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 
        'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'English'
      ];
      
      res.json({
        languages,
        count: languages.length
      });
    } catch (error) {
      console.error('Get languages error:', error);
      res.status(500).json({
        error: 'Server error while fetching languages',
        code: 'LANGUAGES_FETCH_ERROR'
      });
    }
  }
);

// Get available movie genres
router.get('/genres',
  apiLimiter,
  authenticateToken,
  updateLastActivity,
  logActivity('GET_GENRES'),
  async (req, res) => {
    try {
      // TODO: Extract genres from the movie dataset
      const genres = [
        'Action', 'Drama', 'Comedy', 'Thriller', 'Romance',
        'Horror', 'Sci-Fi', 'Adventure', 'Crime', 'Mystery',
        'Biography', 'Documentary', 'Animation', 'Family'
      ];
      
      res.json({
        genres,
        count: genres.length
      });
    } catch (error) {
      console.error('Get genres error:', error);
      res.status(500).json({
        error: 'Server error while fetching genres',
        code: 'GENRES_FETCH_ERROR'
      });
    }
  }
);

// Health check for recommendation service
router.get('/health',
  async (req, res) => {
    try {
      // Test if Python script can be executed
      const pythonProcess = spawn(VENV_PYTHON_PATH, ['--version']);
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          res.json({
            status: 'healthy',
            service: 'movie-recommendation',
            python: 'available',
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(503).json({
            status: 'unhealthy',
            service: 'movie-recommendation',
            python: 'unavailable',
            timestamp: new Date().toISOString()
          });
        }
      });
      
      pythonProcess.on('error', () => {
        res.status(503).json({
          status: 'unhealthy',
          service: 'movie-recommendation',
          python: 'unavailable',
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        service: 'movie-recommendation',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;