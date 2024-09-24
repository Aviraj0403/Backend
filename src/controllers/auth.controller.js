import { MasterUser, RestaurantOwner } from '../models/masterUser.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Restaurant } from '../models/restaurant.model.js';
import crypto from 'crypto';

// Check if user exists by email
const userExists = async (email) => {
    return await MasterUser.findOne({ email });
};

// Generate a CSRF token
const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Handle token generation and cookie setting
const setTokensAndCookies = async (res, user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    // Save the refresh token in the database
    await user.save({ validateBeforeSave: false });

    // Generate CSRF token
    const csrfToken = generateCsrfToken();
    console.log("CSRF Token set in cookie:", csrfToken);
    // Set cookies
    res
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            sameSite: 'Strict',
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'Strict',
        })
        .cookie("csrfToken", csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'Strict',
        })
        .status(200)
        .json({ message: "Login successful", user: { id: user._id, username: user.username }, csrfToken });
};

// Check if the user is a super admin
export const checkSuperAdmin = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'superAdmin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json({ message: 'Authorized' });
};

// Super Admin Registration
export const registerSuperAdmin = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = await userExists(email);
    if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
    }

    const user = new MasterUser({
        username,
        email,
        password,
        role: 'superAdmin'
    });

    await user.save();
    res.status(201).json({ message: 'Super admin registered successfully' });
});

// Super Admin Login
export const loginSuperAdmin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await MasterUser.findOne({ username, role: 'superAdmin' });
    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid credentials");
    }

    setTokensAndCookies(res, user);
});

// Login for Restaurant Owner
export const loginRestaurantOwner = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await MasterUser.findOne({ email, role: 'restaurantOwner' });
    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid credentials");
    }

    setTokensAndCookies(res, user);
});

// Register a new Restaurant Owner (only for Super Admin)
export const registerRestaurantOwner = asyncHandler(async (req, res) => {
    const { username, email, password, restaurantName, restaurantLocation, contactInfo } = req.body;

    if (!username || !email || !password || !restaurantName || !restaurantLocation) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await userExists(email);
    if (existingUser) {
        throw new ApiError(400, 'Email already in use');
    }

    // Check if the restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ name: restaurantName });
    if (existingRestaurant) {
        throw new ApiError(400, 'Restaurant name already in use');
    }

    const user = new RestaurantOwner({
        username,
        email,
        password,
    });

    await user.save();

    const restaurant = new Restaurant({
        name: restaurantName,
        ownerId: user._id,
        location: restaurantLocation,
        contactInfo: contactInfo || {},
    });

    await restaurant.save();

    user.restaurants.push(restaurant._id);
    await user.save();

    // Initialize subscription for the restaurant
    const subscription = {
        restaurantId: restaurant._id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'active',
        plan: 'monthly',
    };

    user.subscriptionRecords.push(subscription);
    await user.save();

    res.status(201).json({ message: 'Restaurant owner and restaurant created successfully', ownerId: user._id, restaurantId: restaurant._id });
});

// Logout function
// Logout function
export const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id; // Assuming req.user is set by your JWT middleware

    if (userId) {
        await MasterUser.findByIdAndUpdate(userId, { refreshToken: null }); // Revoke the refresh token in DB
    }

    res.clearCookie("accessToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: 'Strict' });
    res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: 'Strict' });
    res.clearCookie("csrfToken", { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: 'Strict' });

    return res.status(200).json({ message: "Logged out successfully" });
});

