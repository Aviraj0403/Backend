import express from 'express';
import { addFoodItem } from '../controllers/food.controller.js';  // Adjust path as necessary

const router = express.Router();

// Route to add a new food item
router.post('/add', addFoodItem);

export default router;
