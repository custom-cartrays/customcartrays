import Link from 'next/link';
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-14 mt-16">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1"><div className="text-white font-black text-lg mb-2">🚗 Custom Car Trays</div><p className="text-sm leading-relaxed">Premium personalized trays for your vehicle. Made to order.</p></div>
        <div><div className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Shop</div><ul className="space-y-2 text-sm"><li><Link href="/product" className="hover:text-white transition-colors">Custom Car Tray</Link></li><li><Link href="/customize" className="hover:text-white transition-colors">Design Studio</Link></li></ul></div>
        <div><div className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Help</div><ul className="space-y-2 text-sm"><li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li><li><Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link></li><li><Link href="/returns" className="hover:text-white transition-colors">Returns</Link></li><li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li></ul></div>
        <div><div className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Legal</div><ul className="space-y-2 text-sm"><li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li><li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li></ul></div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm"><p>© {new Date().getFullYear()} Custom Car Trays. All rights reserved.</p></div>
    </footer>
  );
}
