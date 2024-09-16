import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/databaseConfig.js';
import app from './src/App.js'; // Import the Express app

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT || 4000; // Default to 4000 if PORT is not defined in .env

// Connect to the database
connectDB()
  .then(() => {
    console.log("MongoDB Connected");
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
