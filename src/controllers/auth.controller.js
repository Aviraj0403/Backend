import { MasterUser } from '../models/masterUser.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken'; // Make sure to import jwt

// Super Admin Registration
export const registerSuperAdmin = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = await MasterUser.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
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
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Use the method from the model to check the password
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Token generation logic
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res
        .status(200)
        .cookie("accessToken", accessToken, { httpOnly: true })
        .cookie("refreshToken", refreshToken, { httpOnly: true })
        .json({ message: "Login successful", user: { id: user._id, username: user.username } });
});

// Login for Restaurant Owner
export const loginRestaurantOwner = asyncHandler(async (req, res) => {
    const { emailOrUsername, password } = req.body;

    const user = await MasterUser.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        role: 'restaurantOwner'
    });

    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Use the method from the model to check the password
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res
        .status(200)
        .cookie("accessToken", accessToken, { httpOnly: true })
        .cookie("refreshToken", refreshToken, { httpOnly: true })
        .json({ message: "Login successful", user: { id: user._id, username: user.username } });
});

// Register a new Restaurant Owner (only for Super Admin)
export const registerRestaurantOwner = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await MasterUser.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
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
export const getAllRestaurantOwners = asyncHandler(async (req, res) => {
    const users = await MasterUser.find({ role: 'restaurantOwner' });
    res.json(users);
});
