import mongoose from 'mongoose';

// Payment statuses
const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed'];

// Payment schema
const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true, // e.g., 'credit_card', 'paypal', etc.
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'Pending',
    },
    transactionId: {
      type: String,
      required: false, // Store payment provider transaction ID if applicable
    },
  },
  {
    timestamps: true,
  }
);

// Create the model from the schema
const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
