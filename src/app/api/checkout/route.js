import { NextResponse } from 'next/server';
import { stripe, PRODUCT_PRICE, PRODUCT_NAME } from '@/lib/stripe';

export async function POST(request) {
  try {
    const { items } = await request.json();
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Use the actual site origin that created the checkout session.
    // This keeps Preview checkouts on their Preview deployment and avoids
    // falling back to localhost when NEXT_PUBLIC_URL is not configured.
    const baseUrl = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: PRODUCT_NAME,
            description: `Custom design · ID: ${item.designId?.slice(-8)}`,
            images: item.previewUrl ? [item.previewUrl] : [],
          },
          unit_amount: PRODUCT_PRICE,
        },
        quantity: Math.max(1, parseInt(item.quantity) || 1),
      })),
      mode: 'payment',
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'MX'] },
      metadata: {
        cart: JSON.stringify(items.map(i => ({
          designId: i.designId,
          quantity: i.quantity || 1,
        }))),
      },
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
