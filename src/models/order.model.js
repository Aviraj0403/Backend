import mongoose from 'mongoose';
import { Offer } from './offer.model.js'; // Adjust the import path

// Define the order statuses
const ORDER_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

// Order item schema for individual food items in an order
const OrderItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

// Main order schema
const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /\d{10}/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`,
      },
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    diningTableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiningTable',
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentId: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      default: 0, // Store the discount amount
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer', // Reference to the applicable offer
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Pre-save hook to calculate total price and apply discount
orderSchema.pre('validate', async function (next) {
  const Food = mongoose.model('Food'); // Reference the Food model
  const itemPromises = this.items.map(async (item) => {
    const food = await Food.findById(item.foodId);
    if (food) {
      item.price = food.price; // Assign the price from the food model
    }
    return item.price * item.quantity; // Calculate the total for this item
  });

  const itemPrices = await Promise.all(itemPromises);
  this.totalPrice = itemPrices.reduce((sum, price) => sum + price, 0); // Sum up the total prices

  // Check for applicable offer
  if (this.offerId) {
    const offer = await Offer.findById(this.offerId);
    if (offer && offer.status === 'Active' && new Date() >= offer.startDate && new Date() <= offer.endDate) {
      // Calculate discount
      const discountAmount = (this.totalPrice * offer.discountPercentage) / 100;
      this.discount = discountAmount;
      this.totalPrice -= discountAmount; // Apply discount to total price
    }
  }
  
  next();
});

// Create the model from the schema
const Order = mongoose.model('Order', orderSchema);

export default Order;
