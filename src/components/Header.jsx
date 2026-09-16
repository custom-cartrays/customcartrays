'use client';
import Link from 'next/link';
import { useCart } from './CartContext';
export default function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-lg text-gray-900 tracking-tight">
          <span className="text-2xl">🚗</span> Custom Car Trays
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/product" className="hover:text-orange-500 transition-colors">Product</Link>
          <Link href="/faq" className="hover:text-orange-500 transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-orange-500 transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/customize" className="hidden sm:inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">Design Yours</Link>
          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-xl">🛒</span>
            {count > 0 && <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">{count > 9 ? '9+' : count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
