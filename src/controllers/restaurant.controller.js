import { Restaurant } from '../models/restaurant.model.js';
import nodemailer from 'nodemailer';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create a reusable transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Get all restaurants with subscription status
export const getAllRestaurants = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find().populate('ownerId', 'username email');

    if (!restaurants || restaurants.length === 0) {
        return res.status(404).json({ message: 'No restaurants found' });
    }

    res.json(restaurants);
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
        return res.status(400).json({ message: 'Invalid input: additionalMonths must be a positive number' });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Logic to extend the subscription
    const currentExpiryDate = restaurant.subscriptionExpiryDate || new Date();
    const newExpiryDate = new Date(currentExpiryDate.setMonth(currentExpiryDate.getMonth() + additionalMonths));

    restaurant.subscriptionExpiryDate = newExpiryDate;
    await restaurant.save();

    res.json({ message: 'Subscription extended successfully', newExpiryDate });
});