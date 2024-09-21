import Food from '../models/food.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js'; // Adjust path as necessary

// Controller to add a new food item
export const addFoodItem = async (req, res, next) => {
    try {
        const {
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
        } = req.body;

        // Input validation
        if (!name || !price || !category) {
            throw new ApiError(400, 'Name, price, and category are required fields.');
        }

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
        });

        const savedFood = await newFood.save();
        res.status(201).json(new ApiResponse(201, savedFood, 'Food item added successfully'));
    } catch (error) {
        next(new ApiError(500, 'Error adding food item', [error.message]));
    }
};

// Get all food items
export const getAllFoods = async (req, res, next) => {
    try {
        const foods = await Food.find(); // Fetch all food items
        res.status(200).json(new ApiResponse(200, foods, 'Food items fetched successfully'));
    } catch (error) {
        console.error('Error fetching food list:', error);
        next(new ApiError(500, 'Error fetching data'));
    }
};

// Get a single food item by ID
export const getFoodById = async (req, res, next) => {
    try {
        const food = await Food.findById(req.params.id);
        if (food) {
            res.status(200).json(new ApiResponse(200, food, 'Food item fetched successfully'));
        } else {
            next(new ApiError(404, 'Food item not found'));
        }
    } catch (error) {
        console.error('Error fetching food item:', error);
        next(new ApiError(500, 'Error fetching item'));
    }
};

// Update food item by ID
export const updateFoodById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Capture all updates

        const food = await Food.findByIdAndUpdate(id, updates, { new: true });
        if (food) {
            res.status(200).json(new ApiResponse(200, food, 'Food item updated successfully'));
        } else {
            next(new ApiError(404, 'Food item not found'));
        }
    } catch (error) {
        console.error('Error updating food item:', error);
        next(new ApiError(500, 'Error updating item'));
    }
};

// Remove food item
export const removeFood = async (req, res, next) => {
    try {
        const { id } = req.params; // Change to get id from params
        const result = await Food.findByIdAndDelete(id);
        if (result) {
            res.status(200).json(new ApiResponse(200, null, 'Food item removed successfully'));
        } else {
            next(new ApiError(404, 'Food item not found'));
        }
    } catch (error) {
        console.error('Error removing food item:', error);
        next(new ApiError(500, 'Error removing item'));
    }
};

// Get food items by category
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

        const foods = await Food.find(query);
        if (foods.length > 0) {
            res.status(200).json(new ApiResponse(200, foods, 'Food items fetched successfully'));
        } else {
            next(new ApiError(404, 'No food items found for the selected filters'));
        }
    } catch (error) {
        console.error('Error fetching food items:', error);
        next(new ApiError(500, 'Error fetching data'));
    }
};
