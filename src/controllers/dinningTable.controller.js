import { DiningTable } from '../models/dinningTable.model.js';
import { ApiError } from '../utils/ApiError.js';
import { MasterUser, ROLES } from '../models/masterUser.model.js';
import mongoose from 'mongoose';

import { ApiResponse } from '../utils/ApiResponse.js';
import { v4 as uuidv4 } from 'uuid'; // Correct import for UUID v4


export const createDiningTable = async (req, res, next) => {
    try {
        const { name, size, restaurantId, status } = req.body; // Destructure status from the request body if provided
        const user = req.user;

        // Check if user is authenticated
        if (!user) {
            throw new ApiError(401, 'User not authenticated.');
        }

        // Check if the user is authorized
        if (user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to create dining tables.');
        }

        // Retrieve the restaurant owned by the user
        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        console.log('Restaurant Owner Restaurants:', restaurantOwner.restaurants, 'Restaurant ID:', restaurantId);

        // Check if the user owns the restaurant
        if (!restaurantOwner || !restaurantOwner.restaurants.some(r => r.toString() === restaurantId)) {
            throw new ApiError(400, 'You must own a restaurant to create dining tables.');
        }

        // Input validation
        if (!name || size === undefined || !restaurantId) {
            throw new ApiError(400, 'Name, size, and restaurant ID are required fields.');
        }

        // Handle default value for status if it's not provided
        const tableStatus = status || 'Active'; // Default to 'Active' if status is not provided

        // Create a new dining table instance
        const newTable = new DiningTable({
            name,
            size,
            status: tableStatus, // Ensure status is provided or defaults to 'Active'
            restaurantId,
            tableId: uuidv4(), // Generate UUID for the table
        });

        await newTable.save(); // Save the dining table to the database
        res.status(201).json({
            status: 201,
            data: newTable,
            message: 'Dining table created successfully.',
        });
    } catch (error) {
        console.error('Error creating dining table:', error.message);
        next(new ApiError(500, 'Error creating dining table', [error.message]));
    }
};



// Get all dining tables
// Get all dining tables based on status
export const getDiningTables = async (req, res, next) => {
    try {
        const user = req.user;

        // Check if user is authorized
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to view dining tables.');
        }

        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to view dining tables.');
        }

        const restaurantId = restaurantOwner.restaurants[0]; // Assuming one restaurant per owner

        // Get status from query parameter, defaulting to both if not specified
        const statusFilter = req.query.status ? { status: req.query.status } : {};

        const tables = await DiningTable.find({ restaurantId, ...statusFilter }).populate('restaurantId');
        res.status(200).json(new ApiResponse(200, tables, 'Dining tables retrieved successfully.'));
    } catch (error) {
        console.error('Error fetching dining tables:', error.message);
        next(new ApiError(500, 'Error fetching dining tables', [error.message]));
    }
};


// Get a dining table by ID
// Get a dining table by ID
export const getDiningTableById = async (req, res, next) => {
    try {
        const table = await DiningTable.findOne({ tableId: req.params.id }).populate('restaurantId'); // Change to tableId
        if (!table) return res.status(404).json(new ApiError(404, 'Dining table not found'));

        res.status(200).json(new ApiResponse(200, table, 'Dining table retrieved successfully.'));
    } catch (error) {
        console.error('Error fetching dining table:', error.message);
        next(new ApiError(500, 'Error fetching dining table', [error.message]));
    }
};


// Update a dining table
export const updateDiningTable = async (req, res, next) => {
    try {
        const { name, size, status } = req.body;
        const user = req.user;

        // Check if user is authorized
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to update dining tables.');
        }

        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to update dining tables.');
        }

        const restaurantId = restaurantOwner.restaurants[0];

        // Find the dining table by ID and ensure it belongs to the user's restaurant
        const updatedTable = await DiningTable.findOneAndUpdate(
            { tableId: req.params.id, restaurantId },
            { name, size, status },
            { new: true, runValidators: true }
        );

        if (!updatedTable) return res.status(404).json(new ApiError(404, 'Dining table not found or you do not have permission to update it.'));

        res.status(200).json(new ApiResponse(200, updatedTable, 'Dining table updated successfully.'));
    } catch (error) {
        console.error('Error updating dining table:', error.message);
        next(new ApiError(500, 'Error updating dining table', [error.message]));
    }
};

// Delete a dining table
export const deleteDiningTable = async (req, res, next) => {
    try {
        const user = req.user;

        // Check if user is authorized
        if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
            throw new ApiError(403, 'You are not authorized to delete dining tables.');
        }

        const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
        if (!restaurantOwner || !restaurantOwner.restaurants.length) {
            throw new ApiError(400, 'You must own a restaurant to delete dining tables.');
        }

        const restaurantId = restaurantOwner.restaurants[0];

        const deletedTable = await DiningTable.findOneAndDelete({tableId: req.params.id, restaurantId });
        if (!deletedTable) return res.status(404).json(new ApiError(404, 'Dining table not found'));

        res.status(200).json(new ApiResponse(200, { message: 'Dining table deleted successfully' }, 'Dining table deleted successfully.'));
    } catch (error) {
        console.error('Error deleting dining table:', error.message);
        next(new ApiError(500, 'Error deleting dining table', [error.message]));
    }
};
// Get all active dining tables for a specific restaurant

export const getActiveDiningTables = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        console.log('Restaurant ID received:', restaurantId);

        // Validate restaurantId
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ statusCode: 400, message: 'Invalid restaurant ID' });
        }

        // Using aggregation pipeline to get active dining tables
        const activeTables = await DiningTable.aggregate([
            {
                $match: {
                    restaurantId: new mongoose.Types.ObjectId(restaurantId), // Use `new` here
                    status: 'Active'
                }
            },
            {
                $lookup: {
                    from: 'restaurants', // The collection name for restaurants
                    localField: 'restaurantId',
                    foreignField: '_id',
                    as: 'restaurantInfo'
                }
            },
            {
                $unwind: {
                    path: '$restaurantInfo',
                    preserveNullAndEmptyArrays: true // If you want to keep tables even if no restaurant info
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    size: 1,
                    tableId: 1,
                }
            }
        ]);

        console.log('Active Tables:', activeTables);

        if (!activeTables || activeTables.length === 0) {
            return res.status(404).json({ statusCode: 404, data: [], message: 'No active dining tables found.' });
        }

        return res.status(200).json({ statusCode: 200, data: activeTables, message: 'Active dining tables retrieved successfully.' });
    } catch (error) {
        console.error('Error fetching active dining tables:', error.message);
        next(error);
    }
};
//concept of timing 
// export const updateDiningTable = async (req, res, next) => {
//     try {
//         const { status } = req.body;
//         const user = req.user;

//         // Check if user is authorized
//         if (!user || user.role !== ROLES.RESTAURANT_OWNER) {
//             throw new ApiError(403, 'You are not authorized to update dining tables.');
//         }

//         const restaurantOwner = await MasterUser.findById(user._id).select('restaurants').lean();
//         if (!restaurantOwner || !restaurantOwner.restaurants.length) {
//             throw new ApiError(400, 'You must own a restaurant to update dining tables.');
//         }

//         const restaurantId = restaurantOwner.restaurants[0]; // Assuming one restaurant per owner

//         // Logging to debug
//         console.log('restaurantId from the user:', restaurantId);
//         console.log('tableId from params:', req.params.id);

//         // Find the dining table by tableId and restaurantId
//         const table = await DiningTable.findOne({ tableId: req.params.id, restaurantId });

//         if (!table) {
//             console.log('Table not found with the provided IDs');
//             throw new ApiError(404, 'Dining table not found.');
//         }

//         // Update the table status
//         table.status = status;

//         // Save the updated table
//         const updatedTable = await table.save();

//         // If the table is set to 'Inactive', set a timer to change it back to 'Active' after 5 minutes
//         if (status === 'Inactive') {
//             setTimeout(async () => {
//                 const tableToReactivate = await DiningTable.findOne({ tableId: updatedTable.tableId, restaurantId });
//                 if (tableToReactivate) {
//                     tableToReactivate.status = 'Active';  // Set the table status back to Active
//                     await tableToReactivate.save();  // Save the change
//                     console.log(`Table ${updatedTable.name} reactivated to Active status.`);
//                 }
//             }, 1 * 60 * 1000); // 5 minutes (in milliseconds)
//         }

//         // Respond with the updated table data
//         res.status(200).json({
//             status: 200,
//             data: updatedTable,
//             message: `Dining table status updated to ${status}.`,
//         });
//     } catch (error) {
//         console.error('Error updating dining table:', error.message);
//         next(new ApiError(500, 'Error updating dining table', [error.message]));
//     }
// };

