import express from 'express';
import {
    registerSuperAdmin,
    loginSuperAdmin,
    registerRestaurantOwner,
    loginRestaurantOwner,
} from '../controllers/auth.controller.js';
import { verifyJWT, isSuperAdmin } from '../middleware/auth.middleware.js'; // Ensure middleware is imported

const router = express.Router();

// Register and login for Super Admin
router.post('/superadmin/register', registerSuperAdmin);
router.post('/superadmin/login', loginSuperAdmin);

// Register and login for Restaurant Owner
router.post('/restaurantowner/register', verifyJWT, isSuperAdmin, registerRestaurantOwner); // Protected route for super admin
router.post('/restaurantowner/login', loginRestaurantOwner);

export default router;
