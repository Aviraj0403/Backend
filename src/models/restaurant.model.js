import mongoose, { Schema } from 'mongoose';
import { MasterUser,ROLES } from './masterUser.model.js'

const restaurantSchema = new Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
        unique: true 
    },
    ownerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'MasterUser', 
        required: true 
    },
    managerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'MasterUser' 
    },
    location: { 
        type: String, 
        required: true 
    },
    contactInfo: {
        phone: { 
            type: String, 
            validate: {
                validator: function(v) {
                    return /\d{10}/.test(v); // Example validation for a 10-digit phone number
                },
                message: props => `${props.value} is not a valid phone number!`
            } 
        },
        email: { 
            type: String, 
            validate: {
                validator: function(v) {
                    return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v); // Simple email validation
                },
                message: props => `${props.value} is not a valid email address!`
            }
        }
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'suspended'],
        default: 'open'
    },
    menuItems: [{ // Reference to menu items
        type: Schema.Types.ObjectId,
        ref: 'Food'
    }]
}, { timestamps: true });

// Validate ownerId before saving
restaurantSchema.pre('save', async function(next) {
    const owner = await MasterUser.findById(this.ownerId);

    if (!owner || owner.role !== ROLES.RESTAURANT_OWNER) {
        return next(new Error('Owner must be a RestaurantOwner'));
    }
    next();
});

restaurantSchema.index({ name: 1, location: 1, status: 1 });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
