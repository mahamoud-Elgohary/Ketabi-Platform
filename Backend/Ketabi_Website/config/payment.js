import Stripe from 'stripe';
import 'dotenv/config'; // Ensure dotenv is loaded if not in index.js
import AppError from '../utils/AppError.js';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new AppError('Stripe secret key is missing from environment variables', 500);
  }
  return new Stripe(secretKey);
}

export async function processPayment(order) {
   try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({    
      amount: Math.round(order.finalPrice * 100),
      currency: 'egp',
      description: `${order.orderNumber}`,
      metadata: {orderNumber:order.orderNumber},
      receipt_email: order.userEmail,
      payment_method_types: ['card'],
    });
    return { id: paymentIntent.id, client_secret: paymentIntent.client_secret };
  } catch (error) {
    throw new AppError(`Payment failed: ${error.message}`, 400);
  }
} 