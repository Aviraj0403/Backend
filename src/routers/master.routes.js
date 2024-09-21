import express from 'express';
import {
    registerRestaurantOwner,
    // getAllRestaurantOwners,
    // addSubscription,
    // getSubscriptionStatus,
    
} from '../controllers/auth.controller.js';
import { verifyJWT, isSuperAdmin, isRestaurantOwner } from '../middleware/auth.middleware.js';
import { sendSubscriptionAlert, extendSubscription,getAllRestaurants } from '../controllers/restaurant.controller.js';

const router = express.Router();

// Register a new restaurant owner (only for super admin)
router.post('/register', verifyJWT, isSuperAdmin, registerRestaurantOwner);

// Get all restaurants (accessible by super admin and restaurant owners)
router.get('/restaurants', verifyJWT, isSuperAdmin,getAllRestaurants); // Optionally, add isRestaurantOwner if needed

// Extend a restaurant's subscription
router.put('/restaurants/:restaurantId/extend-subscription', verifyJWT, isRestaurantOwner, extendSubscription);

// Send subscription alert
router.post('/restaurants/:restaurantId/send-alert', verifyJWT, isRestaurantOwner, sendSubscriptionAlert);

// Get all restaurant owners (optional, uncomment if needed)
// router.get('/', verifyJWT, isSuperAdmin, getAllRestaurantOwners);

// Add a subscription for a restaurant owner (optional, uncomment if needed)
// router.post('/subscription', verifyJWT, isRestaurantOwner, addSubscription);

// Get subscription status for a specific restaurant (optional, uncomment if needed)
// router.get('/subscription/:restaurantId/status', verifyJWT, isRestaurantOwner, getSubscriptionStatus);

// Example: Update subscription details (not implemented here)
// router.put('/subscription/:subscriptionId', verifyJWT, isRestaurantOwner, updateSubscription);

// Example: Remove subscription (not implemented here)
// router.delete('/subscription/:subscriptionId', verifyJWT, isRestaurantOwner, removeSubscription);

// Optional: Additional endpoints for managing subscriptions could be added here

export default router;
