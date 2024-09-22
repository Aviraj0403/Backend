import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Ensure jwt is imported

export const ROLES = {
    SUPER_ADMIN: 'superAdmin',
    RESTAURANT_OWNER: 'restaurantOwner',
    MANAGER: 'manager',
};

const subscriptionSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    },
    plan: {
        type: String, // e.g., "monthly", "yearly"
        required: true
    }
}, { timestamps: true });

const masterUserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.RESTAURANT_OWNER,
    },
},
{ timestamps: true });

masterUserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

masterUserSchema.methods.isPasswordCorrect = async function(password) {
    return bcrypt.compare(password, this.password);
};

// Method to generate access token
masterUserSchema.methods.generateAccessToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
    });
    console.log("Generated Access Token:", token); // Log the generated token
    return token; // Return the generated token
};

// Method to generate refresh token
masterUserSchema.methods.generateRefreshToken = function() {
    return jwt.sign({ _id: this._id, role: this.role }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });
};

// Creating User Models
const MasterUser = mongoose.model('MasterUser', masterUserSchema);

// Discriminator for Restaurant Owners
const RestaurantOwnerSchema = new Schema({
    restaurants: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Restaurant'
        }
    ],
    subscriptionRecords: [subscriptionSchema]
}, 
{ timestamps: true });

// Inherit from MasterUser
const RestaurantOwner = MasterUser.discriminator('RestaurantOwner', RestaurantOwnerSchema);

// Optional: You can create a separate model for Super Admin if needed

export { MasterUser, RestaurantOwner,subscriptionSchema };