import express from 'express';
import {
    createDiningTable,
    getDiningTables,
    getDiningTableById,
    updateDiningTable,
    deleteDiningTable,
    getActiveDiningTables,
} from '../controllers/dinningTable.controller.js';
const router = express.Router();
import { verifyJWT, isRestaurantOwner, csrfProtectionMiddleware } from '../middleware/auth.middleware.js';
// GET all tables
router.get('/:restaurantId/',verifyJWT, isRestaurantOwner, getDiningTables);
router.get('/:restaurantId/get-active', getActiveDiningTables);

// GET a single table by ID
router.get('/:restaurantId/:id', getDiningTableById);

// POST a new table
router.post('/:restaurantId/',verifyJWT, isRestaurantOwner, createDiningTable);

// PUT update a table by ID
router.put('/:restaurantId/:id', verifyJWT, isRestaurantOwner, updateDiningTable);

// DELETE a table by ID
router.delete('/:restaurantId/:id', verifyJWT, isRestaurantOwner,deleteDiningTable);

// Assuming this is in your router file

export default router;  // Use export default instead of module.exports
