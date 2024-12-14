import { MasterUser, RestaurantOwner } from '../models/masterUser.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Restaurant } from '../models/restaurant.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const backendUrl = process.env.NODE_ENV === "production" ? process.env.BACKEND_URL_PROD : process.env.BACKEND_URL;
console.log("Backend URL is:", backendUrl);


// Check if user exists by email
const userExists = async (email) => {
    return await MasterUser.findOne({ email });
};
export const refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is missing' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await MasterUser.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = user.generateAccessToken();
        return res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

// Generate a CSRF token
const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Refresh Token
// export const refreshAccessToken = asyncHandler(async (req, res) => {
//     const refreshToken = req.cookies.refreshToken; // Get refresh token from cookies
//     if (!refreshToken) {
//         throw new ApiError(401, "Refresh token not found"); // No refresh token provided
//     }

//     // Verify the refresh token
//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     const user = await MasterUser.findById(decoded._id); // Find the user

//     if (!user) {
//         throw new ApiError(403, "Forbidden in refresh token"); // User not found
//     }

//     // Generate new access and refresh tokens
//     const accessToken = user.generateAccessToken(); // Use existing method
//     const newRefreshToken = user.generateRefreshToken(); // Generate new refresh token

//     user.refreshToken = newRefreshToken; // Update the refresh token in the user model
//     await user.save({ validateBeforeSave: false }); // Save the user with new refresh token

//     // Set new tokens in cookies
//     res.cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production", // Use secure in production
//         sameSite: 'Strict',
//         path: '/'
//     });

//     res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: 'Strict',
//         path: '/'
//     });

//     res.status(200).json({ accessToken, refreshToken: refreshToken }); // Send new tokens
// });

// Handle token generation and cookie setting
const setTokensAndCookies = async (res, user,restaurantId) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken(); // Generate the refresh token
    console.log("Access Token:", accessToken);  // Log the access token
    console.log("Refresh Token:", refreshToken);  // Log the refresh token
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
            secure: process.env.NODE_ENV === "production", // Use secure in production
            maxAge: 3600000, // 1 ho
            sameSite: 'None',
            path: '/'
        })
        .cookie("refreshToken", refreshToken, { // Use refreshToken instead of refreshAccessToken
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'None',
            path: '/'
        })
        .cookie("csrfToken", csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'None',
            path: '/'
        })
        .status(200)
        .json({ 
            message: "Login successful", 
            user: { id: user._id, username: user.username, restaurantId }, 
            csrfToken, 
            accessToken, 
            refreshToken // Correctly send the refreshToken
        });
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
      

    // Fetch the associated restaurant
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
        throw new ApiError(404, "Restaurant not found");
    }

    setTokensAndCookies(res, user, restaurant._id); // Pass restaurantId here
    // setTokensAndCookies(res, user);
});

// Register a new Restaurant Owner (only for Super Admin)
export const registerRestaurantOwner = asyncHandler(async (req, res) => {
    const { username, email, password, restaurantName, restaurantLocation, contactInfo, subscription } = req.body;

    // Validate required fields
    if (!username || !email || !password || !restaurantName || !restaurantLocation || !subscription || !subscription.paymentMethod) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await userExists(email);
    if (existingUser) {
        throw new ApiError(400, 'Email already in use');
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

    const subscriptionRecord = {
        restaurantId: restaurant._id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'active',
        plan: subscription.plan,
        paymentMethod: subscription.paymentMethod,
    };

    user.subscriptionRecords.push(subscriptionRecord);
    await user.save();

    res.status(201).json({
        message: 'Restaurant owner and restaurant created successfully',
        ownerId: user._id,
        restaurantId: restaurant._id,
    });
});

// Logout function
export const logoutUser = asyncHandler(async (req, res) => {
    try {
        // CSRF Token Validation - You can include this if CSRF validation is needed for logout
        const csrfToken = req.body.csrfToken || req.headers['csrf-token'];
        console.log("c",csrfToken);
        if (!csrfToken) {
            return res.status(400).json({ message: 'CSRF token is missing' });
        }

        // Here, you can validate the CSRF token if needed

        // Clear cookies related to authentication and CSRF
        res.clearCookie("accessToken", { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", // Ensure secure cookies in production
            sameSite: 'None', 
            path: '/' 
        });
        res.clearCookie("refreshToken", { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: 'None', 
            path: '/' 
        });
        res.clearCookie("csrfToken", { 
            httpOnly: false, // CSRF token doesn't need httpOnly
            secure: process.env.NODE_ENV === "production", 
            sameSite: 'None', 
            path: '/' 
        });

        // Send success response
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({ message: "An error occurred during logout." });
    }
});

