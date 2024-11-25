import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
  // key_id: process.env.RAZORPAY_KEY_ID,
  // key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyPaymentSignature = (orderCreationId, razorpayPaymentId, razorpayOrderId, razorpaySignature) => {
  const shasum = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
  const digest = shasum.digest('hex');
  return digest === razorpaySignature;
};

export { razorpay, verifyPaymentSignature };
