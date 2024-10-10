import express from 'express';
import { recordAttendance, getAttendanceByRestaurant } from '../controllers/attendance.controller.js';

const router = express.Router();

// Route to record attendance for an employee
router.post('/', recordAttendance);

// Route to get attendance records for a specific restaurant and employee for a specific month
router.get('/:restaurantId/:employeeId/:month', getAttendanceByRestaurant);

export default router;
