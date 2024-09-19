import express from 'express';
import {
    registerRestaurantOwner,
    // getAllRestaurantOwners,
    // addSubscription,
    // getSubscriptionStatus
} from '../controllers/auth.controller.js';
import { verifyJWT, isSuperAdmin, isRestaurantOwner } from '../middleware/auth.middleware.js';

const router = express.Router();

// Register a new restaurant owner (only for super admin)
router.post('/register', verifyJWT, isSuperAdmin, registerRestaurantOwner);

// Get all restaurant owners
// router.get('/', verifyJWT, isSuperAdmin, getAllRestaurantOwners);

// Add a subscription for a restaurant owner
// router.post('/subscription', verifyJWT, isRestaurantOwner, addSubscription);

// Get subscription status for a specific restaurant
// router.get('/subscription/:restaurantId/status', verifyJWT, isRestaurantOwner, getSubscriptionStatus);

// Optional: Additional endpoints for updating or removing subscriptions could be added here

export default router;

//Optional: You can add more endpoints as needed
// Example: Update subscription details or remove a subscription

// Example: Update subscription (not implemented here)
// router.put('/subscription/:subscriptionId', isRestaurantOwner, updateSubscription);

// Example: Remove subscription (not implemented here)
// router.delete('/subscription/:subscriptionId', isRestaurantOwner, removeSubscription);
/* router.put('/subscription/:subscriptionId', verifyJWT, isRestaurantOwner, updateSubscription);

// Remove subscription
router.delete('/subscription/:subscriptionId', verifyJWT, isRestaurantOwner, removeSubscription);*/