const mongoose = require('mongoose');

const RecommendationHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  searchQuery: {
    movieName: { type: String, required: true },
    movieLanguage: { type: String },
    yearGap: { type: String },
    k: { type: Number },
  },
  recommendations: [{
    Title: { type: String },
    Year: { type: Number },
    Language: { type: String },
    Genre: { type: String },
    Rating: { type: Number },
    similarity_score: { type: Number },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RecommendationHistory', RecommendationHistorySchema); 