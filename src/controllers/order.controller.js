import Order from '../models/order.model.js';
import { Offer } from '../models/offer.model.js';
import Food from '../models/food.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { DiningTable } from '../models/dinningTable.model.js'; // Import DiningTable model
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { MasterUser, ROLES } from '../models/masterUser.model.js'; 
import { StatusCodes } from 'http-status-codes';
import {calculateTotalPrice} from '../utils/Math.js'
import mongoose from 'mongoose';

export const createOrder = async (req, res) => {
    try {
      const {
        customer,
        phone,
        restaurantId,
        selectedTable,
        selectedOffer,
        cart = [],
        priority,
      } = req.body;
  
      // Check for required fields
      if (!restaurantId) {
        return res.status(400).json({ message: "restaurantId is required" });
      }
  
      if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: "cart must be a non-empty array" });
      }
  
      // Log incoming cart items
      console.log("Incoming cart items:", cart);
  
      // Convert fooditemId strings to ObjectId instances
      const foodItemIds = cart.map(item => new mongoose.Types.ObjectId(item.fooditemId));
      const foodItems = await Food.find({ _id: { $in: foodItemIds } }).select('price');
  
      // Log the fetched food items
      console.log("Fetched food items:", foodItems);
  
      const foodPricesMap = foodItems.reduce((map, item) => {
        map[item._id.toString()] = item.price;
        return map;
      }, {});
  
      const orderItems = cart.map(item => {
        const price = foodPricesMap[item.fooditemId];
  
        if (typeof price !== 'number') {
          console.error(`Price not found for fooditemId: ${item.fooditemId}`);
          return null; // Return null for missing prices
        }
  
        const quantity = item.quantity || 1; // Default to 1 if not provided
        const totalPrice = price * quantity;
  
        return {
          foodId: item.fooditemId,
          quantity,
          price: totalPrice,
        };
      }).filter(item => item !== null); // Filter out any items that are null
  
      if (orderItems.length === 0) {
        return res.status(400).json({ message: "No valid food items found in cart" });
      }
  
      const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);
  
      // Adjust for priority and offer discount
      let finalTotalPrice = totalPrice;
  
      if (priority) {
        finalTotalPrice += totalPrice * 0.2; // Add 20% for priority
      }
  
      if (selectedOffer) {
        const discountPercentage = Number(selectedOffer.discountPercentage) || 0;
        finalTotalPrice -= (finalTotalPrice * discountPercentage) / 100; // Apply discount
      }
  
      // Create new order
      const newOrder = new Order({
        customer,
        phone,
        diningTableId: selectedTable,
        restaurantId,
        offerId: selectedOffer ? selectedOffer._id : null,
        items: orderItems,
        totalPrice: finalTotalPrice,
        paymentStatus: 'Pending',
        status: 'Pending',
        discount: selectedOffer ? (Number(selectedOffer.discountPercentage) || 0) : 0,
        priority,
      });
  
      // Save the order
      await newOrder.save();
  
      res.status(201).json({ orderId: newOrder._id });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Error creating order', error: error.message });
    }
  };
  
  



// Helper function to validate phone number format
const isValidPhone = (str) =>
  /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(str);

  
// Get all orders for a specific restaurant using aggregation
export const getOrdersByRestaurant = async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const orders = await Order.aggregate([
            { $match: { restaurantId: mongoose.Types.ObjectId(restaurantId) } },
            {
                $lookup: {
                    from: 'foods',
                    localField: 'items.foodId',
                    foreignField: '_id',
                    as: 'foodDetails'
                }
            },
            {
                $lookup: {
                    from: 'offers',
                    localField: 'offerId',
                    foreignField: '_id',
                    as: 'offerDetails'
                }
            },
            {
                $project: {
                    customerName: 1,
                    phone: 1,
                    diningTableId: 1,
                    items: 1,
                    paymentId: 1,
                    status: 1,
                    totalPrice: 1,
                    foodDetails: {
                        $arrayElemAt: ['$foodDetails', 0] // If you need the first matching food
                    },
                    offerDetails: {
                        $arrayElemAt: ['$offerDetails', 0] // If you need the first matching offer
                    }
                }
            }
        ]);

        return res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ message: 'Error fetching orders', error });
    }
};

// Get all orders for a specific dining table using aggregation
export const getOrdersByTable = async (req, res) => {
    const { diningTableId } = req.params;

    try {
        const orders = await Order.aggregate([
            { $match: { diningTableId: mongoose.Types.ObjectId(diningTableId) } },
            {
                $lookup: {
                    from: 'foods',
                    localField: 'items.foodId',
                    foreignField: '_id',
                    as: 'foodDetails'
                }
            },
            {
                $lookup: {
                    from: 'offers',
                    localField: 'offerId',
                    foreignField: '_id',
                    as: 'offerDetails'
                }
            },
            {
                $project: {
                    customerName: 1,
                    phone: 1,
                    restaurantId: 1,
                    items: 1,
                    paymentId: 1,
                    status: 1,
                    totalPrice: 1,
                    foodDetails: {
                        $arrayElemAt: ['$foodDetails', 0] // If you need the first matching food
                    },
                    offerDetails: {
                        $arrayElemAt: ['$offerDetails', 0] // If you need the first matching offer
                    }
                }
            }
        ]);

        return res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ message: 'Error fetching orders', error });
    }
};
