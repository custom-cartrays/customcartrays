import { NextResponse } from 'next/server';
import { uploadBase64 } from '@/lib/storage';
import prisma from '@/lib/db';
export async function POST(request) {
  try {
    const { previewDataUrl, printDataUrl, metadata } = await request.json();
    if (!previewDataUrl || !printDataUrl) return NextResponse.json({ error: 'Images required' }, { status: 400 });
    const id = `design_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const [previewUrl, printUrl] = await Promise.all([
      uploadBase64(previewDataUrl, `designs/${id}/preview.jpg`, 'image/jpeg'),
      uploadBase64(printDataUrl, `designs/${id}/print.jpg`, 'image/jpeg'),
    ]);
    const design = await prisma.design.create({ data: { id, previewUrl, printUrl, metadata: JSON.stringify(metadata || {}), productType: 'car-tray' } });
    return NextResponse.json({ designId: design.id, previewUrl, printUrl });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
