import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
export async function PATCH(request, { params }) {
  try {
    const allowed = ['productionStatus','trackingNumber','notes'];
    const body = await request.json();
    const data = {};
    for (const k of allowed) { if (body[k] !== undefined) data[k] = body[k]; }
    const order = await prisma.order.update({ where: { id: params.id }, data });
    return NextResponse.json({ order });
  } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
