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
      status,
      imageUrl,
    } = req.body;

    const newFood = new Food({
      name,
      description,
      price,
      category,
      cookTime,
      itemType,
      isFeatured,
      status,
      imageUrl,
    });

    const savedFood = await newFood.save();
    res.status(201).json(new ApiResponse(201, savedFood, 'Food item added successfully'));
  } catch (error) {
    next(new ApiError(500, 'Error adding food item', [error.message]));
  }
};
