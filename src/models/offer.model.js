import mongoose from 'mongoose';

// Define a constant for the offer statuses
const OFFER_STATUSES = ['Active', 'Inactive'];

const offerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1, // Ensure there's at least one character
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100, // Assuming discount percentage should not exceed 100%
    },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: (value) => value instanceof Date && !isNaN(value),
            message: 'Invalid start date.',
        },
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value instanceof Date && !isNaN(value) && value > this.startDate;
            },
            message: 'End date must be later than start date.',
        },
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    status: {
        type: String,
        enum: OFFER_STATUSES,
        default: 'Active',
    },
}, { timestamps: true });

// Indexing for better query performance
offerSchema.index({ restaurantId: 1, startDate: 1 }); // Indexing for common queries

// Create the model from the schema
export const Offer = mongoose.model('Offer', offerSchema);
