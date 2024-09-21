import multer from 'multer';
import path from 'path';

// Configure storage for uploaded files
const storage = multer.diskStorage({
  // Set the destination for the uploaded files
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  // Define the filename to save the uploaded file
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Unique suffix
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Add extension
  }
});

// Set up multer with storage configuration
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
  fileFilter: (req, file, cb) => {
    // Allowed file types (example: jpg, jpeg, png, gif)
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File type not supported!')); // Error for unsupported file types
    }
  }
});

export default upload;
