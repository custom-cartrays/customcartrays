import { NextResponse } from 'next/server';
export async function POST(request) {
  try {
    const { imageDataUrl, maskDataUrl, prompt } = await request.json();
    if (!imageDataUrl || !maskDataUrl) return NextResponse.json({ error: 'Image and mask required' }, { status: 400 });
    if (!process.env.FAL_API_KEY) return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });
    const basePrompt = 'Seamlessly extend only the masked surrounding area so it naturally continues the original image. Preserve the original subject and protected image region. Match perspective, style, colors, lighting, texture and mood. Continuous high-quality background, no borders, no added text.';
    const userInstruction = typeof prompt === 'string' && prompt.trim() ? ` Additional direction: ${prompt.trim().slice(0, 500)}` : '';
    const res = await fetch('https://fal.run/fal-ai/flux-pro/v1/fill', {
      method: 'POST',
      headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageDataUrl, mask_url: maskDataUrl, prompt: basePrompt + userInstruction, num_inference_steps: 28, guidance_scale: 3.5, output_format: 'jpeg' }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('FAL expand error', res.status, detail.slice(0, 500));
      return NextResponse.json({ error: 'AI expand failed' }, { status: 502 });
    }
    const data = await res.json();
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) return NextResponse.json({ error: 'No image returned' }, { status: 502 });
    return NextResponse.json({ imageUrl, effectivePrompt: basePrompt + userInstruction });
  } catch (e) {
    console.error('AI expand exception', e);
    return NextResponse.json({ error: 'AI expand failed' }, { status: 500 });
  }
}
