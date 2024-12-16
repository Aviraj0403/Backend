import express from 'express';
import {
    registerSuperAdmin,
    loginSuperAdmin,
    registerRestaurantOwner,
    loginRestaurantOwner,
    checkSuperAdmin,
    logoutUser,
    refreshToken,
    requestOtp,
    verifyOtpAndChangePassword,
    // requestPasswordReset,
    // resetPassword
    // refreshAccessToken
} from '../controllers/auth.controller.js';
import { verifyJWT, isSuperAdmin, csrfProtectionMiddleware } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';
const router = express.Router();
 
// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 5 requests per windowMs
    message: "Too many login attempts, please try again later."
});

// router.use(csrfProtectionMiddleware)
// Super Admin routes
router.post('/refresh-token', refreshToken);
router.post('/superadmin/register', verifyJWT, isSuperAdmin, csrfProtectionMiddleware, registerSuperAdmin);
router.post('/superadmin/login',  loginLimiter,loginSuperAdmin); // Login doesn't need JWT
// router.route("/refresh-token").post(refreshAccessToken)
// Protected route to check if the user is a super admin
router.get('/superadmin/check', verifyJWT, isSuperAdmin, checkSuperAdmin);

// Restaurant Owner routes (Protected)
router.post('/restaurantowner/register', verifyJWT, isSuperAdmin, registerRestaurantOwner);
router.post('/restaurantowner/login', loginLimiter,loginRestaurantOwner); // Login doesn't need JWT

// Optional: Add more super admin-specific routes
router.get('/superadmin/dashboard', verifyJWT, isSuperAdmin, (req, res) => {
    res.status(200).json({ message: 'Welcome to the Super Admin Dashboard' });
});
router.post('/logout', csrfProtectionMiddleware, logoutUser);

// router.post('/request-password-reset', requestPasswordReset);

// // Route for resetting password
// router.post('/reset-password', resetPassword);
// More routes can be added here...
//SMS_OTP 

router.post('/request-otp', requestOtp);
router.post('/verify-otp-and-reset-password', verifyOtpAndChangePassword);
export default router;
