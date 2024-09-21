import express from 'express';
import {
    registerSuperAdmin,
    loginSuperAdmin,
    registerRestaurantOwner,
    loginRestaurantOwner,
    checkSuperAdmin, // Import the checkSuperAdmin controller
} from '../controllers/auth.controller.js';
import { verifyJWT, isSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Super Admin routes
router.post('/superadmin/register', registerSuperAdmin);
router.post('/superadmin/login', loginSuperAdmin);

// Check if user is a super admin (Protected)
router.get('/check-superadmin', verifyJWT, isSuperAdmin, checkSuperAdmin);

// Restaurant Owner routes (Protected)
router.post('/restaurantowner/register', verifyJWT, isSuperAdmin, registerRestaurantOwner); // Only super admin can register restaurant owners
router.post('/restaurantowner/login', loginRestaurantOwner);

// Optional: Add any additional routes as needed

export default router;
