const mongoose = require('mongoose');
require('dotenv').config(); // Add this line to ensure .env is loaded

const connectDB = async () => {
  try {
    // Enable mongoose debugging
    mongoose.set('debug', true);
    
    // Debug: Check if MONGODB_URI is loaded
    console.log('Attempting to connect with MONGODB_URI:', process.env.MONGODB_URI ? 'URI found (hidden for security)' : 'URI NOT FOUND');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    console.error('Please check:');
    console.error('1. Is .env file in the correct location?');
    console.error('2. Does .env contain MONGODB_URI variable?');
    console.error('3. Is MONGODB_URI correctly formatted?');
    process.exit(1);
  }
};

module.exports = connectDB;