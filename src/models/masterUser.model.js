import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Ensure jwt is imported
import crypto from 'crypto'; // Import crypto for token generation
import { Restaurant } from './restaurant.model.js';
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
    //  SMS_OTP STORE tEMP
    passwordResetOtp: {
        type: String,
        default: null,  // To store OTP
    },
    passwordResetOtpExpiresAt: {
        type: Date,
        default: null,  // To store expiration time of OTP
    },
    //MAIL_LINK GENERATION
    passwordResetToken: {
        type: String, // Token to reset password
        default: null,
    },
    passwordResetExpires: {
        type: Date, // Expiration time for the token
        default: null,
    }
},
{ timestamps: true });

// Hash password before saving
masterUserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare password
masterUserSchema.methods.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Generate access token
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

// Generate refresh token
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

// Generate password reset token and set expiration
masterUserSchema.methods.generatePasswordResetToken = function () {
    console.log('Generating reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 3600000; // 1 hour expiration
    return resetToken; // Return the plain token for sending in the email
};

// Validate password reset token
masterUserSchema.methods.isValidResetToken = function (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return this.passwordResetToken === hashedToken && this.passwordResetExpires > Date.now();
};

// Clear password reset token and expiration
masterUserSchema.methods.clearPasswordResetData = function () {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
};

const MasterUser = mongoose.model('MasterUser', masterUserSchema);

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
// Instance method to add a restaurant to the restaurant owner's list
RestaurantOwnerSchema.methods.addRestaurant = async function (restaurantId) {
    // Check if the restaurant is already added
    if (this.restaurants.includes(restaurantId)) {
        throw new Error('This restaurant is already added to the owner');
    }

    // Add the restaurant to the restaurants array
    this.restaurants.push(restaurantId);

    // Save the restaurant owner
    await this.save();
};

// Static method to create a restaurant and associate it with the owner
RestaurantOwnerSchema.statics.createRestaurant = async function (restaurantData, restaurantOwnerId) {
    // Create the restaurant
    const restaurant = new Restaurant({
        ...restaurantData,
        ownerId: restaurantOwnerId, // Associate restaurant with restaurantOwner
    });

    // Save the restaurant to the database
    const savedRestaurant = await restaurant.save();

    // Find the restaurant owner and associate the restaurant
    const restaurantOwner = await this.findById(restaurantOwnerId);
    if (!restaurantOwner) {
        throw new Error('RestaurantOwner not found');
    }

    // Add restaurant to the owner's list
    await restaurantOwner.addRestaurant(savedRestaurant._id);

    return savedRestaurant;
};


const RestaurantOwner = MasterUser.discriminator('RestaurantOwner', RestaurantOwnerSchema);

export { MasterUser, RestaurantOwner, subscriptionSchema };
