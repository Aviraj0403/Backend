import cloudinary from 'cloudinary';
import { ApiError } from '../utils/ApiError.js' // Adjust path as necessary
import { configCloudinary } from '../config/cloudinaryConfig.js';
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// const cloudinary = configCloudinary();
// Controller to handle image upload
export const uploadImage = async (req, res, next) => {

  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'food_images',
    });

    res.status(200).json({
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('Image upload error:', error);
    next(new ApiError(500, 'Error uploading image', [], error.stack));
  }
};
