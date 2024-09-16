import fs from 'fs';
import path from 'path';
import cloudinary from 'cloudinary';
import { ApiError } from '../utils/ApiError.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Controller to handle image upload
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    // Log the received file details
    console.log('Received file:', req.file);

    // Ensure the file path is correct
    const filePath = path.resolve(req.file.path);
    console.log('File path:', filePath);

    // Check if the file exists before attempting to upload
    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, 'File not found');
    }

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: 'food_images',
    });

    // Log the Cloudinary upload result
    console.log('Cloudinary upload result:', result);

    // Remove file from local 'uploads' folder after upload
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting local file:', err);
      }
    });

    // Respond with the image URL
    res.status(200).json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    next(new ApiError(500, 'Error uploading image', [], error.stack));
  }
};
