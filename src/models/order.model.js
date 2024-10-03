import mongoose from 'mongoose';
import { Offer } from './offer.model.js';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed'];

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
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: v => /\+?[0-9]{10,15}/.test(v), // Updated for flexibility
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
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      default: null, // Optional field
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
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'Pending',
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to calculate total price and apply discount
orderSchema.pre('validate', async function (next) {
  const Food = mongoose.model('Food');
  try {
    const itemPromises = this.items.map(async item => {
      const food = await Food.findById(item.foodId);
      if (food) {
        item.price = food.price;
      }
      return (item.price || 0) * item.quantity; // Ensure price is a number
    });

    const itemPrices = await Promise.all(itemPromises);
    this.totalPrice = itemPrices.reduce((sum, price) => sum + price, 0);

    // Check for applicable offer if offerId is provided
    if (this.offerId) {
      const offer = await Offer.findById(this.offerId);
      if (offer && offer.status === 'Active' && new Date() >= offer.startDate && new Date() <= offer.endDate) {
        const discountAmount = (this.totalPrice * offer.discountPercentage) / 100;
        this.discount = discountAmount;
        this.totalPrice -= discountAmount;
      } else {
        // If the offer is not valid, clear the offerId
        this.offerId = null;
      }
    }

    next();
  } catch (error) {
    console.error('Error calculating order price:', error); // Log the error for debugging
    next(error);
  }
});

// Create the model from the schema
const Order = mongoose.model('Order', orderSchema);

export default Order;
