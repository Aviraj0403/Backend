import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Cook', 'Manager', 'Waiter', 'POS Operator', 'Others'], required: true },
    baseSalary: { type: Number, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
