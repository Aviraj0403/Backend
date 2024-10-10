import Attendance from '../models/Attendace.model.js';

export const recordAttendance = async (req, res) => {
    const { employeeId, restaurantId, date, inTime, outTime, present } = req.body;
    try {
        const newAttendance = await Attendance.create({ employeeId, restaurantId, date, inTime, outTime, present });
        res.status(201).json(newAttendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance records for a specific restaurant and employee for a specific month
export const getAttendanceByRestaurant = async (req, res) => {
    const { restaurantId, employeeId, month } = req.params; // Expecting month in YYYY-MM format
    try {
        const records = await Attendance.find({
            restaurantId,
            employeeId,
            date: { $regex: `^${month}` } // Match dates starting with the specified month
        }).populate('employeeId'); // Optional: Populate employee details
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};