import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './src/config/databaseConfig.js';
import app from './src/App.js'; // Import the Express app

// Load environment variables from .env file


const port = process.env.PORT || 4000; // Default to 4000 if PORT is not defined in .env
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
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
