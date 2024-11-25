import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const diningTableSchema = new mongoose.Schema(
  {
    tableId: {
      type: String,
      default: uuidv4, // Generate a UUID for each dining table by default
      unique: true, // Ensure the UUID is unique
    },
    name: {
      type: String,
      required: [true, 'Table name is required'], // Provide a custom error message
    },
    size: {
      type: Number,
      required: [true, 'Table size is required'],
      min: [1, 'Table size must be at least 1'], // Add min size validation
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'], // Restrict status values
      default: 'Inactive',
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant', // Reference to the Restaurant model
      required: [true, 'Restaurant ID is required'], // Ensure the restaurantId is always provided
      validate: {
        validator: async function (v) {
          // Optional: Add validation to check if the restaurantId exists in the 'Restaurant' model
          const Restaurant = mongoose.model('Restaurant');
          const restaurant = await Restaurant.findById(v);
          return restaurant != null;
        },
        message: 'Restaurant ID does not exist', // Custom error message if validation fails
      },
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const DiningTable = mongoose.model('DiningTable', diningTableSchema);

export { DiningTable };
