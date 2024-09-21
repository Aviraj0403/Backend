import express from 'express';
import {
    registerSuperAdmin,
    loginSuperAdmin,
    registerRestaurantOwner,
    loginRestaurantOwner,
} from '../controllers/auth.controller.js';
import { verifyJWT, isSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Super Admin routes
router.post('/superadmin/register', registerSuperAdmin);
router.post('/superadmin/login', loginSuperAdmin);

// Restaurant Owner routes (Protected)
router.post('/restaurantowner/register', verifyJWT, isSuperAdmin, registerRestaurantOwner); // Only super admin can register restaurant owners
router.post('/restaurantowner/login', loginRestaurantOwner);

// Optional: Add any additional routes as needed, such as for managing restaurant owners

export default router;
