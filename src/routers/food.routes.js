import express from 'express';
import { addFoodItem,
  getAllFoods,
  removeFood ,
  getFoodById,
  updateFoodById,
  getFoodsByCategory
 } from '../controllers/food.controller.js';  // Adjust path as necessary
 import { verifyJWT, isRestaurantOwner, csrfProtectionMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();

// Route to add a new food item
router.post('/add', verifyJWT, isRestaurantOwner,addFoodItem);
// Get all food items
router.get('/list-food', getAllFoods);

// Remove a food item
router.post('/remove',verifyJWT, isRestaurantOwner, removeFood);

// Get a single food item by ID
router.get('/:id', getFoodById);
// Update a food item by ID
router.put('/:id', verifyJWT, isRestaurantOwner,updateFoodById);

router.get('/category', getFoodsByCategory);
router.get('/category/:category?/:itemType?', getFoodsByCategory);

export default router;
