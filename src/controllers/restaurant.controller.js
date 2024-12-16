import mongoose from 'mongoose';
import { Restaurant } from '../models/restaurant.model.js';
import { RestaurantOwner,ROLES } from '../models/masterUser.model.js';
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

// Constants for HTTP status codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

// Get all active restaurants owned by restaurant owners (excluding super admins)
export const getAllRestaurants = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Prepare query object for restaurants
    const query = status ? { subscriptionRecords: { $elemMatch: { status } } } : {};

    // Fetch restaurants excluding super admins
    const restaurants = await Restaurant.find(query)
        .populate({
            path: 'ownerId',
            match: { role: { $ne: 'superAdmin' } },
            select: 'username email',
        })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(); // Optimize for read operations

    const filteredRestaurants = restaurants.filter(restaurant => restaurant.ownerId);
    const totalRestaurants = await Restaurant.countDocuments({ ...query, ownerId: { $ne: null } });

    if (filteredRestaurants.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'No restaurants found' });
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

    const restaurant = await Restaurant.findById(restaurantId).populate('ownerId', 'username email').lean();

    if (!restaurant) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Restaurant not found' });
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
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to send subscription reminder', error: error.message });
    }
});

// Extend subscription for a restaurant
export const extendSubscription = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;
    const { additionalMonths } = req.body;

    if (!additionalMonths || typeof additionalMonths !== 'number' || additionalMonths <= 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid input: additionalMonths must be a positive number');
    }

    const owner = await RestaurantOwner.findOne({ 'subscriptionRecords.restaurantId': restaurantId });
    if (!owner) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Restaurant owner not found');
    }

    const subscription = owner.subscriptionRecords.find(sub => sub.restaurantId.toString() === restaurantId);
    if (!subscription) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Subscription not found');
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

    // Ensure the user is authenticated
    if (!req.user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not authenticated");
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid owner ID format");
    }

    const ownerProfile = await RestaurantOwner.findById(ownerId)
        .populate('restaurants', 'name location')
        .populate({
            path: 'subscriptionRecords.restaurantId',
            model: 'Restaurant',
            select: 'name'
        })
        .lean(); // Optimize for read operations

    if (!ownerProfile) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Restaurant owner not found");
    }

    // Construct response data
    const responseData = {
        username: ownerProfile.username,
        email: ownerProfile.email,
        role: ownerProfile.role,
        contactInfo: {
            phone: ownerProfile.contactInfo?.phone || 'N/A',
            email: ownerProfile.contactInfo?.email || 'N/A'
        },
        restaurants: ownerProfile.restaurants.map(restaurant => ({
            _id: restaurant._id,
            name: restaurant.name,
            location: restaurant.location
        })),
        subscriptionRecords: ownerProfile.subscriptionRecords.map(record => ({
            _id: record._id,
            restaurantId: {
                name: record.restaurantId?.name || 'N/A'
            },
            status: record.status,
            plan: record.plan,
            paymentStatus: record.paymentStatus,
            endDate: record.endDate.toISOString().split('T')[0]
        }))
    };

    res.status(HTTP_STATUS.OK).json(responseData);
});

// Get restaurant details by ID
export const getRestaurantById = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId)
        .populate('ownerId', 'username')
        .populate('managerId', 'username')
        .populate('menuItems')
        .lean(); // Optimize for read operations

    if (!restaurant) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Restaurant not found' });
    }

    res.status(HTTP_STATUS.OK).json({ restaurant });
});

// Update Restaurant Owner Profile
export const updateRestaurantOwnerProfile = asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    const { username, email, contactInfo } = req.body;

    // Ensure the user is authenticated
    if (!req.user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not authenticated");
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid owner ID format");
    }

    const ownerProfile = await RestaurantOwner.findByIdAndUpdate(
        ownerId,
        { username, email, contactInfo },
        { new: true, runValidators: true }
    );

    if (!ownerProfile) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Restaurant owner not found");
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Profile updated successfully', ownerProfile });
});

// Update Subscription Details
; // Adjust the import based on your project structure

export const updateSubscriptionDetails = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params; // Get restaurantId from URL parameters
    const { paymentMethod, status, plan, paymentStatus } = req.body;

    // Ensure user is authenticated and is a super admin
    if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // Find the owner associated with the restaurantId in the subscription records
    const owner = await RestaurantOwner.findOne({ 'subscriptionRecords.restaurantId': restaurantId });
    
    if (!owner) {
        return res.status(404).json({ message: 'Restaurant owner not found' });
    }

    // Find the specific subscription by restaurantId
    const subscription = owner.subscriptionRecords.find(sub => sub.restaurantId.toString() === restaurantId);
    
    if (!subscription) {
        return res.status(404).json({ message: 'No subscription found for the given restaurant' });
    }

    // Update subscription details
    subscription.paymentMethod = paymentMethod || subscription.paymentMethod; 
    subscription.status = status || subscription.status; 
    subscription.plan = plan || subscription.plan; 
    subscription.paymentStatus = paymentStatus || subscription.paymentStatus;

    // Save the updated owner document
    await owner.save();

    // Respond with the updated subscription, including the restaurant ID
    res.status(200).json({
        message: 'Subscription updated successfully',
        subscription: {
            ...subscription.toObject(), // Convert to plain object
            restaurantId: subscription.restaurantId // Automatically include restaurant ID from subscription
        }
    });
});

export async function addRestaurantToOwner(restaurantOwnerId, restaurantId) {
    try {
        // Find the RestaurantOwner by ID
        const restaurantOwner = await RestaurantOwner.findById(restaurantOwnerId);
        if (!restaurantOwner) {
            throw new Error('Restaurant Owner not found');
        }

        // Add restaurant to the owner
        await restaurantOwner.addRestaurant(restaurantId);
        console.log('Restaurant added successfully to the owner!');
        return { message: 'Restaurant added successfully' };
    } catch (error) {
        console.error('Error adding restaurant:', error);
        throw new Error('Error adding restaurant to owner');
    }
}

// Function to create a new restaurant and associate it with the RestaurantOwner
export async function createRestaurantAndAssociate(restaurantData, restaurantOwnerId) {
    try {
        // Create the restaurant and associate it with the RestaurantOwner
        const newRestaurant = await RestaurantOwner.createRestaurant(restaurantData, restaurantOwnerId);
        console.log('Restaurant created and associated with the owner:', newRestaurant);
        return { message: 'Restaurant created and associated successfully', restaurant: newRestaurant };
    } catch (error) {
        console.error('Error creating and associating restaurant:', error);
        throw new Error('Error creating restaurant');
    }
}
