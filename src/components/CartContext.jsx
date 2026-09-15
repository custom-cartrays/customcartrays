'use client';
import { createContext, useContext, useState, useEffect } from 'react';
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try { const s = localStorage.getItem('cct_cart'); if (s) setItems(JSON.parse(s)); } catch(_){}
  }, []);
  const save = (next) => {
    setItems(next);
    try { localStorage.setItem('cct_cart', JSON.stringify(next)); } catch(_){}
  };
  const addItem = (item) => save([...items, { ...item, cartId: `ci_${Date.now()}`, quantity: 1 }]);
  const removeItem = (cartId) => save(items.filter(i => i.cartId !== cartId));
  const updateQty = (cartId, qty) => qty < 1 ? removeItem(cartId) : save(items.map(i => i.cartId === cartId ? {...i, quantity: qty} : i));
  const clearCart = () => save([]);
  const total = items.reduce((a,i) => a + i.price * i.quantity, 0);
  const count = items.reduce((a,i) => a + i.quantity, 0);
  return <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>{children}</CartContext.Provider>;
}
export const useCart = () => { const c = useContext(CartContext); if (!c) throw new Error('useCart outside CartProvider'); return c; };
