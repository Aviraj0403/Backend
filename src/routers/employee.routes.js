import express from 'express';
import { createEmployee, getEmployeesByRestaurant } from '../controllers/Employee.controller.js';

const router = express.Router();

// Route to create a new employee
router.post('/', createEmployee);

// Route to get all employees for a specific restaurant
router.get('/:restaurantId', getEmployeesByRestaurant);

export default router;
