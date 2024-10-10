import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // Format YYYY-MM-DD
    inTime: { type: String, required: true }, // Format HH:MM AM/PM
    outTime: { type: String, required: true }, // Format HH:MM AM/PM
    present: { type: Boolean, default: false },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true } // Reference to the restaurant
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
