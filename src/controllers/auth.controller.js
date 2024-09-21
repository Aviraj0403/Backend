import { MasterUser } from '../models/masterUser.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Check if user exists by email
const userExists = async (email) => {
    return await MasterUser.findOne({ email });
};

// Handle token generation and cookie setting
const setTokensAndCookies = (res, user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    // Save the refresh token in the database
    user.save({ validateBeforeSave: false });

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
        .json({ message: "Login successful", user: { id: user._id, username: user.username } });
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
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await userExists(email);
    if (existingUser) {
        throw new ApiError(400, 'Email already in use');
    }

    const user = new MasterUser({
        username,
        email,
        password, // Password will be hashed in pre-save hook
        role: 'restaurantOwner',
    });

    await user.save();
    res.status(201).json({ message: 'Restaurant owner created successfully' });
});

// Get all Restaurant Owners (for Super Admin)
// Uncomment this if needed
// export const getAllRestaurantOwners = asyncHandler(async (req, res) => {
//     const users = await MasterUser.find({ role: 'restaurantOwner' });
//     res.json(users);
// });
