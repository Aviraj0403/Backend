import mongoose from "mongoose";

// Define the schema for food items
const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Ensure price is positive
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Salad",
        "Rolls",
        "Desserts",
        "Sandwich",
        "Cake",
        "Pure Veg",
        "Pasta",
        "Noodles",
        "Veg",
        "Non-Veg",
        "Dinner",
      ], // Restrict to predefined categories
    },
    cookTime: {
      type: String,
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ["Veg", "Non-Veg"], // Only allow Veg or Non-Veg
    },
    variety: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner"], // New field for meal variety
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"], // Status can only be Active or Inactive
      default: "Active",
    },
    imageUrl: {
      type: String,
      required: true, // Cloudinary image URL is required
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant', // Reference to the Restaurant model
      required: true, // Make it required to ensure every food item has an associated restaurant
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Add index to restaurantId for optimization
foodSchema.index({ restaurantId: 1 });

// Create the model from the schema
const Food = mongoose.model("Food", foodSchema);

export default Food;
