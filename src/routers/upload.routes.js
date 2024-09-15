import express from 'express';
import upload from '../middleware/upload.js'; // Path to your multer setup
import { uploadImage } from '../controllers/upload.controller.js';

const router = express.Router();

router.post('/image', upload.single('image'), uploadImage);

export default router;
