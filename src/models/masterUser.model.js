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
    },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
    paymentMethod: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true });
 
subscriptionSchema.methods.updateDetails = function (updates) {
    Object.assign(this, updates);
    return this; // Return the updated subscription
};


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
    profilePicture: {
        type: String, // Optional profile picture URL
    },
},
    { timestamps: true });

masterUserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

masterUserSchema.methods.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Method to generate access token
masterUserSchema.methods.generateAccessToken = function () {
    try {
        const token = jwt.sign({
            _id: this._id,
            username: this.username,
            role: this.role
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1h'
        });
        console.log("Generated Access Token:", token);
        return token;
    } catch (error) {
        console.error("Error generating access token:", error);
        throw new Error("Token generation failed");
    }
};

masterUserSchema.methods.generateRefreshToken = function () {
    try {
        const token = jwt.sign({
            _id: this._id,
            username: this.username,
            role: this.role
        }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '7d'
        });
        console.log("Generated Refresh Token:", token);
        return token;
    } catch (error) {
        console.error("Error generating refresh token:", error);
        throw new Error("Token generation failed");
    }
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

export { MasterUser, RestaurantOwner, subscriptionSchema };