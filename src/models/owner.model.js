import mongoose, { Schema } from 'mongoose';

const ownerSchema = new Schema({
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
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    }
}, { timestamps: true });

ownerSchema.methods.isPasswordCorrect = async function(password) {
    return bcrypt.compare(password, this.password);
};

export const Owner = mongoose.model('Owner', ownerSchema);
