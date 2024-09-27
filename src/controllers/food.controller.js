import Food from '../models/food.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Restaurant } from '../models/restaurant.model.js';
import { MasterUser, ROLES } from '../models/masterUser.model.js'; // Ensure to import the user model
;

export const addFoodItem = async (req, res, next) => {
    try {
        const { name, description, price, category, cookTime, itemType, isFeatured, isRecommended, status, imageUrl } = req.body;

        // Extract logged-in user information from `req.user` (assuming authentication middleware populates `req.user`)
        const user = req.user;

        // Check if the logged-in user is a restaurant owner
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to add food items.');
        }

        // Find the restaurant ID owned by the logged-in user (using `lean()` for better performance)
        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to add food items.');
        }

        const restaurantId = restaurantOwner.restaurants[0]; // Use the first restaurant owned by the user

        // Input validation (simple server-side validation)
        if (!name || !price || !category) {
            throw new ApiError(400, 'Name, price, and category are required fields.');
        }

        // Create the new food item and update the restaurant concurrently
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

        // Perform both operations in parallel
        const [savedFood] = await Promise.all([
            newFood.save(), // Save the new food item
            Restaurant.findByIdAndUpdate(
                restaurantId,
                { $push: { menuItems: newFood._id } }, // Push the new food item to the restaurant's menuItems
                { new: true, lean: true } // Use lean() to reduce overhead
            )
        ]);

        // Send success response
        res.status(201).json(new ApiResponse(201, savedFood, 'Food item added successfully'));
    } catch (error) {
        console.error('Error adding food item:', error.message);
        next(new ApiError(500, 'Error adding food item', [error.message]));
    }
};


// Controller to get all food items (public access)
export const getAllFoods = async (req, res, next) => {
    try {
      const { restaurantId } = req.query; 
      // Expecting restaurantId from the query
      console.log("res id" ,restaurantId)
      // Fetch food items filtered by restaurantId
      const foods = await Food.find({ restaurantId }).populate('restaurantId');
  
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
