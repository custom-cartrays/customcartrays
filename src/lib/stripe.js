import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
export const PRODUCT_PRICE = parseInt(process.env.PRODUCT_PRICE_CENTS || '5000', 10);
export const PRODUCT_NAME = 'Custom Car Tray';
