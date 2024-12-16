// server.js or routes.js

import express from 'express';
import { addRestaurantToOwner, createRestaurantAndAssociate } from '../controllers/restaurant.controller';

const router = express.Router();

// Example route to add an existing restaurant to a RestaurantOwner
router.post('/addRestaurantToOwner', async (req, res) => {
    const { restaurantOwnerId, restaurantId } = req.body; // Ensure restaurantOwnerId and restaurantId are provided
    try {
        const result = await addRestaurantToOwner(restaurantOwnerId, restaurantId);
        res.status(200).json(result); // Send success response
    } catch (error) {
        res.status(400).json({ error: error.message }); // Send error response
    }
});

// Example route to create a new restaurant and associate it with a RestaurantOwner
router.post('/createRestaurantAndAssociate', async (req, res) => {
    const { restaurantData, restaurantOwnerId } = req.body; // Ensure restaurantData and restaurantOwnerId are provided
    try {
        const result = await createRestaurantAndAssociate(restaurantData, restaurantOwnerId);
        res.status(200).json(result); // Send success response
    } catch (error) {
        res.status(400).json({ error: error.message }); // Send error response
    }
});

export default router;
