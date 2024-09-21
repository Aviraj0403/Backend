import { MasterUser, RestaurantOwner } from '../models/masterUser.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Restaurant } from '../models/restaurant.model.js';

// Check if user exists by email
const userExists = async (email) => {
    return await MasterUser.findOne({ email });
};

// Handle token generation and cookie setting
const setTokensAndCookies = async (res, user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    // Save the refresh token in the database
    await user.save({ validateBeforeSave: false }); // Await the save

    return res
        .status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'Strict',
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'Strict',
        })
        .json({ message: "Login successful", user: { id: user._id, username: user.username }, accessToken });
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
        password, // Password will be hashed in pre-save hook
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

    // Create a Restaurant Owner
    const user = new RestaurantOwner({
        username,
        email,
        password, // Password will be hashed in pre-save hook
    });

    await user.save();

    // Create the restaurant
    const restaurant = new Restaurant({
        name: restaurantName,
        ownerId: user._id,
        location: restaurantLocation,
        contactInfo: contactInfo || {},
    });

    await restaurant.save();

    // Associate restaurant with the owner
    user.restaurants.push(restaurant._id);
    await user.save();

    // Optionally, initialize subscription for the restaurant
    const subscription = {
        restaurantId: restaurant._id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // One month subscription
        status: 'active',
        plan: 'monthly',
    };

    user.subscriptionRecords.push(subscription);
    await user.save();

    res.status(201).json({ message: 'Restaurant owner and restaurant created successfully', ownerId: user._id, restaurantId: restaurant._id });
});
