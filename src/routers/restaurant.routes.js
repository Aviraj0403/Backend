import express from 'express';
import { createRestaurant } from '../controllers/restaurant.controller.js';

const router = express.Router();

router.post('/create', createRestaurant);

// Implement other restaurant routes

export default router;
