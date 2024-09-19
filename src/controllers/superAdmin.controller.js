// import { MasterUser } from '../models/masterUser.model.js';
// import { Restaurant } from '../models/restaurant.model.js'; // Assuming you have a Restaurant model
// import { ApiError } from '../utils/ApiError.js';
// import { asyncHandler } from '../utils/asyncHandler.js';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

// // Register a new restaurant owner (only for super admin)
// export const registerRestaurantOwner = asyncHandler(async (req, res) => {
//     const { username, email, password } = req.body;

//     // Validate input
//     if (!username || !email || !password) {
//         throw new ApiError(400, "All fields are required");
//     }

//     // Check if the email already exists
//     const existingUser = await MasterUser.findOne({ email });
//     if (existingUser) {
//         return res.status(400).json({ message: 'Email already in use' });
//     }

//     const user = new MasterUser({
//         username,
//         email,
//         password, // Password will be hashed in the pre-save hook
//         role: 'restaurantOwner',
//     });

//     await user.save();
//     res.status(201).json({ message: 'Restaurant owner created successfully' });
// });

// // Login for restaurant owner
// export const loginRestaurantOwner = asyncHandler(async (req, res) => {
//     const { emailOrUsername, password } = req.body;

//     // Validate input
//     if (!emailOrUsername || !password) {
//         throw new ApiError(400, "Email/Username and password are required");
//     }

//     // Find user by either email or username
//     const user = await MasterUser.findOne({
//         $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
//     });

//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

//     // Check password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//         throw new ApiError(401, "Invalid credentials");
//     }

//     // Generate tokens
//     const accessToken = user.generateAccessToken();
//     const refreshToken = user.generateRefreshToken();

//     // Store refresh token
//     user.refreshToken = refreshToken; 
//     await user.save({ validateBeforeSave: false });

//     // Set cookie options
//     const options = {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
//     };

//     // Send response
//     return res
//         .status(200)
//         .cookie("accessToken", accessToken, options)
//         .cookie("refreshToken", refreshToken, options)
//         .json({
//             message: "Login successful",
//             user: { id: user._id, username: user.username },
//             accessToken,
//             refreshToken
//         });
// });

// // Get all restaurant owners (for super admin)
// export const getAllRestaurantOwners = asyncHandler(async (req, res) => {
//     try {
//         const users = await MasterUser.find({ role: 'restaurantOwner' });
//         res.json(users);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching restaurant owners', error });
//     }
// });

// // Add subscription for a restaurant owner
// export const addSubscription = asyncHandler(async (req, res) => {
//     const { restaurantId, startDate, endDate, plan } = req.body;
//     const userId = req.user._id; // Access user ID from the verified token

//     try {
//         // Check if the restaurant exists and is owned by the user
//         const restaurant = await Restaurant.findById(restaurantId);
//         if (!restaurant || restaurant.ownerId.toString() !== userId) {
//             return res.status(403).json({ message: 'Unauthorized access to this restaurant.' });
//         }

//         const user = await MasterUser.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         user.subscriptionRecords.push({ restaurantId, startDate, endDate, plan });
//         await user.save();

//         res.status(201).json({ message: 'Subscription added successfully', subscription: user.subscriptionRecords });
//     } catch (error) {
//         res.status(500).json({ message: 'Error adding subscription', error });
//     }
// });

// // Get subscription status for a restaurant
// export const getSubscriptionStatus = asyncHandler(async (req, res) => {
//     const { restaurantId } = req.params;
//     const userId = req.user._id; // Access user ID from the verified token

//     try {
//         // Check if the restaurant exists and is owned by the user
//         const restaurant = await Restaurant.findById(restaurantId);
//         if (!restaurant || restaurant.ownerId.toString() !== userId) {
//             return res.status(403).json({ message: 'Unauthorized access to this restaurant.' });
//         }

//         const user = await MasterUser.findById(userId);
//         const subscription = user.subscriptionRecords.find(record => 
//             record.restaurantId.toString() === restaurantId
//         );

//         if (!subscription) {
//             return res.status(404).json({ message: 'No subscription found for this restaurant.' });
//         }

//         const now = new Date();
//         if (now > subscription.endDate) {
//             subscription.status = 'expired';
//             await user.save(); // Save updated status
//         }

//         res.json({ status: subscription.status });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching subscription status', error });
//     }
// });
