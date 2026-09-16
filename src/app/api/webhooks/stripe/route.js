import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/db';
export const runtime = 'nodejs';
export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  let event;
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }); }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const existing = await prisma.order.findUnique({ where: { stripeSessionId: session.id } });
    if (existing) return NextResponse.json({ received: true });
    try {
      let cart = []; try { cart = JSON.parse(session.metadata?.cart || '[]'); } catch(_){}
      const qty = cart.reduce((a,i) => a + (i.quantity||1), 0);
      const unitPrice = qty > 0 ? Math.round(session.amount_total / qty) : session.amount_total;
      await prisma.order.create({ data: {
        stripeSessionId: session.id, stripePaymentIntentId: session.payment_intent,
        customerEmail: session.customer_details?.email || '', customerName: session.customer_details?.name,
        shippingAddress: JSON.stringify(session.shipping_details?.address || {}),
        amountTotal: session.amount_total, currency: session.currency,
        items: { create: cart.map(i => ({ designId: i.designId, quantity: i.quantity||1, unitPrice })) },
      }});
    } catch(e) { console.error('Order creation failed:', e); return NextResponse.json({ error: 'Order creation failed' }, { status: 500 }); }
  }
  return NextResponse.json({ received: true });
}
