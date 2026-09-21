export const runtime = "nodejs";

const dataUrlToBlob = (dataUrl) => {
  const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl || "");
  if (!match) throw new Error("Invalid image data");
  const bytes = Buffer.from(match[2], "base64");
  return new Blob([bytes], { type: match[1] || "image/png" });
};

export async function POST(request) {
  try {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey)
      return Response.json(
        { error: "STABILITY_API_KEY is not configured for this environment." },
        { status: 500 },
      );

    const body = await request.json();
    const {
      imageDataUrl,
      prompt = "",
      left = 0,
      right = 0,
      up = 0,
      down = 0,
    } = body || {};

    if (!imageDataUrl)
      return Response.json({ error: "Missing source image." }, { status: 400 });

    if (![left, right, up, down].some((v) => Number(v) > 0))
      return Response.json(
        { error: "At least one outpaint direction must be greater than 0." },
        { status: 400 },
      );

    const form = new FormData();
    form.append("image", dataUrlToBlob(imageDataUrl), "source.png");
    form.append("prompt", String(prompt || ""));
    form.append("left", String(Math.max(0, Math.round(Number(left) || 0))));
    form.append("right", String(Math.max(0, Math.round(Number(right) || 0))));
    form.append("up", String(Math.max(0, Math.round(Number(up) || 0))));
    form.append("down", String(Math.max(0, Math.round(Number(down) || 0))));
    form.append("seed", "0");
    form.append("output_format", "png");

    const stabilityResponse = await fetch(
      "https://api.stability.ai/v2beta/stable-image/edit/outpaint",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
        body: form,
        cache: "no-store",
      },
    );

    if (!stabilityResponse.ok) {
      const raw = await stabilityResponse.text();
      let message = raw;
      try {
        const parsed = JSON.parse(raw);
        message = parsed.message || parsed.errors?.join?.(", ") || raw;
      } catch {}
      return Response.json(
        { error: `Stability AI outpaint failed (${stabilityResponse.status}): ${message}` },
        { status: stabilityResponse.status },
      );
    }

    const contentType =
      stabilityResponse.headers.get("content-type") || "image/png";
    const bytes = Buffer.from(await stabilityResponse.arrayBuffer());
    const imageUrl = `data:${contentType};base64,${bytes.toString("base64")}`;

    return Response.json({
      imageUrl,
      provider: "stability-ai",
      effectivePrompt: prompt,
    });
  } catch (error) {
    console.error("Stability outpaint error:", error);
    return Response.json(
      { error: error?.message || "Stability AI outpaint failed." },
      { status: 500 },
    );
  }
}
