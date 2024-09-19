import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Ensure jwt is imported

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
        enum: ['superAdmin', 'restaurantOwner', 'manager'],
        default: 'restaurantOwner'
    },
    restaurants: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Restaurant'
        }
    ],
    subscriptionRecords: [subscriptionSchema]
}, { timestamps: true });

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
    return jwt.sign({ _id: this._id, role: this.role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
    });
};

// Method to generate refresh token
masterUserSchema.methods.generateRefreshToken = function() {
    return jwt.sign({ _id: this._id, role: this.role }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });
};

export const MasterUser = mongoose.model('MasterUser', masterUserSchema);
