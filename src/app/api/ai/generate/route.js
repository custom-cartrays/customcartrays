import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const res = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt + ', high quality artwork, ultra detailed, no text, no watermarks, no borders',
        image_size: { width: 1320, height: 610 },
        output_format: 'jpeg',
        safety_tolerance: '2'
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('FAL generate request failed', {
        status: res.status,
        body: detail.slice(0, 1000),
      });
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const data = await res.json();
    const imageUrl = data.images && data.images[0] && data.images[0].url;
    if (!imageUrl) return NextResponse.json({ error: 'No image returned' }, { status: 500 });

    return NextResponse.json({ imageUrl });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
