const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/database');
const authRoutes = require('./routes/auth');
const recommendationRoutes = require('./routes/recommendations');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'
    : 'http://localhost:3000',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to database
connectDB();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/recommend', recommendationRoutes);

// Health check route
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS origin: ${corsOptions.origin}`);
});

module.exports = app;