import express from 'express';
import { createOrder, getOrdersByRestaurant, getOrdersByTable,getOrdersByDate } from '../controllers/order.controller.js'; // Adjust the import path

const router = express.Router();
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Order route is working!' });
});
router.post('/create', createOrder); // Endpoint to create a new order
router.get('/restaurant/:restaurantId', getOrdersByRestaurant); // Get orders for a specific restaurant
router.get('/table/:diningTableId', getOrdersByTable); // Get orders for a specific table
router.get('/date', getOrdersByDate);

export default router;
