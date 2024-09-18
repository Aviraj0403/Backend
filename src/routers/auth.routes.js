import express from 'express';
import { loginMaster, authenticateToken } from '../controllers/auth.controller.js';

const router = express.Router();

// Route to handle login
router.post('/login', loginMaster);

// Route to verify token (example route for token verification)
router.get('/verify', authenticateToken);

export default router;
