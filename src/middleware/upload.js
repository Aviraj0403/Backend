import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Create uploads directory if it doesn't exist
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Set the destination to the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Unique suffix
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Add extension to file name
  }
});

// Set up multer with storage configuration
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
  fileFilter: (req, file, cb) => {
    // Allowed file types (example: jpg, jpeg, png, gif, avif)
    const fileTypes = /jpeg|jpg|png|gif|avif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true); // If valid file type, allow the upload
    } else {
      cb(new Error('Error: File type not supported!')); // Error for unsupported file types
    }
  }
});

export default upload;
