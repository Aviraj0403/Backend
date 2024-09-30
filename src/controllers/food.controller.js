import Food from '../models/food.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Restaurant } from '../models/restaurant.model.js';
import { MasterUser, ROLES } from '../models/masterUser.model.js'; 
import mongoose from 'mongoose';

// Controller to add a food item (restricted to restaurant owners)
export const addFoodItem = async (req, res, next) => {
    try {
        const { name, description, price, category, cookTime, itemType, variety, isFeatured, isRecommended, status, imageUrl } = req.body;

        const user = req.user;

        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to add food items.');
        }

        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to add food items.');
        }

        const restaurantId = restaurantOwner.restaurants[0];

        // Input validation
        if (!name || !price || !category || !variety) {
            throw new ApiError(400, 'Name, price, category, and variety are required fields.');
        }

        const newFood = new Food({
            name,
            description,
            price,
            category,
            cookTime,
            itemType,
            variety, // Include the variety field
            isFeatured,
            isRecommended,
            status,
            imageUrl,
            restaurantId,
        });

        const [savedFood] = await Promise.all([
            newFood.save(),
            Restaurant.findByIdAndUpdate(
                restaurantId,
                { $push: { menuItems: newFood._id } },
                { new: true, lean: true }
            )
        ]);

        res.status(201).json(new ApiResponse(201, savedFood, 'Food item added successfully'));
    } catch (error) {
        console.error('Error adding food item:', error.message);
        next(new ApiError(500, 'Error adding food item', [error.message]));
    }
};

// Controller to get all food items (public access)

export const getAllFoods = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        console.log("Restaurant ID:", restaurantId);

        // Validate the restaurantId format
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: 'Invalid restaurant ID format' });
        }

        const foods = await Food.aggregate([
            {
                $match: {
                    restaurantId: new mongoose.Types.ObjectId(restaurantId) // Use index for matching
                }
            },
            {
                $lookup: {
                    from: 'restaurants', // The collection name for restaurants
                    localField: 'restaurantId',
                    foreignField: '_id',
                    as: 'restaurantDetails'
                }
            },
            {
                $unwind: {
                    path: '$restaurantDetails',
                    preserveNullAndEmptyArrays: true // Optional
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    price: 1,
                    category: 1,
                    cookTime: 1,
                    itemType: 1,
                    variety: 1,
                    isFeatured: 1,
                    isRecommended: 1,
                    status: 1,
                    imageUrl: 1,
                    // restaurant: {
                    //     name: '$restaurantDetails.name',
                    //     location: '$restaurantDetails.location'
                    // }
                }
            },
            {
                $sort: { createdAt: -1 } // Optional: Sort by creation date
            }
        ]);

        if (!foods.length) {
            return res.status(404).json({ message: 'No food items found for this restaurant' });
        }

        res.status(200).json({ success: true, data: foods });
    } catch (error) {
        next(error);
    }
};


// Controller to get a single food item by ID (public access)
export const getFoodById = async (req, res, next) => {
    try {
        const food = await Food.findById(req.params.id).populate('restaurantId');
        if (food) {
            res.status(200).json(new ApiResponse(200, food, 'Food item fetched successfully'));
        } else {
            next(new ApiError(404, 'Food item not found'));
        }
    } catch (error) {
        console.error('Error fetching food item:', error.message);
        next(new ApiError(500, 'Error fetching item', [error.message]));
    }
};

// Controller to update a food item by ID (restricted to restaurant owners)
export const updateFoodById = async (req, res, next) => {
    try {
        const { id, restaurantId } = req.params;
        const updates = req.body;

        console.log("Restaurant ID: during update", restaurantId);
        console.log("Food ID: during update", id);

        // Validate the IDs
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Check if the food item belongs to the specific restaurant
        const food = await Food.findOne({ _id: id, restaurantId: restaurantId });
        if (!food) {
            return res.status(404).json({ message: 'Food item not found for this restaurant' });
        }

        // Update food details
        const updatedFood = await Food.findByIdAndUpdate(id, updates, { new: true }).populate('restaurantId');

        res.status(200).json(new ApiResponse(200, updatedFood, 'Food item updated successfully'));
    } catch (error) {
        console.error('Error updating food item:', error.message);
        next(new ApiError(500, 'Error updating item', [error.message]));
    }
};



// Controller to remove a food item (restricted to restaurant owners)

export const removeFood = async (req, res, next) => {
    try {
        const { id, restaurantId } = req.params;
        console.log("Restaurant ID: during remove", restaurantId);
        console.log("Food ID: during remove", id);

        // Validate the IDs
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Check if the food item belongs to the specific restaurant
        const food = await Food.findOne({ _id: id, restaurantId: restaurantId });
        if (!food) {
            return res.status(404).json({ message: 'Food item not found for this restaurant' });
        }

        // Remove the food item from the Food collection
        await Food.findByIdAndDelete(id);

        // Remove the food item's ID from the restaurant's menuItems array
        await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $pull: { menuItems: id } },
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Food item removed successfully' });
    } catch (error) {
        console.error('Error removing food item:', error.message);
        next(new ApiError(500, 'Error removing item', [error.message]));
    }
};



// Controller to get food items by category and optionally by itemType (public access)
export const getFoodsByCategory = async (req, res, next) => {
    try {
        const { category, itemType } = req.params;

        const query = {};
        if (category && category !== 'All') {
            query.category = category;
        }
        if (itemType && itemType !== 'All') {
            query.itemType = itemType;
        }

        const foods = await Food.find(query).populate('restaurantId');
        res.status(200).json(new ApiResponse(200, foods, 'Food items fetched successfully'));
    } catch (error) {
        console.error('Error fetching food items:', error.message);
        next(new ApiError(500, 'Error fetching data', [error.message]));
    }
};

// Additional controller to get food items by variety (public access)
export const getFoodsByVariety = async (req, res, next) => {
    try {
        const { variety } = req.params;

        const query = {};
        if (variety && variety !== 'All') {
            query.variety = variety;
        }

        const foods = await Food.find(query).populate('restaurantId');
        res.status(200).json(new ApiResponse(200, foods, 'Food items fetched successfully'));
    } catch (error) {
        console.error('Error fetching food items by variety:', error.message);
        next(new ApiError(500, 'Error fetching data', [error.message]));
    }
};
