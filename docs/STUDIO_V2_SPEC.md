# Custom Car Trays — Studio V2 Specification

Status: APPROVED DIRECTION / implementation blueprint
Branch: `studio-v2`

## 1. Goal
Build a premium personalization studio where a customer can upload or create artwork, position it on the real Custom Car Tray geometry, use AI to extend missing background, preview the finished product, and save a production-ready design into the existing cart/order pipeline. Stripe Live remains paused until Studio V2 is validated.

## 2. Non-negotiable physical geometry
The web editor must never redefine the production CAD.

- Physical tray: 17.000 in wide × 11.500 in high
- Material: clear cast acrylic, 3/8 in (9 mm)
- Design/print artwork area: **16.5 in × 11 in**
- 300 DPI artwork target: **4950 × 3300 px**
- Hook depth: 2.125 in
- Hook entry/opening: 1.75 in
- Interior distance between hooks: 6.5 in
- Central arc height: 0.625 in
- Design-area border radius: 0

The exact approved tray outline/CAD asset must ultimately be used as the overlay/mask. Do not approximate the manufacturing cut path from CSS rounded rectangles.

## 3. Core editing model
Studio V2 is a layered editor, not a single image inside a rectangle. Layer order, back to front: workspace/background; AI-expanded artwork; customer original image; customer text/elements; tray visual treatment/product mask; design-area guide; exact tray cut-outline; selection/transform controls. The tray outline, cut geometry, dashed guide and UI controls MUST NEVER appear in the production print file.

## 4. Upload behavior
Preserve the original file and aspect ratio. Do not automatically stretch or crop it. Initially fit the complete image inside the **16.5 × 11 in** design area using `contain`, centered horizontally and vertically. Customer can move, scale and rotate it. Empty area around the original image is eligible for AI Expand. Never silently modify original pixels.

## 5. AI Expand
Upload image → center/fit original → show uncovered area → AI Expand Background → AI generates only the missing surrounding area → preserve original image → customer reviews result. Original region remains protected; retry/regenerate is available; original upload remains recoverable; optional custom instruction is supported; AI errors never destroy current design state.

## 6. Persistent tray reference
While editing, the exact 17 × 11.5 tray silhouette remains visible, with outer edge and hook cutouts locked above artwork. The 16.5 × 11 artwork guide is editor-only. Product and print previews intentionally hide editor guides.

## 7. Desktop layout target
Top: brand, Design → Review → Add to Cart, Continue. Left: Upload, AI Expand, Add Text, Undo, Redo, Reset; later Templates, Elements, Background. Center: tray workspace, silhouette, artwork guide, transforms, 17 × 11.5 physical reference. Right: contextual image/text controls. Bottom: Editor View, Product Preview, In-Car Preview, Print File and image-quality status.

## 8. Mobile
Mobile is required. Canvas remains primary; toolbars collapse appropriately; touch targets approximately 44 px minimum; transformations have touch and explicit controls; no horizontal page overflow; full upload → edit → review → cart flow works on phone.

## 9. Editing capabilities
Phase A: upload, center/contain, select, drag, scale, rotate, delete/replace, reset, undo/redo, tray overlay, design guide. Phase B: AI Expand, retry, prompt, original/expanded preservation. Phase C: text, font, size, color, alignment, rotation and layer ordering. Phase D: templates, elements and backgrounds. Do not build Phase D before foundation and AI are reliable.

## 10. Undo/redo
Meaningful actions create history states: upload/replace, move, scale, rotate, AI result, text changes and template/background changes. Do not create history entries for every pointer pixel.

## 11. Preview modes
**Editor:** artwork + tray overlay + guides + controls. **Product:** artwork clipped/mapped to tray shape, no guides. **In-Car:** customized tray installed on steering wheel mockup. **Print File:** artwork only at production resolution, no tray outline, guides, handles or UI.

## 12. Production output
Retain designId, original upload, expanded/generated asset when applicable, preview, print-ready file, tray version, transform metadata, text/elements, AI metadata and timestamp. Existing `/api/designs` → cart → checkout/order path remains functional. Production artwork target is **16.5 × 11 in at 300 DPI = 4950 × 3300 px** unless a later printer requirement explicitly supersedes it.

## 13. Image quality
Report source pixel dimensions, effective DPI at final placed size, coverage status and artwork-outside-area warnings. Do not show “High Quality” unless calculated from source and placement.

## 14. Existing functionality to preserve
Preserve $50 price, `/api/designs`, stored preview/print assets, cart designId, Stripe Sandbox checkout, `checkout.session.completed`, Neon Order/OrderItem and `/admin`. Stripe Live remains out of scope until Studio is approved.

## 15. Safety rails
Work only on `studio-v2`; no Stripe credential changes or Live activation; do not alter CAD to simplify UI; never bake guides into artwork; never destructively overwrite original uploads; never expose API secrets client-side.

## 16. Checkpoints
1. Studio shell + geometry. 2. Core image editor. 3. Correct Editor/Product/Print separation. 4. Reliable AI Expand preserving original. 5. Text/personalization. 6. Sandbox commerce integration. 7. Mobile, image quality, errors, output and production metadata QA.

Only after these checkpoints are approved should Studio V2 be promoted toward launch and Stripe Live work resume.

## 17. Definition of success
A first-time customer can arrive with an ordinary photo, including vertical, upload it, understand where it sits on the real tray, use AI to complete the scene, personalize it, preview the physical result and buy it without needing design software or print-production knowledge.
