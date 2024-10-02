import Order from '../models/order.model.js';
import { Offer } from '../models/offer.model.js';
import Food from '../models/food.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { DiningTable } from '../models/dinningTable.model.js'; // Import DiningTable model
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { MasterUser, ROLES } from '../models/masterUser.model.js'; 

// Create a new order
export const createOrder = async (req, res, next) => {
    const { customerName, phone, restaurantId, diningTableId, items, paymentId, offerId } = req.body;

    try {
        // Log the incoming data
        console.log("Incoming data:", req.body);

        // Check if the restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            throw new ApiError(404, 'Restaurant not found');
        }

        // Check if the dining table is valid
        const diningTable = await DiningTable.findById(diningTableId);
        if (!diningTable) {
            throw new ApiError(404, 'Dining table not found');
        }

        // Prepare the order object
        const orderData = {
            customerName,
            phone,
            restaurantId,
            diningTableId,
            items,
            paymentId,
            offerId,
        };

        // Create the order instance
        const order = new Order(orderData);

        // Save the order
        await order.save();

        res.status(201).json(new ApiResponse(201, order, 'Order placed successfully'));
    } catch (error) {
        console.error("Error placing order:", error.message);
        next(new ApiError(500, 'Error placing order', [error.message]));
    }
};



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
