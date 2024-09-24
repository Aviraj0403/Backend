import mongoose from 'mongoose';
import { Restaurant } from '../models/restaurant.model.js';
import { RestaurantOwner } from '../models/masterUser.model.js';
import nodemailer from 'nodemailer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const { ObjectId } = mongoose;

// Create a reusable transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Get all active restaurants owned by restaurant owners (excluding super admins)
export const getAllRestaurants = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Prepare query object for restaurants
    const query = {};

    // If a subscription status is provided, add it to the query
    if (status) {
        query.subscriptionRecords = { $elemMatch: { status } };
    }

    // Fetch restaurants where owner is not a super admin
    const restaurants = await Restaurant.find(query)
        .populate({
            path: 'ownerId',
            match: { role: { $ne: 'superAdmin' } }, // Exclude super admins
            select: 'username email',
        })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    // Filter out any restaurants that were not associated with valid owners
    const filteredRestaurants = restaurants.filter(restaurant => restaurant.ownerId);

    // Count total number of valid restaurants for pagination purposes
    const totalRestaurants = await Restaurant.countDocuments({
        ...query,
        ownerId: { $ne: null }, // Ensuring there is an owner
    });

    if (filteredRestaurants.length === 0) {
        return res.status(404).json({ message: 'No restaurants found' });
    }

    res.json({
        total: totalRestaurants,
        page: pageNumber,
        limit: limitNumber,
        restaurants: filteredRestaurants,
    });
});

// Send Subscription Renewal Alert
export const sendSubscriptionAlert = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId).populate('ownerId', 'username email');

    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    const ownerEmail = restaurant.ownerId.email;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: ownerEmail,
        subject: 'Subscription Renewal Reminder',
        text: `Dear ${restaurant.ownerId.username},\nYour subscription for ${restaurant.name} is about to expire. Please renew it soon to avoid any service interruptions.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Subscription renewal reminder sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send subscription reminder', error: error.message });
    }
});

// Extend subscription for a restaurant
export const extendSubscription = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;
    const { additionalMonths } = req.body;

    if (!additionalMonths || typeof additionalMonths !== 'number' || additionalMonths <= 0) {
        throw new ApiError(400, 'Invalid input: additionalMonths must be a positive number');
    }

    const owner = await RestaurantOwner.findOne({ 'subscriptionRecords.restaurantId': restaurantId });
    if (!owner) {
        throw new ApiError(404, 'Restaurant owner not found');
    }

    const subscription = owner.subscriptionRecords.find(sub => sub.restaurantId.toString() === restaurantId);
    if (!subscription) {
        throw new ApiError(404, 'Subscription not found');
    }

    // Extend subscription logic
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

    subscription.endDate = newEndDate;
    await owner.save();

    res.json({ message: 'Subscription extended successfully', newExpiryDate: newEndDate });
});

// Retrieve Restaurant Owner Profile
 
export const getRestaurantOwnerProfile = asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    console.log("Owner ID:", ownerId);
    console.log("User from request:", req.user);

    // Ensure the user is authenticated
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        console.log("Invalid ObjectId format");
        throw new ApiError(400, "Invalid owner ID format");
    }

    try {
        // Fetch the owner with related restaurants and subscriptions
        const ownerProfile = await RestaurantOwner.findById(ownerId)
            .populate('restaurants', 'name location') // Include more restaurant fields if needed
            .populate({
                path: 'subscriptionRecords.restaurantId', // Path to restaurant in subscription records
                model: 'Restaurant', // Ensure this matches your restaurant model name
                select: 'name status location', // Specify fields to include
            });

        if (!ownerProfile) {
            console.log("No owner profile found for ID:", ownerId);
            throw new ApiError(404, "Restaurant owner not found");
        }

        // Include all necessary fields from the MasterUser schema
        const responseData = {
            _id: ownerProfile._id,
            username: ownerProfile.username,
            email: ownerProfile.email,
            restaurants: ownerProfile.restaurants,
            subscriptionRecords: ownerProfile.subscriptionRecords,
            createdAt: ownerProfile.createdAt,
            updatedAt: ownerProfile.updatedAt,
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching owner profile:", error);
        throw new ApiError(500, "An error occurred while fetching the owner profile: " + error.message);
    }
});


 // Adjust the path as necessary

// Get restaurant details by ID
export const getRestaurantById = async (req, res) => {
    const { restaurantId } = req.params;
    
    try {
        const restaurant = await Restaurant.findById(restaurantId).populate('ownerId', 'username').populate('managerId', 'username').populate('menuItems');
        
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        res.status(200).json({ restaurant });
    } catch (error) {
        console.error("Error fetching restaurant:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
