import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { stripe } from '@/lib/stripe';
async function getSession(id) { try { return await stripe.checkout.sessions.retrieve(id); } catch(_) { return null; } }
export default async function OrderSuccessPage({ searchParams }) {
  const session = searchParams?.session_id ? await getSession(searchParams.session_id) : null;
  return (<><Header /><main className="max-w-2xl mx-auto px-4 py-20 text-center"><div className="text-7xl mb-6">🎉</div><h1 className="text-4xl font-black mb-4">Order Confirmed!</h1><p className="text-xl text-gray-600 mb-8 leading-relaxed">Your custom car tray order has been received. We'll email you when it ships.</p>{session && <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left"><h2 className="font-bold mb-3">Order Details</h2><div className="space-y-2 text-sm text-gray-600"><div className="flex justify-between"><span>Total</span><span className="font-semibold">${((session.amount_total||0)/100).toFixed(2)}</span></div><div className="flex justify-between"><span>Email</span><span className="font-semibold">{session.customer_details?.email || '—'}</span></div></div></div>}<div className="flex flex-col sm:flex-row gap-3 justify-center"><Link href="/customize" className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors">🎨 Design Another Tray</Link><Link href="/" className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors">Back to Home</Link></div></main><Footer /></>);
}
