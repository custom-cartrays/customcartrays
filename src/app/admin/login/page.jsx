'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function AdminLoginPage({ searchParams }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [load, setLoad] = useState(false);
  const router = useRouter(); const from = searchParams?.from || '/admin';
  const submit = async (e) => { e.preventDefault(); setLoad(true); setErr(''); const res = await fetch('/api/admin/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }) }); if (res.ok) { router.push(from); } else { setErr('Invalid password'); setLoad(false); } };
  return (<div className="min-h-screen bg-gray-950 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm"><div className="text-center mb-6"><div className="text-3xl mb-2">🔐</div><h1 className="text-white font-black text-2xl">Admin Access</h1></div><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-xl text-white px-4 py-3 outline-none mb-4 text-sm" />{err && <p className="text-red-400 text-sm mb-3">⚠ {err}</p>}<button type="submit" disabled={load || !pw} className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white font-bold rounded-xl transition-colors">{load ? 'Checking...' : 'Login'}</button></form></div>);
}
