import express from 'express';
import { createOwner } from '../controllers/owner.controller.js';

const router = express.Router();

router.post('/create', createOwner);

// Implement other owner routes

export default router;
