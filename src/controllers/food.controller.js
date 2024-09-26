import Food from '../models/food.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { MasterUser, ROLES } from '../models/masterUser.model.js'; // Ensure to import the user model

// Controller to add a new food item (restricted to restaurant owners)
export const addFoodItem = async (req, res, next) => {
    try {
        const { name, description, price, category, cookTime, itemType, isFeatured, isRecommended, status, imageUrl } = req.body;

        // Extract logged-in user information from `req.user` (after authentication middleware)
        const user = req.user;

        // Check if the logged-in user is a restaurant owner
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to add food items.');
        }

        // Find the restaurant owned by the logged-in user
        const restaurantOwner = await MasterUser.findById(user._id).populate('restaurants');
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to add food items.');
        }

        const restaurantId = restaurantOwner.restaurants[0]._id; // Use the first restaurant owned by the user

        // Input validation
        if (!name || !price || !category) {
            throw new ApiError(400, 'Name, price, and category are required fields.');
        }

        // Create the new food item
        const newFood = new Food({
            name,
            description,
            price,
            category,
            cookTime,
            itemType,
            isFeatured,
            isRecommended,
            status,
            imageUrl,
            restaurantId, // Automatically assign the restaurantId from the logged-in user
        });

        // Save the new food item to the database
        const savedFood = await newFood.save();
        res.status(201).json(new ApiResponse(201, savedFood, 'Food item added successfully'));
    } catch (error) {
        console.error('Error adding food item:', error.message);
        next(new ApiError(500, 'Error adding food item', [error.message]));
    }
};

// Controller to get all food items (public access)
export const getAllFoods = async (req, res, next) => {
    try {
        const foods = await Food.find().populate('restaurantId'); // Populate restaurant details
        res.status(200).json(new ApiResponse(200, foods, 'Food items fetched successfully'));
    } catch (error) {
        console.error('Error fetching food list:', error.message);
        next(new ApiError(500, 'Error fetching data', [error.message]));
    }
};

// Controller to get a single food item by ID (public access)
export const getFoodById = async (req, res, next) => {
    try {
        const food = await Food.findById(req.params.id).populate('restaurantId'); // Populate restaurant details
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
        const { id } = req.params;
        const updates = req.body; // Capture all updates

        const user = req.user;

        // Check if the logged-in user is authorized to update the food item (restaurant owner)
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to update this food item.');
        }

        const food = await Food.findById(id).populate('restaurantId');
        if (!food || !food.restaurantId.equals(user.restaurants[0]._id)) {
            throw new ApiError(403, 'You can only update food items of your restaurant.');
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
        const { id } = req.params;

        const user = req.user;

        // Check if the logged-in user is authorized to delete the food item (restaurant owner)
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to delete this food item.');
        }

        const food = await Food.findById(id).populate('restaurantId');
        if (!food || !food.restaurantId.equals(user.restaurants[0]._id)) {
            throw new ApiError(403, 'You can only delete food items of your restaurant.');
        }

        await Food.findByIdAndDelete(id);
        res.status(200).json(new ApiResponse(200, null, 'Food item removed successfully'));
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

        const foods = await Food.find(query).populate('restaurantId'); // Filtered query with population of restaurant
        res.status(200).json(new ApiResponse(200, foods, 'Food items fetched successfully'));
    } catch (error) {
        console.error('Error fetching food items:', error.message);
        next(new ApiError(500, 'Error fetching data', [error.message]));
    }
};
