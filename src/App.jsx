import { useState, useRef, useEffect, useCallback } from "react";

const PPI = 44;
const SW  = Math.round(16.5 * PPI); // 726
const SH  = Math.round(11   * PPI); // 484
const IH  = Math.round(7.625 * PPI); // 336 image zone (bottom)
const HH  = SH - IH; // 148 hook zone (top)
const FAL = "d3269fff-859d-46f6-9108-bf4629136c24:3fedda6dd1b86d2b57641612f631691f";

export default function App() {
  const [tab, setTab]           = useState("ai");
  const [image, setImage]       = useState(null);
  const [imgName, setImgName]   = useState("");
  const [expanded, setExpanded] = useState(false);

  const [pos,   setPos]   = useState({ x:0, y:0 });
  const [scale, setScale] = useState(1);
  const [rot,   setRot]   = useState(0);
  const [nat,   setNat]   = useState({ w:1, h:1 });

  const [prompt, setPrompt]   = useState("");
  const [genLoad, setGenLoad] = useState(false);
  const [genErr,  setGenErr]  = useState("");
  const [genProg, setGenProg] = useState(0);

  const [expLoad, setExpLoad] = useState(false);
  const [expErr,  setExpErr]  = useState("");
  const [expProg, setExpProg] = useState(0);

  const [urlInput, setUrlInput] = useState("");
  const [urlErr,   setUrlErr]   = useState("");

  const [prevT, setPrevT] = useState(null);

  const dragging = useRef(false);
  const lastXY   = useRef({ x:0, y:0 });
  const pinchD   = useRef(null);
  const canvasEl = useRef(null);
  const wrapEl   = useRef(null);
  const [ds, setDs] = useState(1);

  useEffect(() => {
    const upd = () => {
      if (wrapEl.current) setDs(Math.min(1, wrapEl.current.offsetWidth / SW));
    };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const loadImg = useCallback((src, name) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, Math.min(SW / img.naturalWidth, IH / img.naturalHeight));
      setScale(s); setPos({ x:0, y:0 }); setRot(0);
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
      setImage(src); setImgName(name || "image");
      setExpanded(false); setPrevT(null);
    };
    img.src = src;
  }, []);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => loadImg(ev.target.result, f.name);
    r.readAsDataURL(f);
  };

  const onUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setUrlErr("");
    const px = "https://images.weserv.nl/?url=" + encodeURIComponent(url) + "&output=jpg";
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      try { loadImg(c.toDataURL("image/jpeg", 0.95), "url-image"); }
      catch (_) { setUrlErr("No se pudo cargar."); }
    };
    img.onerror = () => setUrlErr("URL inválida o bloqueada.");
    img.src = px;
  };

  const imgW = nat.w * scale;
  const imgH = nat.h * scale;
  const imgX = (SW - imgW) / 2 + pos.x;
  const imgY = HH + (IH - imgH) / 2 + pos.y;

  const saveSnap = useCallback(() => {
    setPrevT({ pos, scale, rot });
  }, [pos, scale, rot]);

  const onMD = (e) => {
    if (!image) return;
    dragging.current = true;
    lastXY.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const onMM = useCallback((e) => {
    if (!dragging.current) return;
    setPos(p => ({
      x: p.x + (e.clientX - lastXY.current.x) / ds,
      y: p.y + (e.clientY - lastXY.current.y) / ds,
    }));
    lastXY.current = { x: e.clientX, y: e.clientY };
  }, [ds]);

  const onMU = useCallback(() => {
    if (dragging.current) saveSnap();
    dragging.current = false;
  }, [saveSnap]);

  const onTS = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchD.current = Math.sqrt(dx*dx + dy*dy);
      dragging.current = false;
    } else {
      pinchD.current = null;
      if (!image) return;
      dragging.current = true;
      lastXY.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const onTM = (e) => {
    if (e.touches.length === 2 && pinchD.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.sqrt(dx*dx + dy*dy);
      setScale(s => Math.min(1, Math.max(0.05, s * (d / pinchD.current))));
      pinchD.current = d;
    } else if (e.touches.length === 1 && dragging.current) {
      const dx = (e.touches[0].clientX - lastXY.current.x) / ds;
      const dy = (e.touches[0].clientY - lastXY.current.y) / ds;
      lastXY.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  };

  const onWheel = useCallback((e) => {
    if (!image) return;
    e.preventDefault();
    setScale(s => Math.min(1, Math.max(0.05, s + (e.deltaY < 0 ? 0.04 : -0.04))));
  }, [image]);

  useEffect(() => {
    const el = canvasEl.current;
    if (el) el.addEventListener("wheel", onWheel, { passive: false });
    return () => { if (el) el.removeEventListener("wheel", onWheel); };
  }, [onWheel]);

  useEffect(() => {
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup", onMU);
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && prevT) {
        e.preventDefault();
        setPos(prevT.pos); setScale(prevT.scale); setRot(prevT.rot);
        setPrevT(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("mouseup", onMU);
      window.removeEventListener("keydown", onKey);
    };
  }, [onMM, onMU, prevT]);

  // ── AI Generate ──────────────────────────────────────────────────────────────
  const generate = async () => {
    if (!prompt.trim() || genLoad) return;
    setGenLoad(true); setGenErr(""); setGenProg(15);
    try {
      const res = await fetch("https://fal.run/fal-ai/flux-pro/v1", {
        method: "POST",
        headers: { "Authorization": "Key " + FAL, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt + ", high quality artwork, ultra detailed, no text, no watermarks, no borders",
          image_size: { width: 1320, height: 610 },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          output_format: "jpeg",
          safety_tolerance: "2",
        }),
      });
      setGenProg(78);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const url = data.images && data.images[0] && data.images[0].url;
      if (!url) throw new Error("No image returned");
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      setGenProg(100);
      loadImg(c.toDataURL("image/jpeg", 0.95), "ai-design.jpg");
    } catch (err) {
      setGenErr(err.message || "Error al generar");
    } finally {
      setGenLoad(false);
    }
  };

  const uploadFal = async (dataUrl, filename) => {
    const blob = await (await fetch(dataUrl)).blob();
    const res = await fetch("https://fal.run/storage/upload", {
      method: "POST",
      headers: { "Authorization": "Key " + FAL, "Content-Type": blob.type, "X-Fal-File-Name": filename },
      body: blob,
    });
    if (!res.ok) throw new Error("Upload failed");
    return (await res.json()).url;
  };

  // ── AI Expand (outpainting hook zone) ────────────────────────────────────────
  const expand = async () => {
    if (!image || expLoad) return;
    setExpLoad(true); setExpErr(""); setExpProg(5);
    try {
      const EPPI = 80;
      const eW = Math.round(16.5 * EPPI); // 1320
      const eH = Math.round(11   * EPPI); // 880
      const eIH = Math.round(7.625 * EPPI); // 610
      const eHH = eH - eIH; // 270
      const su = EPPI / PPI;

      const sc = document.createElement("canvas");
      sc.width = eW; sc.height = eH;
      const ctx = sc.getContext("2d");
      ctx.fillStyle = "#111"; ctx.fillRect(0, 0, eW, eH);
      const imgEl = new Image();
      await new Promise((res, rej) => { imgEl.onload = res; imgEl.onerror = rej; imgEl.src = image; });
      const cx = (imgX + imgW/2) * su;
      const cy = (imgY + imgH/2) * su;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot * Math.PI / 180);
      ctx.drawImage(imgEl, -(imgW*su)/2, -(imgH*su)/2, imgW*su, imgH*su);
      ctx.restore();
      setExpProg(20);

      const mc = document.createElement("canvas");
      mc.width = eW; mc.height = eH;
      const mctx = mc.getContext("2d");
      mctx.fillStyle = "#fff"; mctx.fillRect(0, 0, eW, eH);
      mctx.fillStyle = "#000"; mctx.fillRect(0, eHH, eW, eIH);
      setExpProg(30);

      const [imgUrl, maskUrl] = await Promise.all([
        uploadFal(sc.toDataURL("image/jpeg", 0.92), "sheet.jpg"),
        uploadFal(mc.toDataURL("image/png"), "mask.png"),
      ]);
      setExpProg(52);

      const res = await fetch("https://fal.run/fal-ai/flux-pro/v1/fill", {
        method: "POST",
        headers: { "Authorization": "Key " + FAL, "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imgUrl,
          mask_url: maskUrl,
          prompt: "seamlessly extend the image matching style colors lighting mood of the main artwork, high quality, continuous background, no borders",
          num_inference_steps: 28,
          guidance_scale: 3.5,
          output_format: "jpeg",
        }),
      });
      setExpProg(84);
      if (!res.ok) throw new Error("fal.ai error: " + await res.text());
      const data = await res.json();
      const aiUrl = data.images && data.images[0] && data.images[0].url;
      if (!aiUrl) throw new Error("No image returned");

      const aiImg = new Image();
      aiImg.crossOrigin = "anonymous";
      await new Promise((res, rej) => { aiImg.onload = res; aiImg.onerror = rej; aiImg.src = aiUrl; });

      const fc = document.createElement("canvas");
      fc.width = eW; fc.height = eH;
      const fctx = fc.getContext("2d");
      fctx.drawImage(aiImg, 0, 0, eW, eH);
      fctx.save();
      fctx.translate(cx, cy);
      fctx.rotate(rot * Math.PI / 180);
      fctx.drawImage(imgEl, -(imgW*su)/2, -(imgH*su)/2, imgW*su, imgH*su);
      fctx.restore();

      setExpProg(100);
      const finalSrc = fc.toDataURL("image/jpeg", 0.95);
      setImage(finalSrc);
      setNat({ w: eW, h: eH });
      setScale(1); setPos({ x:0, y:0 }); setRot(0);
      setExpanded(true);
    } catch (err) {
      setExpErr(err.message || "Error al expandir");
    } finally {
      setExpLoad(false);
    }
  };

  // ── Download 300 DPI ─────────────────────────────────────────────────────────
  const download = () => {
    if (!image) return;
    const DPI = 300;
    const cW = Math.round(16.5 * DPI);
    const cH = Math.round(11   * DPI);
    const su = DPI / PPI;
    const c = document.createElement("canvas");
    c.width = cW; c.height = cH;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cW, cH);
    const img = new Image();
    img.onload = () => {
      if (expanded) {
        ctx.drawImage(img, 0, 0, cW, cH);
      } else {
        const eIH = Math.round(7.625 * DPI);
        const eHH = cH - eIH;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, eHH, cW, eIH); ctx.clip();
        ctx.translate((imgX + imgW/2)*su, (imgY + imgH/2)*su);
        ctx.rotate(rot * Math.PI / 180);
        ctx.drawImage(img, -(imgW*su)/2, -(imgH*su)/2, imgW*su, imgH*su);
        ctx.restore();
      }
      c.toBlob(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "cartray-" + Date.now() + ".png";
        a.click();
      }, "image/png");
    };
    img.src = image;
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const Spinner = () => (
    <span style={{ display:"inline-block", width:15, height:15, border:"2.5px solid rgba(255,255,255,.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite", marginRight:8, flexShrink:0 }} />
  );

  const ProgressBar = ({ value, color }) => (
    <div style={{ marginTop:10 }}>
      <div style={{ height:4, background:"rgba(255,255,255,.08)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", background: color || "#f97316", borderRadius:2, width:value+"%", transition:"width .4s ease" }} />
      </div>
      <div style={{ fontSize:11, color:"#555", marginTop:5 }}>
        {value < 30 ? "Preparando..." : value < 55 ? "Conectando con IA..." : value < 88 ? "Generando..." : "Finalizando..."}
      </div>
    </div>
  );

  const ErrBox = ({ msg }) => msg ? (
    <div style={{ marginTop:10, padding:"9px 12px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.25)", borderRadius:10, fontSize:12, color:"#fca5a5" }}>⚠ {msg}</div>
  ) : null;

  const card = { background:"#13131f", border:"1px solid #1e1e32", borderRadius:16, padding:"18px 16px" };
  const sectionLabel = { fontSize:10, color:"#f97316", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:700, marginBottom:12, display:"block" };
  const btn = (bg, disabled) => ({
    width:"100%", padding:"12px 16px", border:"none", borderRadius:11,
    fontWeight:700, fontSize:14, cursor: disabled ? "not-allowed" : "pointer",
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    background: disabled ? "rgba(255,255,255,.05)" : bg,
    color: disabled ? "#444" : "#fff",
    transition:"opacity .15s",
  });

  return (
    <div style={{ minHeight:"100vh", background:"#090912", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:"#e0defa" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        input[type="file"]::file-selector-button {
          padding:9px 16px; border-radius:9px; border:1.5px solid #f97316;
          background:rgba(249,115,22,.1); color:#f97316; cursor:pointer;
          font-size:12px; margin-right:10px; font-family:inherit; font-weight:600;
        }
        input[type="file"]::file-selector-button:hover { background:rgba(249,115,22,.2); }
        input[type="file"] { color:#666; font-family:inherit; font-size:12px; width:100%; }
        textarea, input[type="text"] { outline:none; }
        textarea:focus, input[type="text"]:focus { border-color:#f97316 !important; }
        input[type="range"] { accent-color:#f97316; cursor:pointer; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .fade { animation:fadeIn .3s ease; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding:"14px 24px", borderBottom:"1px solid #1a1a2e", display:"flex", alignItems:"center", gap:14, background:"#090912", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ width:40, height:40, background:"linear-gradient(135deg,#f97316,#c2410c)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🚗</div>
        <div>
          <div style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.4px", color:"#fff" }}>Car Tray Studio</div>
          <div style={{ fontSize:11, color:"#555", marginTop:1 }}>customcartrays.com · 16.5" × 11" Custom Design</div>
        </div>
        {image && (
          <button onClick={download} style={{ marginLeft:"auto", padding:"9px 20px", background:"linear-gradient(135deg,#f97316,#c2410c)", border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:"0 4px 20px rgba(249,115,22,.3)" }}>
            ⬇ Descargar
          </button>
        )}
      </header>

      <div style={{ display:"flex", gap:0, maxWidth:1300, margin:"0 auto", padding:"20px 16px 40px", flexWrap:"wrap" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width:310, flexShrink:0, display:"flex", flexDirection:"column", gap:10, paddingRight:20 }}>

          {/* STEP 1 */}
          <div style={card} className="fade">
            <span style={sectionLabel}>01 · Crea tu diseño</span>
            <div style={{ display:"flex", gap:4, background:"#0a0a14", borderRadius:12, padding:4, marginBottom:14 }}>
              {[["ai","✨ IA"],["upload","📁 Subir"],["url","🔗 URL"]].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", background: tab===id ? "#1e1e38" : "transparent", color: tab===id ? "#f97316" : "#555", fontSize:12, fontWeight: tab===id ? 700 : 400, cursor:"pointer", transition:"all .15s" }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "ai" && (
              <div>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate(); }}
                  placeholder={"Describe tu diseño...\n\nEj: anime girl cyberpunk city neon lights,\nanimal kingdom savannah sunset,\nspace galaxy colorful nebula"}
                  rows={5}
                  style={{ width:"100%", background:"#0a0a14", border:"1px solid #1e1e32", borderRadius:11, color:"#ddd", fontSize:13, padding:"11px 13px", resize:"vertical", lineHeight:1.65, fontFamily:"inherit" }}
                />
                <button onClick={generate} disabled={genLoad || !prompt.trim()} style={btn("linear-gradient(135deg,#f97316,#c2410c)", genLoad || !prompt.trim())} >
                  {genLoad ? <><Spinner />Generando...</> : "✨ Generar con IA"}
                </button>
                {genLoad && <ProgressBar value={genProg} />}
                <ErrBox msg={genErr} />
                <div style={{ fontSize:10, color:"#333", marginTop:8 }}>Ctrl+Enter para generar rápido</div>
              </div>
            )}

            {tab === "upload" && (
              <div>
                <input type="file" accept="image/*" onChange={onFile} />
                {image && <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:10, color:"#4ade80", fontSize:12 }}>✓ {imgName}</div>}
              </div>
            )}

            {tab === "url" && (
              <div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setUrlErr(""); }}
                    onKeyDown={e => e.key === "Enter" && onUrl()}
                    placeholder="https://..."
                    style={{ flex:1, background:"#0a0a14", border:"1px solid #1e1e32", borderRadius:10, color:"#ddd", fontSize:13, padding:"10px 12px", fontFamily:"inherit" }}
                  />
                  <button onClick={onUrl} style={{ padding:"10px 16px", background:"#f97316", border:"none", borderRadius:10, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:16 }}>→</button>
                </div>
                <ErrBox msg={urlErr} />
              </div>
            )}
          </div>

          {/* STEP 2 — Position */}
          {image && (
            <div style={card} className="fade">
              <span style={sectionLabel}>02 · Posiciona tu imagen</span>
              <div style={{ fontSize:11, color:"#444", marginBottom:14, lineHeight:1.6 }}>
                Arrastra en el canvas · Scroll = zoom · Pellizca en móvil
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                  <span style={{ fontSize:11, color:"#555", letterSpacing:"0.1em" }}>ZOOM</span>
                  <span style={{ fontSize:12, color:"#f97316", fontWeight:700 }}>{Math.round(scale*100)}%</span>
                </div>
                <input type="range" min="5" max="100" step="1" value={Math.round(scale*100)} onChange={e => setScale(Number(e.target.value)/100)} style={{ width:"100%" }} />
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                  <span style={{ fontSize:11, color:"#555", letterSpacing:"0.1em" }}>ROTACIÓN</span>
                  <span style={{ fontSize:12, color:"#f97316", fontWeight:700 }}>{rot}°</span>
                </div>
                <input type="range" min="-180" max="180" step="1" value={rot} onChange={e => { saveSnap(); setRot(Number(e.target.value)); }} style={{ width:"100%" }} />
                <div style={{ display:"flex", gap:5, marginTop:8 }}>
                  {[["↺ −90",-90],["0°",0],["↻ +90",90]].map(([l,v]) => (
                    <button key={v} onClick={() => { saveSnap(); setRot(v); }} style={{ flex:1, padding:"6px", background: rot===v ? "rgba(249,115,22,.15)" : "#0e0e1e", border:"1px solid", borderColor: rot===v ? "#f97316" : "#1e1e32", borderRadius:8, color: rot===v ? "#f97316" : "#555", fontSize:11, cursor:"pointer", fontWeight: rot===v ? 700 : 400 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:"#555", letterSpacing:"0.1em", marginBottom:8 }}>ALINEACIÓN</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5 }}>
                  {[
                    ["◀ Izq",  () => setPos(p => ({...p, x: -(SW-imgW)/2}))],
                    ["· Ctr ·",() => setPos(p => ({...p, x: 0}))],
                    ["Der ▶",  () => setPos(p => ({...p, x: (SW-imgW)/2}))],
                    ["▲ Arr",  () => setPos(p => ({...p, y: -(IH-imgH)/2}))],
                    ["· Mid ·",() => setPos(p => ({...p, y: 0}))],
                    ["Aba ▼",  () => setPos(p => ({...p, y: (IH-imgH)/2}))],
                  ].map(([l, fn]) => (
                    <button key={l} onClick={() => { saveSnap(); fn(); }} style={{ padding:"7px 4px", background:"#0e0e1e", border:"1px solid #1e1e32", borderRadius:8, color:"#888", fontSize:10, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {prevT && (
                <button onClick={() => { setPos(prevT.pos); setScale(prevT.scale); setRot(prevT.rot); setPrevT(null); }} style={{ width:"100%", padding:"8px", background:"#0e0e1e", border:"1px solid #1e1e32", borderRadius:9, color:"#777", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  ↩ Deshacer  (Ctrl+Z)
                </button>
              )}
            </div>
          )}

          {/* STEP 3 — AI Fill */}
          {image && !expanded && (
            <div style={card} className="fade">
              <span style={sectionLabel}>03 · Rellenar con IA</span>
              <div style={{ fontSize:12, color:"#444", marginBottom:12, lineHeight:1.7 }}>
                La IA extiende tu diseño para llenar toda la hoja <strong style={{color:"#888"}}>16.5" × 11"</strong> — incluyendo la zona de ganchos arriba.
              </div>
              <button onClick={expand} disabled={expLoad} style={btn("linear-gradient(135deg,#7c3aed,#5b21b6)", expLoad)}>
                {expLoad ? <><Spinner />Rellenando...</> : "✨ Rellenar con IA"}
              </button>
              {expLoad && <ProgressBar value={expProg} color="#7c3aed" />}
              <ErrBox msg={expErr} />
            </div>
          )}

          {/* STEP 4 — Download */}
          {image && (
            <div style={card} className="fade">
              <span style={sectionLabel}>{expanded ? "04" : "03"} · Descargar</span>
              <div style={{ fontSize:11, color:"#444", marginBottom:12 }}>PNG · 300 DPI · 4950 × 3300 px · Listo para imprenta</div>
              {!expanded && (
                <div style={{ marginBottom:10, padding:"9px 12px", background:"rgba(249,115,22,.07)", border:"1px solid rgba(249,115,22,.2)", borderRadius:10, fontSize:11, color:"#f97316", lineHeight:1.6 }}>
                  💡 Recomendado: rellena el fondo con IA antes de descargar para el mejor resultado.
                </div>
              )}
              <button onClick={download} style={btn("linear-gradient(135deg,#f97316,#c2410c)", false)}>
                ⬇ Descargar Archivo
              </button>
              {expanded && (
                <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:10, color:"#4ade80", fontSize:12, fontWeight:600 }}>
                  ✓ Fondo rellenado — ¡listo para imprimir!
                </div>
              )}
            </div>
          )}

          {/* Specs */}
          <div style={{ ...card, background:"#0a0a12" }}>
            <span style={sectionLabel}>Especificaciones</span>
            {[
              ["Hoja","16.5\" × 11\""],
              ["Zona de imagen","16.5\" × 7.625\""],
              ["Zona de ganchos","3.375\" (arriba)"],
              ["Material","Acrílico 3/8\" (9mm)"],
              ["Resolución","300 DPI"],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                <span style={{ fontSize:11, color:"#444" }}>{k}</span>
                <span style={{ fontSize:11, color:"#666", letterSpacing:"0.05em" }}>{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CANVAS ── */}
        <div style={{ flex:1, minWidth:0 }} ref={wrapEl}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:10, color:"#333", letterSpacing:"0.15em", textTransform:"uppercase" }}>Vista previa</span>
            <span style={{ fontSize:10, color:"#2a2a3e" }}>16.5" × 11" · {Math.round(ds*100)}% escala</span>
          </div>

          {/* Canvas wrapper for responsive scaling */}
          <div style={{ width: SW * ds, height: SH * ds, position:"relative", flexShrink:0 }}>
            <div
              ref={canvasEl}
              onMouseDown={onMD}
              onTouchStart={onTS}
              onTouchMove={onTM}
              onTouchEnd={() => { dragging.current = false; pinchD.current = null; }}
              style={{
                position:"absolute", top:0, left:0,
                width: SW, height: SH,
                background:"#0c0c18",
                borderRadius:12,
                overflow:"hidden",
                transformOrigin:"top left",
                transform:"scale(" + ds + ")",
                cursor: image ? "grab" : "default",
                boxShadow:"0 24px 80px rgba(0,0,0,.6)",
                border:"1px solid #1a1a2e",
                userSelect:"none",
              }}
            >
              {/* Grid */}
              <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize:"22px 22px", pointerEvents:"none" }} />

              {/* Image */}
              {image && (
                <img
                  src={image}
                  draggable={false}
                  alt="design"
                  style={{
                    position:"absolute",
                    left:   expanded ? 0 : imgX,
                    top:    expanded ? 0 : imgY,
                    width:  expanded ? SW : imgW,
                    height: expanded ? SH : imgH,
                    transform: expanded ? "none" : "rotate(" + rot + "deg)",
                    transformOrigin:"center center",
                    pointerEvents:"none",
                    objectFit: expanded ? "fill" : "fill",
                  }}
                />
              )}

              {/* Hook zone overlay (only when not expanded) */}
              {!expanded && (
                <div style={{ position:"absolute", top:0, left:0, width:SW, height:HH, background:"rgba(6,6,22,.72)", borderBottom:"1px dashed rgba(249,115,22,.22)", pointerEvents:"none", zIndex:3 }}>
                  <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"rgba(249,115,22,.4)", letterSpacing:"0.15em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                    ZONA DE GANCHOS · 3.375"
                  </div>
                </div>
              )}

              {/* Image zone border */}
              {image && !expanded && (
                <div style={{ position:"absolute", top:HH, left:0, width:SW, height:IH, border:"1.5px solid rgba(249,115,22,.3)", pointerEvents:"none", zIndex:4, boxSizing:"border-box" }} />
              )}

              {/* Empty state */}
              {!image && (
                <div style={{ position:"absolute", top:HH, left:0, width:SW, height:IH, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
                  <div style={{ fontSize:48, opacity:.3 }}>🎨</div>
                  <div style={{ fontSize:13, color:"#2a2a3e", textAlign:"center", lineHeight:1.7 }}>
                    Genera un diseño con IA<br/>o sube tu propia imagen
                  </div>
                </div>
              )}

              {/* Expanded badge */}
              {expanded && (
                <div style={{ position:"absolute", top:10, right:10, background:"rgba(124,58,237,.85)", padding:"4px 12px", borderRadius:20, fontSize:10, color:"#fff", fontWeight:700, zIndex:6, backdropFilter:"blur(4px)" }}>
                  ✓ IA RELLENADO
                </div>
              )}

              {/* Corner marks */}
              {[{top:0,left:0},{top:0,right:0,transform:"scaleX(-1)"},{bottom:0,left:0,transform:"scaleY(-1)"},{bottom:0,right:0,transform:"scale(-1,-1)"}].map((p,i) => (
                <div key={i} style={{ position:"absolute",...p, width:14, height:14, borderTop:"2px solid rgba(255,255,255,.12)", borderLeft:"2px solid rgba(255,255,255,.12)", pointerEvents:"none" }} />
              ))}

              {/* Status bar */}
              {image && !expanded && (
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)", padding:"5px 12px", display:"flex", justifyContent:"space-between", fontSize:10, color:"#444", zIndex:5 }}>
                  <span>{(imgW/PPI).toFixed(1)}" × {(imgH/PPI).toFixed(1)}"</span>
                  <span>zoom {Math.round(scale*100)}%  ·  {rot}°</span>
                </div>
              )}
            </div>
          </div>

          {/* Ruler */}
          <div style={{ position:"relative", height:18, marginTop:5, width: SW * ds }}>
            {[0,4,8,12,16.5].map(n => (
              <span key={n} style={{ position:"absolute", left:((n/16.5)*100)+"%", fontSize:9, color:"#222", transform:"translateX(-50%)" }}>{n}"</span>
            ))}
          </div>

          {/* How it works (shown only when no image) */}
          {!image && (
            <div style={{ marginTop:20, padding:"16px", background:"#11111d", borderRadius:14, border:"1px solid #1a1a2e" }}>
              <div style={{ fontSize:13, color:"#333", lineHeight:1.9 }}>
                <span style={{ color:"#f97316", fontWeight:700 }}>¿Cómo funciona?</span><br/>
                <span style={{ color:"#444" }}>
                  1. <span style={{ color:"#666" }}>Describe tu diseño</span> — la IA lo crea en segundos<br/>
                  2. <span style={{ color:"#666" }}>Ajusta la posición y tamaño</span> en el canvas<br/>
                  3. <span style={{ color:"#666" }}>Rellena el fondo con IA</span> para la zona de ganchos<br/>
                  4. <span style={{ color:"#666" }}>Descarga</span> tu archivo de impresión a 300 DPI
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
