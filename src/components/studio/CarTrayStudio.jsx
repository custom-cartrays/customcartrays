"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import {
  DESIGN_AREA_UI,
  INITIAL_PHOTO_AREA,
  effectiveDpi,
  qualityFromDpi,
} from "@/lib/studioGeometry";
const PRICE = 5000,
  clamp = (n, min, max) => Math.min(max, Math.max(min, n)),
  initialTransform = {
    scale: 100,
    x: INITIAL_PHOTO_AREA.centerXPct,
    y: INITIAL_PHOTO_AREA.centerYPct,
    rot: 0,
  };
const initialEditorState = () => ({
  transform: { ...initialTransform },
  flattenedArtwork: "",
  appliedExpandInstruction: "",
  appliedExpandPrompt: "",
  textLayers: [],
});
const loadImage = (src) =>
  new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
function TextLayersOverlay({ layers, onPointerDown, selectedId }) {
  return (
    <svg
      viewBox="0 0 1650 1100"
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    >
      {layers.map((layer) => (
        <text
          key={layer.id}
          x={layer.x * 16.5}
          y={layer.y * 11}
          fill={layer.color}
          fontFamily={layer.fontFamily}
          fontSize={layer.size * 11}
          textAnchor={
            layer.align === "left"
              ? "start"
              : layer.align === "right"
                ? "end"
                : "middle"
          }
          dominantBaseline="middle"
          transform={`rotate(${layer.rotation} ${layer.x * 16.5} ${layer.y * 11})`}
          stroke={selectedId === layer.id ? "rgba(255,255,255,.85)" : "none"}
          strokeWidth={selectedId === layer.id ? 3 : 0}
          paintOrder="stroke"
          style={{ pointerEvents: "auto", cursor: "move", userSelect: "none" }}
          onPointerDown={(e) => onPointerDown(e, layer.id)}
        >
          {layer.text || "Text"}
        </text>
      ))}
    </svg>
  );
}
function TrayReference() {
  return (
    <svg
      viewBox="0 0 1700 1150"
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
    >
      <path
        d="M92 1135 Q28 1125 28 1038 L28 118 Q28 16 120 16 L476 16 Q505 16 505 50 L505 136 Q505 181 462 181 Q426 181 381 151 Q347 130 315 151 Q280 174 280 225 L280 282 Q280 354 353 354 Q486 307 850 307 Q1214 307 1347 354 Q1420 354 1420 282 L1420 225 Q1420 174 1385 151 Q1353 130 1319 151 Q1274 181 1238 181 Q1195 181 1195 136 L1195 50 Q1195 16 1224 16 L1580 16 Q1672 16 1672 118 L1672 1038 Q1672 1125 1608 1135 Q850 1150 92 1135 Z"
        fill="rgba(246,239,226,.18)"
        stroke="#171717"
        strokeWidth="5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
export default function CarTrayStudio() {
  const router = useRouter(),
    { addItem } = useCart(),
    fileRef = useRef(null),
    workspaceRef = useRef(null),
    designAreaRef = useRef(null),
    dragRef = useRef(null),
    transformRef = useRef(initialTransform),
    textLayersRef = useRef([]);
  const [image, setImage] = useState(""),
    [originalImage, setOriginalImage] = useState(""),
    [flattenedArtwork, setFlattenedArtwork] = useState(""),
    [sourceSize, setSourceSize] = useState(null),
    [prompt, setPrompt] = useState(""),
    [expandPrompt, setExpandPrompt] = useState(""),
    [appliedExpandInstruction, setAppliedExpandInstruction] = useState(""),
    [appliedExpandPrompt, setAppliedExpandPrompt] = useState(""),
    [printPreview, setPrintPreview] = useState("");
  const [loading, setLoading] = useState(false),
    [expanding, setExpanding] = useState(false),
    [saving, setSaving] = useState(false),
    [renderingPrint, setRenderingPrint] = useState(false),
    [productionReady, setProductionReady] = useState(false),
    [error, setError] = useState("");
  const [transform, setTransform] = useState(initialTransform),
    { scale, x, y, rot } = transform,
    [textLayers, setTextLayers] = useState([]),
    [selectedTextId, setSelectedTextId] = useState(null),
    [activeTool, setActiveTool] = useState("upload"),
    [view, setView] = useState("editor"),
    [history, setHistory] = useState(() => [initialEditorState()]),
    [historyIndex, setHistoryIndex] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const src = flattenedArtwork || originalImage || image;
    setProductionReady(false);
    if (!src) return;
    loadImage(src)
      .then(() => {
        if (!cancelled) setProductionReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("Artwork could not be prepared for print");
      });
    return () => {
      cancelled = true;
    };
  }, [image, originalImage, flattenedArtwork]);
  const applySnapshot = (state) => {
    transformRef.current = state.transform;
    setTransform(state.transform);
    setFlattenedArtwork(state.flattenedArtwork || "");
    setAppliedExpandInstruction(state.appliedExpandInstruction);
    setAppliedExpandPrompt(state.appliedExpandPrompt);
    textLayersRef.current = state.textLayers || [];
    setTextLayers(textLayersRef.current);
    setPrintPreview("");
  };
  const currentSnapshot = (overrides = {}) => ({
    transform: overrides.transform || transformRef.current,
    flattenedArtwork: overrides.flattenedArtwork ?? flattenedArtwork,
    appliedExpandInstruction:
      overrides.appliedExpandInstruction ?? appliedExpandInstruction,
    appliedExpandPrompt: overrides.appliedExpandPrompt ?? appliedExpandPrompt,
    textLayers: overrides.textLayers ?? textLayers,
  });
  const commitSnapshot = (next) => {
    applySnapshot(next);
    setHistory((prev) => {
      const out = [...prev.slice(0, historyIndex + 1), next].slice(-40);
      setHistoryIndex(out.length - 1);
      return out;
    });
  };
  const previewTransform = (next) => {
      transformRef.current = next;
      setTransform(next);
      setPrintPreview("");
    },
    previewTextLayers = (next) => {
      textLayersRef.current = next;
      setTextLayers(next);
      setPrintPreview("");
    },
    commitTransform = (next) =>
      commitSnapshot(currentSnapshot({ transform: next }));
  const undo = () => {
      if (historyIndex > 0) {
        const i = historyIndex - 1;
        setHistoryIndex(i);
        applySnapshot(history[i]);
      }
    },
    redo = () => {
      if (historyIndex < history.length - 1) {
        const i = historyIndex + 1;
        setHistoryIndex(i);
        applySnapshot(history[i]);
      }
    },
    resetTransform = () => commitTransform({ ...initialTransform });
  const setNewImage = (src, remember = true) => {
    setImage(src);
    if (remember) setOriginalImage(src);
    setActiveTool("upload");
    setView("editor");
    setError("");
    const clean = initialEditorState();
    applySnapshot(clean);
    setHistory([clean]);
    setHistoryIndex(0);
    const im = new Image();
    im.onload = () =>
      setSourceSize({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = src;
  };
  const setGeneratedArtwork = (src) => {
    setImage(src);
    setOriginalImage("");
    setActiveTool("ai");
    setView("editor");
    setError("");
    const clean = { ...initialEditorState(), flattenedArtwork: src };
    applySnapshot(clean);
    setHistory([clean]);
    setHistoryIndex(0);
    const im = new Image();
    im.onload = () =>
      setSourceSize({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = src;
  };
  const addText = () => {
    if (!image) return;
    const layer = {
        id: `text_${Date.now()}`,
        text: "Your text",
        x: 50,
        y: 50,
        size: 7,
        color: "#111111",
        fontFamily: "Arial",
        align: "center",
        rotation: 0,
      },
      next = [...textLayersRef.current, layer];
    commitSnapshot(currentSnapshot({ textLayers: next }));
    setSelectedTextId(layer.id);
  };
  const updateText = (patch, commit = false) => {
    if (!selectedTextId) return;
    const next = textLayersRef.current.map((layer) =>
      layer.id === selectedTextId ? { ...layer, ...patch } : layer,
    );
    if (commit) commitSnapshot(currentSnapshot({ textLayers: next }));
    else previewTextLayers(next);
  };
  const commitTextPreview = () =>
    commitSnapshot(currentSnapshot({ textLayers: textLayersRef.current }));
  const removeSelectedText = () => {
    const next = textLayersRef.current.filter(
      (layer) => layer.id !== selectedTextId,
    );
    commitSnapshot(currentSnapshot({ textLayers: next }));
    setSelectedTextId(null);
  };
  const readFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setNewImage(r.result, true);
    r.readAsDataURL(f);
  };
  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "AI generation failed");
      setGeneratedArtwork(d.imageUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const drawPlaced = (ctx, img, W, H) => {
    const placementH = H * (INITIAL_PHOTO_AREA.heightIn / 11),
      base = Math.min(W / img.naturalWidth, placementH / img.naturalHeight),
      s = base * (scale / 100),
      w = img.naturalWidth * s,
      h = img.naturalHeight * s;
    ctx.save();
    ctx.translate((W * x) / 100, (H * y) / 100);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return { w, h };
  };
  const composeExpandInputs = async () => {
    const W = 1500,
      H = 1000,
      c = document.createElement("canvas"),
      mask = document.createElement("canvas");
    c.width = mask.width = W;
    c.height = mask.height = H;
    const ctx = c.getContext("2d"),
      mx = mask.getContext("2d");
    ctx.fillStyle = mx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    mx.fillRect(0, 0, W, H);
    const img = await loadImage(originalImage || image),
      { w, h } = drawPlaced(ctx, img, W, H);
    mx.save();
    mx.translate((W * x) / 100, (H * y) / 100);
    mx.rotate((rot * Math.PI) / 180);
    mx.fillStyle = "#000";
    mx.fillRect(-w / 2, -h / 2, w, h);
    mx.restore();
    return {
      imageDataUrl: c.toDataURL("image/jpeg", 0.92),
      maskDataUrl: mask.toDataURL("image/png"),
    };
  };
  const expand = async () => {
    if (!image || flattenedArtwork || expanding) return;
    setExpanding(true);
    setError("");
    try {
      const inputs = await composeExpandInputs(),
        r = await fetch("/api/ai/expand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...inputs, prompt: expandPrompt }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "AI expand failed");
      commitSnapshot(
        currentSnapshot({
          flattenedArtwork: d.imageUrl,
          appliedExpandInstruction: expandPrompt.trim(),
          appliedExpandPrompt: d.effectivePrompt || "",
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setExpanding(false);
    }
  };
  const drawTextLayers = (ctx, width, height) => {
    textLayersRef.current.forEach((layer) => {
      ctx.save();
      ctx.translate((width * layer.x) / 100, (height * layer.y) / 100);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.fillStyle = layer.color;
      ctx.font = `${Math.max(12, (height * layer.size) / 100)}px ${layer.fontFamily}`;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      ctx.fillText(layer.text || "Text", 0, 0);
      ctx.restore();
    });
  };
  const renderProduction = async (width, height, quality = 0.92) => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    if (flattenedArtwork)
      ctx.drawImage(await loadImage(flattenedArtwork), 0, 0, width, height);
    else
      drawPlaced(ctx, await loadImage(originalImage || image), width, height);
    drawTextLayers(ctx, width, height);
    return c.toDataURL("image/jpeg", quality);
  };
  const showPrintFile = async () => {
    if (!image || expanding || !productionReady || renderingPrint) return;
    setView("print");
    setRenderingPrint(true);
    setPrintPreview("");
    setError("");
    try {
      setPrintPreview(await renderProduction(4950, 3300, 0.95));
    } catch (e) {
      setError(e.message);
      setView("editor");
    } finally {
      setRenderingPrint(false);
    }
  };
  const add = async () => {
    if (!image) return;
    setSaving(true);
    setError("");
    try {
      const printDataUrl =
        printPreview || (await renderProduction(4950, 3300, 0.95));
      setPrintPreview(printDataUrl);
      const previewDataUrl = await renderProduction(990, 660, 0.88),
        dpi =
          !flattenedArtwork && sourceSize
            ? effectiveDpi(sourceSize.w, sourceSize.h, scale)
            : null,
        r = await fetch("/api/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previewDataUrl,
            printDataUrl,
            metadata: {
              scale: flattenedArtwork ? null : scale,
              x: flattenedArtwork ? null : x,
              y: flattenedArtwork ? null : y,
              rotation: flattenedArtwork ? null : rot,
              fit: flattenedArtwork ? "flattened" : "contain",
              designArea: "16.5x11",
              physicalTray: "17x11.5",
              effectiveDpi: dpi,
              studioVersion: 2,
              aiExpanded: !!flattenedArtwork,
              aiExpand: {
                status: flattenedArtwork ? "flattened" : "none",
                userInstruction: appliedExpandInstruction || null,
                effectivePrompt: appliedExpandPrompt || null,
                provider: flattenedArtwork ? "fal-ai/flux-pro/v1/fill" : null,
                flattenedArtworkUrl: flattenedArtwork || null,
              },
              textLayers: textLayersRef.current,
              layerModel: flattenedArtwork
                ? "flattened-ai-artwork+editable-text"
                : "positioned-original+editable-text",
            },
          }),
        }),
        responseText = await r.text();
      let d = {};
      try {
        d = responseText ? JSON.parse(responseText) : {};
      } catch {
        d = {};
      }
      if (!r.ok) {
        if (r.status === 413)
          throw new Error(
            "This design is too large to save right now. The print upload path still needs optimization before checkout.",
          );
        throw new Error(d.error || responseText || "Could not save design");
      }
      addItem({
        designId: d.designId,
        previewUrl: d.previewUrl,
        productName: "Custom Car Tray",
        price: PRICE,
      });
      router.push("/cart");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const nudge = (dx, dy) => {
      if (!flattenedArtwork)
        commitTransform({
          ...transform,
          x: clamp(x + dx, 0, 100),
          y: clamp(y + dy, 0, 100),
        });
    },
    pointerDown = (e) => {
      if (!image || flattenedArtwork || view !== "editor") return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      dragRef.current = {
        kind: "image",
        sx: e.clientX,
        sy: e.clientY,
        start: transform,
        moved: false,
      };
    },
    textPointerDown = (e, id) => {
      if (view !== "editor") return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setSelectedTextId(id);
      dragRef.current = {
        kind: "text",
        id,
        sx: e.clientX,
        sy: e.clientY,
        start: textLayersRef.current.find((layer) => layer.id === id),
        moved: false,
      };
    },
    pointerMove = (e) => {
      const d = dragRef.current;
      if (!d || !designAreaRef.current) return;
      const r = designAreaRef.current.getBoundingClientRect(),
        dx = ((e.clientX - d.sx) / r.width) * 100,
        dy = ((e.clientY - d.sy) / r.height) * 100;
      d.moved = true;
      if (d.kind === "text") {
        previewTextLayers(
          textLayersRef.current.map((layer) =>
            layer.id === d.id
              ? {
                  ...layer,
                  x: clamp(d.start.x + dx, 0, 100),
                  y: clamp(d.start.y + dy, 0, 100),
                }
              : layer,
          ),
        );
        return;
      }
      const next = {
        ...d.start,
        x: clamp(d.start.x + dx, 0, 100),
        y: clamp(d.start.y + dy, 0, 100),
      };
      previewTransform(next);
    },
    pointerUp = () => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      if (!d.moved) return;
      if (d.kind === "text")
        commitSnapshot(currentSnapshot({ textLayers: textLayersRef.current }));
      else commitTransform(transformRef.current);
    };
  const selectedText = textLayers.find((layer) => layer.id === selectedTextId),
    artworkStyle = {
      width: `${scale}%`,
      height: `${(scale * INITIAL_PHOTO_AREA.heightPct) / 100}%`,
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(-50%,-50%) rotate(${rot}deg)`,
      objectFit: "contain",
    },
    dpi =
      !flattenedArtwork && sourceSize
        ? effectiveDpi(sourceSize.w, sourceSize.h, scale)
        : null,
    quality = qualityFromDpi(dpi);
  return (
    <div className="min-h-screen bg-[#f3f0e8] text-[#181716]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="h-[72px] px-4 lg:px-6 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="shrink-0 flex items-center gap-3 text-left"
            aria-label="Custom Car Trays home"
          >
            <img
              src="/custom-car-trays-logo.png"
              alt="Custom Car Trays"
              className="h-12 w-[112px] object-cover rounded-lg border border-black/10 bg-white shadow-sm"
            />
          </button>

          <div className="hidden md:flex flex-1 items-center justify-center gap-7 text-sm">
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#171717] text-white">1</span>
              <span>Design Your Tray</span>
            </div>
            <div className="h-px w-10 bg-black/10" />
            <div className="flex items-center gap-2 text-black/40">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10">2</span>
              <span>Review</span>
            </div>
            <div className="h-px w-10 bg-black/10" />
            <div className="flex items-center gap-2 text-black/40">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10">3</span>
              <span>Add to Cart</span>
            </div>
          </div>

          <button
            onClick={add}
            disabled={!image || saving}
            className="ml-auto rounded-xl bg-[#171717] px-5 py-3 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-black/25 disabled:shadow-none"
          >
            {saving ? "Saving…" : "Continue →"}
          </button>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-72px)] xl:grid-cols-[92px_minmax(0,1fr)_320px]">
        <aside className="order-2 xl:order-none border-t xl:border-t-0 xl:border-r border-black/10 bg-white px-2 py-3 flex xl:flex-col items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTool("ai")}
            className={`min-w-[76px] rounded-2xl px-2 py-3 text-xs flex flex-col items-center gap-1.5 transition ${activeTool === "ai" ? "bg-[#f1eadf] font-bold shadow-sm" : "hover:bg-[#f5f1ea]"}`}
          >
            <span className="text-2xl leading-none">✦</span>
            AI
          </button>
          <button
            onClick={() => setActiveTool("text")}
            disabled={!image}
            className={`min-w-[76px] rounded-2xl px-2 py-3 text-xs flex flex-col items-center gap-1.5 transition disabled:opacity-30 ${activeTool === "text" ? "bg-[#f1eadf] font-bold shadow-sm" : "hover:bg-[#f5f1ea]"}`}
          >
            <span className="text-2xl leading-none font-serif">T</span>
            Add Text
          </button>

          <div className="hidden xl:block my-1 h-px w-12 bg-black/10" />

          <button
            onClick={undo}
            disabled={!historyIndex}
            className="min-w-[76px] rounded-xl px-2 py-2.5 text-xs hover:bg-[#f5f1ea] disabled:opacity-25"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="min-w-[76px] rounded-xl px-2 py-2.5 text-xs hover:bg-[#f5f1ea] disabled:opacity-25"
          >
            ↷ Redo
          </button>
          <button
            onClick={resetTransform}
            disabled={!!flattenedArtwork || !image}
            className="min-w-[76px] rounded-xl px-2 py-2.5 text-xs hover:bg-[#f5f1ea] disabled:opacity-25"
          >
            Reset
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={readFile}
          />
        </aside>

        <section className="order-1 xl:order-none min-w-0 flex flex-col bg-[#f6f3ed]">
          <div className="px-4 pt-4 md:px-6 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-black/45">
            <span>
              {view === "editor"
                ? "Editor View"
                : view === "product"
                  ? "Product Preview"
                  : "Print File"}
            </span>
            <b className="normal-case tracking-normal text-black/60">
              {view === "print" ? "16.5″ × 11″ artwork" : "17″ × 11.5″ tray"}
            </b>
          </div>

          <div className="flex-1 p-3 md:p-6 flex items-center justify-center">
            <div
              ref={workspaceRef}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
              className={`relative w-full max-w-[980px] ${view === "print" ? "aspect-[16.5/11]" : "aspect-[17/11.5]"} overflow-hidden rounded-[22px] border border-black/10 bg-[#fffdf9] shadow-[0_18px_50px_rgba(45,36,23,.12)] select-none touch-none`}
            >
              <div
                ref={designAreaRef}
                className={`${view === "print" ? "absolute inset-0" : "absolute"} z-0 overflow-hidden bg-[#efe8dc] flex items-center justify-center`}
                style={
                  view === "print"
                    ? undefined
                    : {
                        left: `${DESIGN_AREA_UI.leftPct}%`,
                        top: `${DESIGN_AREA_UI.topPct}%`,
                        width: `${DESIGN_AREA_UI.widthPct}%`,
                        height: `${DESIGN_AREA_UI.heightPct}%`,
                      }
                }
              >
                {view === "editor" && image && !flattenedArtwork && (
                  <div
                    className="absolute inset-x-0 z-[6] bg-[#a97924]/[0.025] pointer-events-none"
                    style={{
                      height: `${INITIAL_PHOTO_AREA.heightPct}%`,
                      top: `${INITIAL_PHOTO_AREA.centerYPct}%`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <span className="absolute left-3 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#7a561b] shadow-sm">
                      Photo area · 16.5″ × 7.5″
                    </span>
                  </div>
                )}

                {flattenedArtwork ? (
                  <img
                    src={flattenedArtwork}
                    alt="Flattened AI artwork"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  />
                ) : image ? (
                  <img
                    src={originalImage || image}
                    alt="Customer original artwork"
                    draggable={false}
                    className="max-w-full max-h-full object-contain absolute pointer-events-none z-10"
                    style={artworkStyle}
                  />
                ) : (
                  <div className="max-w-md text-center text-black/35 px-6">
                    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-black/10 bg-white text-xl shadow-sm">
                      ◫
                    </div>
                    <b className="text-base text-black/55">Upload a photo to start</b>
                    <p className="mt-1 text-sm leading-6">
                      We place it inside the 16.5″ × 7.5″ photo area. AI Expand can then complete the full 16.5″ × 11″ artwork.
                    </p>
                  </div>
                )}

                <TextLayersOverlay
                  layers={textLayers}
                  onPointerDown={textPointerDown}
                  selectedId={selectedTextId}
                />
              </div>

              {view === "editor" && <TrayReference />}
              {view === "product" && <TrayReference />}

              {view === "print" && (
                <div className="absolute inset-0 z-40 bg-white flex items-center justify-center">
                  {renderingPrint ? (
                    <span className="text-sm text-black/50">Rendering 4950 × 3300 print file…</span>
                  ) : printPreview ? (
                    <img
                      src={printPreview}
                      alt="Print-ready artwork preview"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-sm text-black/45">Print preview unavailable</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-black/10 bg-white px-3 py-3 md:px-4 flex items-center gap-2 overflow-x-auto">
            {[
              ["editor", "Editor", "Edit positioning and text"],
              ["product", "Product Preview", "Tray without guides"],
              ["print", "Print File", "4950 × 3300 · no guides"],
            ].map(([id, label, sub]) => (
              <button
                key={id}
                onClick={() => (id === "print" ? showPrintFile() : setView(id))}
                disabled={
                  id === "print" &&
                  (expanding || !productionReady || renderingPrint)
                }
                className={`min-w-[150px] rounded-2xl border px-3 py-2.5 text-left transition disabled:opacity-35 ${view === id ? "border-[#a86f16] bg-[#fbf3e6] shadow-sm" : "border-black/10 bg-white hover:bg-[#faf8f4]"}`}
              >
                <span className="block text-sm font-bold">
                  {id === "print" && !productionReady && image ? "Preparing Print…" : label}
                </span>
                <span className="mt-0.5 block text-[10px] text-black/45">{sub}</span>
              </button>
            ))}

            <div className="ml-auto hidden md:block min-w-[230px] rounded-2xl bg-[#f2eee6] px-3 py-2.5 text-xs">
              <b className="text-black/80">
                {flattenedArtwork
                  ? "AI artwork ready"
                  : sourceSize
                    ? `${sourceSize.w} × ${sourceSize.h}px`
                    : "Image quality"}
              </b>
              <span className="mt-0.5 block text-black/50">
                {flattenedArtwork
                  ? "Original placement is baked in. Undo to reposition."
                  : dpi
                    ? `${dpi} effective DPI · ${quality.label}`
                    : "Upload an image to calculate DPI."}
              </span>
            </div>
          </div>
        </section>

        <aside className="order-3 border-t xl:border-t-0 xl:border-l border-black/10 bg-white p-4 md:p-5">
          <div className="sticky top-[92px] space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/35">
                {activeTool === "ai" ? "AI Tools" : activeTool === "text" ? "Text" : "Image"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                {activeTool === "ai"
                  ? image
                    ? "Complete your artwork"
                    : "Create with AI"
                  : activeTool === "text"
                    ? "Add a message"
                    : image
                      ? "Position your photo"
                      : "Start your design"}
              </h2>
            </div>

            {activeTool === "upload" && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl bg-[#171717] py-3.5 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {image ? "Replace Image" : "Upload Image"}
                </button>

                {image && !flattenedArtwork && (
                  <div className="rounded-2xl border border-black/10 bg-[#faf8f4] p-4 space-y-4">
                    <label className="block text-sm">
                      <span className="flex justify-between font-semibold">
                        <span>Scale</span><b>{scale}%</b>
                      </span>
                      <input
                        className="mt-2 w-full accent-[#a86f16]"
                        type="range"
                        min="20"
                        max="180"
                        value={scale}
                        onChange={(e) =>
                          previewTransform({ ...transform, scale: +e.target.value })
                        }
                        onPointerUp={() => commitTransform(transform)}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="flex justify-between font-semibold">
                        <span>Rotate</span><b>{rot}°</b>
                      </span>
                      <input
                        className="mt-2 w-full accent-[#a86f16]"
                        type="range"
                        min="-180"
                        max="180"
                        value={rot}
                        onChange={(e) =>
                          previewTransform({ ...transform, rot: +e.target.value })
                        }
                        onPointerUp={() => commitTransform(transform)}
                      />
                    </label>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-black/40">Position</p>
                      <div className="grid grid-cols-3 gap-2 max-w-[170px]">
                        <span />
                        <button className="rounded-lg border bg-white py-2 hover:bg-[#f1eadf]" onClick={() => nudge(0, -2)}>↑</button>
                        <span />
                        <button className="rounded-lg border bg-white py-2 hover:bg-[#f1eadf]" onClick={() => nudge(-2, 0)}>←</button>
                        <button className="rounded-lg border bg-white py-2 hover:bg-[#f1eadf]" onClick={() => nudge(0, 2)}>↓</button>
                        <button className="rounded-lg border bg-white py-2 hover:bg-[#f1eadf]" onClick={() => nudge(2, 0)}>→</button>
                      </div>
                    </div>
                  </div>
                )}

                {image && (
                  <button
                    onClick={() => {
                      setImage("");
                      setOriginalImage("");
                      setSourceSize(null);
                      setView("editor");
                      setError("");
                      const clean = initialEditorState();
                      applySnapshot(clean);
                      setHistory([clean]);
                      setHistoryIndex(0);
                    }}
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    Remove image
                  </button>
                )}
              </>
            )}

            {activeTool === "ai" && !image && (
              <>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe a complete 16.5″ × 11″ design…"
                  className="h-28 w-full rounded-2xl border border-black/10 bg-[#faf8f4] p-3 outline-none transition focus:border-[#a86f16] focus:ring-2 focus:ring-[#a86f16]/10"
                />
                <button
                  onClick={generate}
                  disabled={loading || !prompt.trim()}
                  className="w-full rounded-xl bg-[#171717] py-3.5 font-bold text-white shadow-sm disabled:opacity-35"
                >
                  {loading ? "Generating…" : "✦ Generate with AI"}
                </button>
              </>
            )}

            {activeTool === "ai" && image && (
              <>
                {!flattenedArtwork ? (
                  <>
                    <div className="rounded-2xl border border-[#d8c7aa] bg-[#fbf4e8] p-3 text-xs leading-5 text-[#6f5426]">
                      Your photo stays inside the 16.5″ × 7.5″ placement area. AI fills the rest of the 16.5″ × 11″ artwork.
                    </div>
                    <textarea
                      value={expandPrompt}
                      onChange={(e) => setExpandPrompt(e.target.value)}
                      placeholder="Optional AI direction…"
                      className="h-24 w-full rounded-2xl border border-black/10 bg-[#faf8f4] p-3 outline-none transition focus:border-[#a86f16] focus:ring-2 focus:ring-[#a86f16]/10"
                    />
                    <button
                      onClick={expand}
                      disabled={expanding}
                      className="w-full rounded-xl bg-[#171717] py-3.5 font-bold text-white shadow-sm disabled:opacity-35"
                    >
                      {expanding ? "✦ Expanding…" : "✦ AI Expand Background"}
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                    <b className="text-emerald-900">✓ AI artwork flattened</b>
                    <p className="mt-1 leading-5 text-emerald-800/80">
                      The photo is now part of the completed artwork. Use Undo to restore and reposition the original photo.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTool === "text" && image && (
              <>
                <button
                  onClick={addText}
                  className="w-full rounded-xl bg-[#171717] py-3.5 font-bold text-white shadow-sm"
                >
                  Add Text Layer
                </button>
                {selectedText && (
                  <div className="rounded-2xl border border-black/10 bg-[#faf8f4] p-4 space-y-3">
                    <b className="text-sm">Text layer</b>
                    <input
                      value={selectedText.text}
                      onChange={(e) => updateText({ text: e.target.value })}
                      onBlur={commitTextPreview}
                      className="w-full rounded-lg border border-black/10 bg-white p-2"
                    />
                    <select
                      value={selectedText.fontFamily}
                      onChange={(e) => updateText({ fontFamily: e.target.value }, true)}
                      className="w-full rounded-lg border border-black/10 bg-white p-2"
                    >
                      <option value="Arial">Arial</option>
                      <option value="'Arial Black', Arial, sans-serif">Arial Black</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Impact, Haettenschweiler, sans-serif">Impact</option>
                      <option value="'Trebuchet MS', Arial, sans-serif">Trebuchet</option>
                      <option value="Verdana, Geneva, sans-serif">Verdana</option>
                      <option value="'Times New Roman', Times, serif">Times New Roman</option>
                      <option value="'Courier New', Courier, monospace">Courier New</option>
                      <option value="'Brush Script MT', cursive">Brush Script</option>
                      <option value="Copperplate, 'Copperplate Gothic Light', fantasy">Copperplate</option>
                    </select>
                    <label className="block text-sm">
                      Size <b className="float-right">{selectedText.size}%</b>
                      <input
                        className="w-full accent-[#a86f16]"
                        type="range"
                        min="2"
                        max="20"
                        value={selectedText.size}
                        onChange={(e) => updateText({ size: +e.target.value })}
                        onPointerUp={commitTextPreview}
                      />
                    </label>
                    <label className="block text-sm">
                      Rotate <b className="float-right">{selectedText.rotation}°</b>
                      <input
                        className="w-full accent-[#a86f16]"
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedText.rotation}
                        onChange={(e) => updateText({ rotation: +e.target.value })}
                        onPointerUp={commitTextPreview}
                      />
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => updateText({ rotation: Math.max(-180, selectedText.rotation - 15) }, true)}
                        className="rounded-lg border border-black/10 bg-white px-2 py-2 text-sm font-semibold hover:bg-[#f1eadf]"
                      >
                        ↺ 15°
                      </button>
                      <button
                        type="button"
                        onClick={() => updateText({ rotation: 0 }, true)}
                        className="rounded-lg border border-black/10 bg-white px-2 py-2 text-sm font-semibold hover:bg-[#f1eadf]"
                      >
                        0°
                      </button>
                      <button
                        type="button"
                        onClick={() => updateText({ rotation: Math.min(180, selectedText.rotation + 15) }, true)}
                        className="rounded-lg border border-black/10 bg-white px-2 py-2 text-sm font-semibold hover:bg-[#f1eadf]"
                      >
                        15° ↻
                      </button>
                    </div>
                    <label className="flex items-center justify-between text-sm">
                      Color
                      <input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) => updateText({ color: e.target.value })}
                        onBlur={commitTextPreview}
                      />
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {["left", "center", "right"].map((value) => (
                        <button
                          key={value}
                          onClick={() => updateText({ align: value }, true)}
                          className={`rounded-lg border p-1.5 ${selectedText.align === value ? "bg-[#171717] text-white" : "bg-white"}`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={removeSelectedText}
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Remove text
                    </button>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700">
                ⚠ {error}
              </div>
            )}

            <div className="rounded-2xl border border-black/10 bg-[#faf8f4] p-4 text-xs leading-5 text-black/55">
              <b className="text-black/80">Artwork geometry</b>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                <span>Photo placement</span><b>16.5″ × 7.5″</b>
                <span>Final AI / print</span><b>16.5″ × 11″</b>
                <span>Physical tray</span><b>17″ × 11.5″</b>
              </div>
              <p className="mt-2 text-black/40">Tray outline never prints.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
