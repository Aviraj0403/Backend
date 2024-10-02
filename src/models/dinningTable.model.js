//
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const diningTableSchema = new mongoose.Schema({
    tableId: {
        type: String,
        default: uuidv4, // Generate a UUID for each dining table by default
        unique: true, // Ensure the UUID is unique
    },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', // Reference to the Restaurant model
        required: true, // Make it required to ensure every food item has an associated restaurant
    },
}, { timestamps: true });

const DiningTable = mongoose.model('DiningTable', diningTableSchema);

export { DiningTable }; 