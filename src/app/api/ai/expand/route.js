import { NextResponse } from 'next/server';
export async function POST(request) {
  try {
    const { imageDataUrl, maskDataUrl } = await request.json();
    if (!imageDataUrl || !maskDataUrl) return NextResponse.json({ error: 'Image and mask required' }, { status: 400 });
    const res = await fetch('https://fal.run/fal-ai/flux-pro/v1/fill', {
      method: 'POST',
      headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageDataUrl, mask_url: maskDataUrl, prompt: 'seamlessly extend and fill the area matching the style, colors, lighting and mood of the main artwork, high quality, photorealistic, continuous background, no borders, no text', num_inference_steps: 28, guidance_scale: 3.5, output_format: 'jpeg' }),
    });
    if (!res.ok) return NextResponse.json({ error: 'AI expand failed' }, { status: 500 });
    const data = await res.json();
    const imageUrl = data.images && data.images[0] && data.images[0].url;
    if (!imageUrl) return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    return NextResponse.json({ imageUrl });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
