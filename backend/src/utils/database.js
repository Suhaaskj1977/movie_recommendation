const mongoose = require('mongoose');
require('dotenv').config();

const uri = "mongodb+srv://Vishnu:Vishnu234@harmoney-cluster.tdgmi.mongodb.net/?retryWrites=true&w=majority&appName=Harmoney-cluster";

const connectDB = async () => {
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