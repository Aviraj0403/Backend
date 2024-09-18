import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

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
    restaurants: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Restaurant'
        }
    ],
    subscriptionRecords: [
        {
            restaurantId: {
                type: Schema.Types.ObjectId,
                ref: 'Restaurant'
            },
            subscriptionDetails: {
                type: String // Add fields as needed
            }
        }
    ]
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

export const MasterUser = mongoose.model('MasterUser', masterUserSchema);
