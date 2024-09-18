import express from 'express';
import { addFoodItem,
  getAllFoods,
  removeFood ,
  getFoodById,
  updateFoodById,
  getFoodsByCategory
 } from '../controllers/food.controller.js';  // Adjust path as necessary

const router = express.Router();

// Route to add a new food item
router.post('/add', addFoodItem);
// Get all food items
router.get('/list-food', getAllFoods);

// Remove a food item
router.post('/remove', removeFood);

// Get a single food item by ID
router.get('/:id', getFoodById);
// Update a food item by ID
router.put('/:id', updateFoodById);

router.get('/category', getFoodsByCategory);
router.get('/category/:category?/:itemType?', getFoodsByCategory);

export default router;
