import Order from '../models/order.model.js';
import { Offer } from '../models/offer.model.js';
import Food from '../models/food.model.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpay.js';
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

    // Validate required fields
    if (!restaurantId) {
      return res.status(400).json({ message: "restaurantId is required" });
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "cart must be a non-empty array" });
    }

    // Convert fooditemId strings to ObjectId instances
    const foodItemIds = cart.map(item => new mongoose.Types.ObjectId(item.fooditemId));
    const foodItems = await Food.find({ _id: { $in: foodItemIds } }).select('price');

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
    }).filter(item => item !== null);

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

    // Create the order in the database
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

    // Save the order to get the order ID
    await newOrder.save();

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(finalTotalPrice, newOrder._id.toString());

    if (!razorpayOrder || !razorpayOrder.razorpayOrderId) {
      console.error("Razorpay order creation failed.");
      return res.status(500).json({ message: 'Failed to create Razorpay order' });
    }

    // Save the Razorpay order ID in the order
    newOrder.razorpayOrderId = razorpayOrder.razorpayOrderId;
    await newOrder.save();

    // Return Razorpay order details to the frontend
    res.status(201).json({
      orderId: newOrder._id,
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      amount: finalTotalPrice,
      currency: 'INR',
      paymentLink: razorpayOrder.paymentLink, // Send the payment link to frontend
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Verify Payment Controller

export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate the required parameters
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing required parameters for verification' });
    }

    // Find the order by Razorpay order ID
    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
      return res.status(400).json({ message: 'Order not found' });
    }

    // Verify the payment signature
    const isValidSignature = verifyPaymentSignature(
      order.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // If the payment is valid, update the order status
    order.paymentStatus = 'Completed';
    order.status = 'Confirmed'; // Update order status based on your workflow
    await order.save();

    // You can also trigger other actions like updating stock or sending a notification

    res.status(200).json({ message: 'Payment verified successfully', orderId: order._id });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
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
export const getOrdersByDate = async (req, res) => {
  const { startDate, endDate, restaurantId } = req.query;

  // Validate the dates
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Both startDate and endDate are required.' });
  }

  try {
    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
          ...(restaurantId ? { restaurantId: mongoose.Types.ObjectId(restaurantId) } : {}),
        },
      },
      {
        $lookup: {
          from: 'foods',
          localField: 'items.foodId',
          foreignField: '_id',
          as: 'foodDetails',
        },
      },
      {
        $lookup: {
          from: 'offers',
          localField: 'offerId',
          foreignField: '_id',
          as: 'offerDetails',
        },
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
            $arrayElemAt: ['$foodDetails', 0], // If you need the first matching food
          },
          offerDetails: {
            $arrayElemAt: ['$offerDetails', 0], // If you need the first matching offer
          },
          createdAt: 1, // Include createdAt for additional context
        },
      },
    ]);

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};
// Route to get today's orders for a specific restaurant
export const getTodaysOrders = async (req, res) => {
  const { restaurantId } = req.params;

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);  // Set time to 00:00:00
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
          ...(restaurantId ? { restaurantId: new mongoose.Types.ObjectId(restaurantId) } : {}),
        },
      },
      {
        $lookup: {
          from: 'foods',
          localField: 'items.foodId',
          foreignField: '_id',
          as: 'foodDetails',
        },
      },
      {
        $lookup: {
          from: 'offers',
          localField: 'offerId',
          foreignField: '_id',
          as: 'offerDetails',
        },
      },
      {
        $lookup: {
          from: 'diningtables',
          localField: 'diningTableId',  // The ID of the dining table in the order
          foreignField: '_id',  // The _id in the DiningTable collection
          as: 'diningTableDetails',  // Adding dining table details to the order
        },
      },
      {
        $unwind: {
          path: '$diningTableDetails',
          preserveNullAndEmptyArrays: true, // If no dining table is found
        },
      },
      {
        $project: {
          customerName: 1,
          phone: 1,
          diningTableId: 1,
          diningTableName: '$diningTableDetails.name',  // Access the name from the diningTableDetails
          items: 1,
          paymentId: 1,
          status: 1,
          totalPrice: 1,
          foodDetails: { $arrayElemAt: ['$foodDetails', 0] },
          offerDetails: { $arrayElemAt: ['$offerDetails', 0] },
          createdAt: 1,
        },
      },
    ]);

    // Sort the orders by the createdAt field to assign order numbers based on the order of arrival
    const sortedOrders = orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Add an orderNumber field to each order
    const ordersWithOrderNumber = sortedOrders.map((order, index) => ({
      ...order,
      orderNumber: index + 1,  // Start numbering from 1
    }));

    return res.status(200).json(ordersWithOrderNumber);
  } catch (error) {
    console.error("Error fetching today's orders:", error);
    return res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};




