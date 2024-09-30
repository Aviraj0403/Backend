import express from 'express';
import {
    addFoodItem,
    getAllFoods,
    removeFood,
    getFoodById,
    updateFoodById,
    getFoodsByCategory,
    getFoodsByVariety // Import the new controller function
} from '../controllers/food.controller.js';  // Adjust path as necessary
import { verifyJWT, isRestaurantOwner, csrfProtectionMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to add a new food item
router.post('/add', verifyJWT, isRestaurantOwner, addFoodItem);

// Get all food items
router.get('/:restaurantId/list-food', getAllFoods);

// Remove a food item
router.delete('/:restaurantId/:id',  removeFood);

// Get a single food item by ID
router.get('/:restaurantId/:id', getFoodById);

// Update a food item by ID
router.put('/:restaurantId/:id',  updateFoodById);

// Get food items by category
router.get('/:restaurantId/category', getFoodsByCategory);
router.get('/:restaurantId/category/:category?/:itemType?', getFoodsByCategory);

// Get food items by variety
router.get('/:restaurantId/variety/:variety?', getFoodsByVariety); // New route for variety

export default router;
