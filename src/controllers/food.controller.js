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
 // Get all food items
export const getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find(); // Fetch all food items
    res.status(200).json({
      success: true,
      data: foods,
    });
  } catch (error) {
    console.error('Error fetching food list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
    });
  }
};


// Get a single food item by ID
export const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (food) {
      res.status(200).json({
        success: true,
        data: food,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
    });
  }
};
export const updateFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, status } = req.body;

    const food = await Food.findByIdAndUpdate(id, { name, category, price, description, status }, { new: true });

    if (food) {
      res.status(200).json({
        success: true,
        data: food,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item',
    });
  }
};
export const removeFood = async (req, res) => {
  try {
    const { id } = req.body;
    const result = await Food.findByIdAndDelete(id);
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Food item removed successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }
  } catch (error) {
    console.error('Error removing food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item',
    });
  }
};