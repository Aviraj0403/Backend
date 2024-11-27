import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
// console.log(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);  // Debugging log


// Initialize Razorpay with keys from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,  // Your Razorpay public key
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Your Razorpay secret key
});

// Function to create a Razorpay order
export const createRazorpayOrder = async (amount, receipt) => {
  try {
    // Ensure the amount is provided and in INR (paise)
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: 'INR', // Currency type
      receipt: receipt, // Receipt ID or custom unique ID for the order
      payment_capture: 1, // Automatically capture the payment once the payment is successful
    };

    // Call Razorpay API to create an order
    const response = await razorpay.orders.create(options);
    
    if (!response || !response.id) {
      throw new Error('Razorpay order creation failed');
    }

    return {
      razorpayOrderId: response.id,
      amount: response.amount / 100,  // Convert amount back to INR
      currency: response.currency,
      paymentLink: `https://checkout.razorpay.com/v1/checkout.js?order_id=${response.id}`,
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error.message);
    throw new Error(`Error creating Razorpay order: ${error.message}`);
  }
};

// Function to verify Razorpay payment signature
// Function to verify Razorpay payment signature
export const verifyPaymentSignature = (orderCreationId, razorpayPaymentId, razorpayOrderId, razorpaySignature) => {
  try {
    if (!orderCreationId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      throw new Error('Missing required parameters for signature verification');
    }

    // Generate the signature using the order creation ID, payment ID, and Razorpay secret
    const shasum = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest === razorpaySignature) {
      return true;
    } else {
      console.error('Payment signature verification failed.');
      return false;
    }
  } catch (error) {
    console.error('Error verifying payment signature:', error.message);
    return false;
  }
};

// Payment Verification Route
export const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderCreationId } = req.body;

  // Validate the required parameters
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Missing required parameters for verification' });
  }

  // Step 1: Verify the payment signature
  const isValidSignature = verifyPaymentSignature(
    orderCreationId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature
  );

  if (!isValidSignature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  // Step 2: Verify payment using Razorpay API (optional additional check)
  try {
    const payload = {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    };

    const response = await axios.post(
      'https://api.razorpay.com/v1/payment/verify', // Correct API endpoint
      payload,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,  // Razorpay API Key
          password: process.env.RAZORPAY_KEY_SECRET // Razorpay API Secret
        }
      }
    );

    console.log('Payment verified:', response.data);

    // If valid, proceed with order confirmation and status update
    res.status(200).json({ message: 'Payment verified successfully', orderId: razorpayOrderId });
  } catch (error) {
    console.error('Error verifying payment:', error.response ? error.response.data : error.message);
    return res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};