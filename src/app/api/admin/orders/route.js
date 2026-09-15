import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
export async function GET() {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: { include: { design: true } } } });
    return NextResponse.json({ orders });
  } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
