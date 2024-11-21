import { Offer } from '../models/offer.model.js';
 // Adjust the import path as necessary
import mongoose from 'mongoose'; // Ensure mongoose is imported
import { ApiError } from '../utils/ApiError.js';
import { Restaurant } from '../models/restaurant.model.js';
import { MasterUser, ROLES } from '../models/masterUser.model.js'; 
import { ApiResponse } from '../utils/ApiResponse.js';
// 
export const addOffer = async (req, res, next) => {
    try {
        const { name, discountPercentage, startDate, endDate, status } = req.body;

        const user = req.user;

        // Check if user is authenticated
        if (!user) {
            throw new ApiError(401, 'User not authenticated.');
        }

        // Check if the user is authorized
        if (user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to add offers.');
        }

        // Retrieve the restaurant owned by the user
        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to add offers.');
        }

        const restaurantId = restaurantOwner.restaurants[0]; // Assuming one restaurant per owner

        // Input validation
        if (!name || discountPercentage === undefined || !startDate || !endDate) {
            throw new ApiError(400, 'Name, discount percentage, start date, and end date are required fields.');
        }

        // Create a new offer instance
        const newOffer = new Offer({
            name,
            discountPercentage,
            startDate,
            endDate,
            restaurantId,
            status,
        });

        // Handle optional image file
        if (req.file) {
            newOffer.image = req.file.path; // Save the image path if provided
        }

        // Save the offer to the database
        const savedOffer = await newOffer.save();

        // Update the restaurant with the new offer (if applicable)
        await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $push: { offers: savedOffer._id } }, // Assuming you want to keep track of offers in the restaurant document
            { new: true, lean: true }
        );

        // Send a successful response
        res.status(201).json(new ApiResponse(201, savedOffer, 'Offer added successfully.'));
    } catch (error) {
        console.error('Error adding offer:', error.message);
        next(new ApiError(500, 'Error adding offer', [error.message]));
    }
};

export const getOffers = async (req, res, next) => {
    try {
        const user = req.user;

        // Check if the user is a restaurant owner
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to view offers.');
        }

        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to view offers.');
        }
        const restaurantId = restaurantOwner.restaurants[0];

        const offers = await Offer.find({ restaurantId }).sort({ createdAt: -1 });

        res.status(200).json(new ApiResponse(200, offers, 'Offers retrieved successfully'));
    } catch (error) {
        console.error('Error fetching offers:', error.message);
        next(new ApiError(500, 'Error fetching offers', [error.message]));
    }
};
export const updateOffer = async (req, res, next) => {
    try {
        const { offerId } = req.params;
        const { name, discountPercentage, startDate, endDate, status } = req.body;

        const user = req.user;

        // Check if the user is authorized as a restaurant owner
        // if (!user || user.role !== 'RESTAURANT_OWNER') {
        //     throw new ApiError(403, 'You are not authorized to update offers.');
        // }

        // Retrieve the restaurant owned by the user
        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to update offers.');
        }

        const restaurantId = restaurantOwner.restaurants[0];

        // Find the offer by ID and ensure it belongs to the user's restaurant
        const offer = await Offer.findOne({ _id: offerId, restaurantId }).lean();
        if (!offer) {
            throw new ApiError(404, 'Offer not found or you do not have permission to update it.');
        }

        // Update fields
        const updatedOffer = await Offer.findByIdAndUpdate(
            offerId,
            { name, discountPercentage, startDate, endDate, status },
            { new: true, runValidators: true }
        );

        res.status(200).json(new ApiResponse(200, updatedOffer, 'Offer updated successfully.'));
    } catch (error) {
        console.error('Error updating offer:', error.message);
        next(new ApiError(500, 'Error updating offer', [error.message]));
    }
};
// Delete Offer

export const deleteOffer = async (req, res, next) => {
    try {
        const { offerId, restaurantId } = req.params;

        console.log("Restaurant ID: during delete", restaurantId);
        console.log("Offer ID: during delete", offerId);

        // Validate the IDs
        if (!mongoose.Types.ObjectId.isValid(offerId) || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Check if the offer belongs to the specific restaurant
        const offer = await Offer.findOne({ _id: offerId, restaurantId: restaurantId });
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found for this restaurant' });
        }

        // Remove the offer from the Offer collection
        await Offer.findByIdAndDelete(offerId);

        // Optionally remove the offer's ID from the restaurant's offers array, if applicable
        await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $pull: { offers: offerId } }, // Adjust field name as needed
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error.message);
        next(new ApiError(500, 'Error deleting offer', [error.message]));
    }
};
export const getActiveOffers = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        console.log('Restaurant ID received:', restaurantId);

        // Validate restaurantId
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ statusCode: 400, message: 'Invalid restaurant ID' });
        }

        // Get the current date for filtering active offers
        const currentDate = new Date();

        // Fetch active offers using aggregation pipeline
        const activeOffers = await Offer.aggregate([
            {
                $match: {
                    restaurantId: new mongoose.Types.ObjectId(restaurantId),
                    status: 'Active',
                    startDate: { $lte: currentDate }, // Ensure the offer has started
                    endDate: { $gte: currentDate }    // Ensure the offer has not ended
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    discountPercentage: 1,
                    startDate: 1,
                    endDate: 1,
                }
            }
        ]);

        console.log('Active Offers:', activeOffers);

        if (!activeOffers || activeOffers.length === 0) {
            return res.status(404).json({ statusCode: 404, data: [], message: 'No active offers found.' });
        }

        return res.status(200).json({ statusCode: 200, data: activeOffers, message: 'Active offers retrieved successfully.' });
    } catch (error) {
        console.error('Error fetching active offers:', error.message);
        next(error);
    }
};
export const getOfferById = async (req, res, next) => {
    try {
        const { offerId, restaurantId } = req.params;
        const user = req.user;

        // Check if the user is authorized as a restaurant owner
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to view offers.');
        }

        // Retrieve the restaurant owned by the user
        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to view offers.');
        }

        const restaurantIdFromOwner = restaurantOwner.restaurants[0];

        // Find the offer by ID and ensure it belongs to the user's restaurant
        const offer = await Offer.findOne({ _id: offerId, restaurantId: restaurantIdFromOwner }).lean();
        if (!offer) {
            throw new ApiError(404, 'Offer not found or you do not have permission to view it.');
        }

        res.status(200).json(new ApiResponse(200, offer, 'Offer retrieved successfully.'));
    } catch (error) {
        console.error('Error fetching offer by ID:', error.message);
        next(new ApiError(500, 'Error fetching offer by ID', [error.message]));
    }
};
