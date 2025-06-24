const mongoose = require('mongoose');
require('dotenv').config();

// The URI will now be loaded from process.env, which is populated by dotenv
const uri = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!uri) {
    console.error('FATAL: MONGODB_URI is not defined. Please create a .env file in the /backend directory with this variable.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;