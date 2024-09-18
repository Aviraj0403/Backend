import mongoose, { Schema } from 'mongoose';

const restaurantSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Owner'
    }
}, { timestamps: true });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
