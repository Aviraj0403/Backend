import mongoose, { Schema } from 'mongoose';

const restaurantSchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    ownerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'MasterUser', // Updated to use MasterUser
        required: true 
    },
    managerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'MasterUser' // Linking manager to restaurant
    },
    location: { 
        type: String, 
        required: true 
    }
   
}, { timestamps: true });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
