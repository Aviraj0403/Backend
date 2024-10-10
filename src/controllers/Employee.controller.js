// Employee Controller
import Employee from '../models/Employee.model.js';

// Create a new employee
export const createEmployee = async (req, res) => {
    const { name, role, baseSalary, restaurantId } = req.body;
    try {
        const newEmployee = await Employee.create({ name, role, baseSalary, restaurantId });
        res.status(201).json(newEmployee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all employees for a specific restaurant
export const getEmployeesByRestaurant = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const employees = await Employee.find({ restaurantId });
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};