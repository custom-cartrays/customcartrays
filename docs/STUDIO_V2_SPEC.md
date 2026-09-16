# Custom Car Trays — Studio V2 Specification

Status: APPROVED DIRECTION / implementation blueprint
Branch: `studio-v2`

## 1. Goal

Build a premium personalization studio where a customer can upload or create artwork, position it on the real Custom Car Tray geometry, use AI to extend missing background, preview the finished product, and save a production-ready design into the existing cart/order pipeline.

The Studio is the core product experience. Stripe Live remains paused until Studio V2 is validated.

## 2. Non-negotiable physical geometry

The web editor must never redefine the production CAD.

- Physical tray: 17.000 in wide × 11.500 in high
- Material: clear cast acrylic, 3/8 in (9 mm)
- Recommended design area: 16.5 in × 7.625 in
- Recommended design margins: top 1 in, bottom 0, sides 0
- Hook depth: 2.125 in
- Hook entry/opening: 1.75 in
- Interior distance between hooks: 6.5 in
- Central arc height: 0.625 in
- Design-area border radius: 0

The exact approved tray outline/CAD asset must ultimately be used as the overlay/mask. Do not approximate the manufacturing cut path from CSS rounded rectangles.

## 3. Core editing model

Studio V2 is a layered editor, not a single image inside a rectangle.

Layer order, back to front:

1. Workspace/background — editor only
2. AI-expanded/background artwork
3. Customer original image
4. Customer text/elements
5. Tray visual treatment / product mask
6. Recommended design-area guide — editor only
7. Exact tray cut-outline overlay — editor only, locked, always visible
8. Selection/transform controls — editor only

The tray outline, cut geometry, dashed guide and UI controls MUST NEVER appear in the production print file.

## 4. Upload behavior

When a customer uploads an image:

- Preserve the original file and aspect ratio.
- Do NOT automatically stretch or crop it to cover the entire tray.
- Initially fit the complete image inside the recommended 16.5 × 7.625 design area (`contain` behavior), centered horizontally and vertically.
- Customer can move, scale and rotate it after upload.
- Empty area around the original image remains visible and is eligible for AI Expand.
- Never silently modify the original pixels.

This intentionally replaces the current `Math.max(...)` cover behavior.

## 5. AI Expand

Primary Studio V2 feature.

Desired flow:

Upload image → center/fit original → show uncovered area → AI Expand Background → AI generates only the missing surrounding area → preserve original image → customer reviews result.

Requirements:

- Original image region remains protected from unintended replacement.
- AI output fills/extends the background to the required design canvas.
- Allow retry/regenerate.
- Keep the original upload available for comparison/recovery.
- Store enough metadata to reproduce/audit which asset is original versus AI-expanded.
- AI prompt may be automatic by default, with an optional custom instruction.
- AI errors must never destroy the current design state.

Potential quick actions after core implementation: Same Style, More Sky, More Land, Blur Fill, Color Match, Custom Prompt. These are secondary to reliable AI Expand.

## 6. Persistent tray reference

The customer must understand the physical cut at all times.

While editing:

- Exact 17 × 11.5 tray silhouette is visible as the visual workspace/reference.
- Exact outer edge and hook cutouts are shown by a locked outline above the artwork.
- Recommended design area is shown as a dashed guide.
- Overlay is pointer-events disabled / non-selectable.
- Overlay remains visible while moving, scaling, rotating, adding text, or using AI.

Views that intentionally hide guides are handled separately under Preview modes.

## 7. Desktop layout target

Visual direction follows the approved Studio V2 concept:

### Top bar
- Custom Car Trays brand
- Progress: 1 Design Your Tray → 2 Review → 3 Add to Cart
- Save (when persistence is implemented)
- Continue

### Left toolbar
Initial/core:
- Upload
- AI Expand
- Add Text
- Undo
- Redo
- Reset

Progressive additions:
- Templates
- Elements
- Background

### Center
- Large tray workspace
- Real tray silhouette/outline
- Dashed recommended design area
- Artwork and transform handles
- Physical size reference: 17 × 11.5 in

### Right inspector
Context-sensitive controls for selected object:
- Image / Adjust / Effects tabs as functionality becomes available
- Scale
- Rotation
- Position
- Replace/delete image
- AI Expand Background

### Bottom preview strip
- Editor View
- Product Preview
- In-Car Preview
- Print File (No Guides)
- Image-quality / production-readiness status

## 8. Mobile

Mobile is required, not a later desktop-only port.

- Canvas remains the primary visual area.
- Toolbars collapse into bottom sheets/drawers.
- Touch targets approximately 44 px minimum.
- Pinch zoom may be added, but every transformation must also have button/slider controls.
- No horizontal page overflow.
- Customer can complete upload → edit → review → add to cart from a phone.

## 9. Editing capabilities

### Phase A — foundation
- Upload image
- Center + contain
- Select image
- Drag/move
- Scale/zoom
- Rotate
- Delete/replace
- Reset
- Undo/redo
- Persistent exact tray overlay
- Dashed design guide

### Phase B — AI
- AI Expand Background
- Retry/regenerate
- Optional prompt
- Original vs expanded asset preservation

### Phase C — personalization
- Add text
- Edit text
- Font selection
- Size
- Color
- Alignment
- Rotation
- Layer ordering where needed

### Phase D — content accelerators
- Templates
- Elements
- Background options

Do not build Phase D before the foundation and AI workflow are reliable.

## 10. Undo/redo model

Meaningful user actions should create history states, including:

- upload/replace
- move
- scale
- rotate
- AI expand result
- add/edit/delete text
- background/template changes

History must not include transient pointer movement for every pixel; commit transform state at logical action boundaries.

## 11. Preview modes

### Editor View
Shows artwork + tray overlay + guides + editing controls.

### Product Preview
Shows artwork clipped/mapped to the actual tray shape. No dashed guides or transform controls.

### In-Car Preview
Shows the customized tray installed on a steering wheel using a controlled product mockup. This is a customer visualization, not the production file.

### Print File
Shows/exports artwork only at production resolution. No tray outline, no guides, no handles, no UI.

## 12. Production output

Existing design persistence/order infrastructure should be preserved and evolved rather than replaced unnecessarily.

For each saved design retain at minimum:

- designId
- original upload reference
- expanded/generated asset reference when applicable
- preview image
- print-ready image/file
- physical tray identifier/version
- scale/position/rotation metadata
- text/elements metadata
- AI metadata where applicable
- timestamp

Existing `/api/designs` → cart → checkout/order path should remain functional.

The current implementation generates a 990 × 690 preview and 4950 × 3300 print image. Studio V2 must review output dimensions against the final print-production specification before launch; do not infer manufacturing dimensions solely from the current implementation.

## 13. Image quality / production readiness

Studio should eventually report useful, non-misleading checks:

- source pixel dimensions
- effective DPI at final placed size
- aspect/coverage status
- whether important artwork lies outside the recommended design area

Do not show “High Quality” unless calculated from the actual source and final placement.

## 14. Existing functionality to preserve

Do not break the verified business pipeline while rebuilding the editor:

- $50 product price
- `/api/designs`
- stored preview/print assets
- cart item with designId
- Stripe Sandbox checkout
- `checkout.session.completed` webhook
- Neon Order / OrderItem persistence
- `/admin` order visibility

Stripe Live activation is explicitly out of scope for Studio V2 implementation until the Studio is approved.

## 15. Safety rails

- Work on `studio-v2`; do not directly replace the validated launch branch until QA/approval.
- No Stripe credential changes.
- No Stripe Live activation.
- Do not alter physical CAD dimensions to make UI implementation easier.
- Do not bake guides into customer artwork.
- Do not destructively overwrite original uploads with AI output.
- Do not expose AI/API secrets client-side.

## 16. Implementation checkpoints

### Checkpoint 1 — Studio shell + real geometry
Pass when desktop/mobile shell exists and exact tray overlay/design guide render correctly.

### Checkpoint 2 — Core image editor
Pass when upload defaults to centered contain and move/scale/rotate/reset/undo/redo work reliably.

### Checkpoint 3 — Correct previews/exports
Pass when Editor, Product and Print views are clearly separated and print output contains zero editor guides.

### Checkpoint 4 — AI Expand
Pass when a portrait or undersized photo can be centered and AI reliably fills the missing canvas while preserving the original region.

### Checkpoint 5 — Text/personalization
Pass when text editing works on desktop and mobile and survives save/reload as required.

### Checkpoint 6 — Existing commerce integration
Pass when Studio V2 saves a design and the existing Sandbox flow still completes: design → cart → $50 checkout → webhook → Neon → `/admin`.

### Checkpoint 7 — UX/production QA
Pass when mobile usability, image-quality checks, error states, output files, and production metadata have been verified.

Only after these checkpoints are approved should Studio V2 be promoted toward the launch branch and Stripe Live work resume.

## 17. Definition of success

A first-time customer should be able to arrive with an ordinary photo — including a vertical photo — upload it, immediately understand where it sits on the real tray, use AI to complete the surrounding scene, personalize it, preview the physical result, and buy it without needing design software or understanding print production.
