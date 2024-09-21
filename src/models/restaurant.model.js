import mongoose, { Schema } from 'mongoose';

const restaurantSchema = new Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
        unique: true // Ensures restaurant names are unique
    },
    ownerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'MasterUser', // Refers to MasterUser or RestaurantOwner
        required: true 
    },
    managerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'MasterUser' // Optional: Linking manager to restaurant
    },
    location: { 
        type: String, 
        required: true 
    },
    contactInfo: {
        phone: { type: String }, // Add any additional contact fields
        email: { type: String }
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'suspended'], // Define restaurant status
        default: 'open'
    }
}, { timestamps: true });

// Adding an index for faster querying on name and location
restaurantSchema.index({ name: 1, location: 1 });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
