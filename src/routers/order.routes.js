import express from 'express';
import { createOrder, getOrdersByRestaurant, getOrdersByTable } from '../controllers/order.controller.js'; // Adjust the import path

const router = express.Router();

router.post('/:restaurantId', createOrder); // Endpoint to create a new order
router.get('/restaurant/:restaurantId', getOrdersByRestaurant); // Get orders for a specific restaurant
router.get('/table/:diningTableId', getOrdersByTable); // Get orders for a specific table

export default router;
