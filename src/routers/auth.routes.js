import express from 'express';
import {
    registerSuperAdmin,
    loginSuperAdmin,
    registerRestaurantOwner,
    loginRestaurantOwner,
    checkSuperAdmin,
} from '../controllers/auth.controller.js';
import { verifyJWT, isSuperAdmin, csrfProtectionMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Super Admin routes
router.post('/superadmin/register', verifyJWT, isSuperAdmin, csrfProtectionMiddleware, registerSuperAdmin);
router.post('/superadmin/login',  loginSuperAdmin); // Login doesn't need JWT

// Protected route to check if the user is a super admin
router.get('/superadmin/check', verifyJWT, isSuperAdmin, checkSuperAdmin);

// Restaurant Owner routes (Protected)
router.post('/restaurantowner/register', verifyJWT, isSuperAdmin, registerRestaurantOwner);
router.post('/restaurantowner/login', loginRestaurantOwner); // Login doesn't need JWT

// Optional: Add more super admin-specific routes
router.get('/superadmin/dashboard', verifyJWT, isSuperAdmin, (req, res) => {
    res.status(200).json({ message: 'Welcome to the Super Admin Dashboard' });
});

// More routes can be added here...

export default router;
