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
const RecommendationHistory = require('../models/RecommendationHistory');

// Use the enhanced recommendation service
const PYTHON_SCRIPT_PATH = path.join(__dirname, '../services/enhanced_recommendation_service.py');
// Use global Python for cross-platform compatibility
const VENV_PYTHON_PATH = process.platform === 'win32' ? 'python' : 'python3';

// Helper function to run the Python script
const runPythonScript = (args) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(VENV_PYTHON_PATH, [PYTHON_SCRIPT_PATH, ...args]);
    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script error: ${errorString}`);
        return reject(new Error('Recommendation service failed.'));
      }
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (parseError) {
        reject(new Error('Failed to parse recommendation response.'));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(err);
    });
  });
};

// Get movie recommendations
router.post('/', 
  apiLimiter,
  authenticateToken,
  sanitizeInput,
  validateMovieRecommendation,
  updateLastActivity,
  logActivity('GET_RECOMMENDATIONS'),
  async (req, res, next) => {
    console.log('Received request for smart recommendations');
    const { movieName, movieLanguage, yearGap, k } = req.body;

    try {
      const args = [
        'recommend',
        movieName.trim(),
        movieLanguage || '',
        yearGap || '',
        k ? k.toString() : '5'
      ];
      const result = await runPythonScript(args);
      
      if (result.error) {
        return res.status(400).json(result);
      }

      // Save to history if recommendations are successful
      const historyEntry = new RecommendationHistory({
        user: req.user.id,
        searchQuery: { movieName, movieLanguage, yearGap, k },
        recommendations: result,
      });
      await historyEntry.save();

      res.json({ recommendations: result });

    } catch (error) {
      console.error("Error during recommendation process:", error);
      res.status(500).json({ error: error.message || 'An unexpected server error occurred.' });
    }
  }
);

// Discover movies by genre and language
router.post('/discover',
  apiLimiter,
  authenticateToken,
  logActivity('DISCOVER_MOVIES'),
  async (req, res) => {
    const { genres, languages, k } = req.body;

    try {
      const args = [
        'discover',
        genres ? genres.join(',') : '',
        languages ? languages.join(',') : '',
        k ? k.toString() : '10'
      ];
      const result = await runPythonScript(args);
      
      if (result.error) {
        return res.status(400).json(result);
      }
      res.json({ recommendations: result });
    } catch (error) {
      console.error("Error during discovery process:", error);
      res.status(500).json({ error: error.message || 'An unexpected server error occurred.' });
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
      const history = await RecommendationHistory.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to the 50 most recent history items

      res.json({
        message: 'Recommendation history retrieved successfully',
        history,
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