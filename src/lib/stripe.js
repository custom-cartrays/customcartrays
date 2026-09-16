import Stripe from 'stripe';
const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build_only';
export const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
export const PRODUCT_PRICE = parseInt(process.env.PRODUCT_PRICE_CENTS || '5000', 10);
export const PRODUCT_NAME = 'Custom Car Tray';
