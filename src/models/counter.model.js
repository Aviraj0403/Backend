import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', // Reference to the Restaurant model
        required: true,
        unique: true,
    },
    count: {
        type: Number,
        default: 0, // Start the count at 0
    },
});

const Counter = mongoose.model('Counter', counterSchema);

export { Counter };
