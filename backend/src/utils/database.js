// database.js
const mongoose = require('mongoose');
require('dotenv').config();

const uri = "mongodb+srv://manasgun10:manasgun10@movies.ecn5kku.mongodb.net/";

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
