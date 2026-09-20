# Social Post Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four editing modes with direct manipulation, offer square/portrait output, and support two uploaded logo assets through three placement presets.

**Architecture:** Retain the offline HTML/CSS/JavaScript and native Canvas renderer. Extract small, testable brand-geometry and media-lifetime modules; keep one editor state and one renderer for preview/export. DOM handles route pointer/keyboard actions explicitly rather than guessing which editing mode the user intended.

**Tech Stack:** Existing Node.js, locked npm dependencies, jsdom, @napi-rs/canvas and sharp. No new runtime or development dependencies.

**Spec:** `docs/superpowers/specs/2026-09-19-social-post-editor-design.md` (approved 2026-09-19).

## Global Constraints

- Output: `1:1`, 1080×1080; `3:4`, 1080×1440. Remove `4:3`; do not introduce `4:5`.
- Preserve four photos, 29 layouts, palette/spacing, undo/redo, navy application identity and offline single-file delivery.
- No editing-mode dropdown, generic shape buttons, polygon vertex editor or coordinate-number panel.
- Two independent logo uploads; `none`, `corner`, `top`, `bottom` placements; at most one logo displayed.
- Logo PNG/JPEG/WebP only; 10 MiB maximum file size; decoded width and height each at most 4096. Photos retain existing 40 MiB limit.
- Preserve complete logo aspect ratio/transparency; no redraw, automatic recoloring, background removal or trimming.
- Square size: default .12, range .06–.24 of output width. Wordmark size: default .24, range .12–.40. Padding: default 24, range 12–64 output pixels.
- Top/bottom white band: logo height plus twice padding, capped at 20% of output height; shrink logo proportionally to fit.
- Buttons and drag targets: at least 44 CSS pixels, with disjoint hit regions; no canvas manipulation animation.
- No network, cloud account, project persistence, publishing, saved brand kit, layout favorites, or new libraries.
- New PR depends on brand PR #2; do not merge either without owner approval. Keep repo private.
- Unknown untracked `2` copies are user-owned: do not read, remove, stage or blanket-ignore them. Do not claim original checkout is clean.
- Local-file browser automation was denied previously. Do not use alternate browser tooling, servers, CDP or scripted screenshots to bypass that restriction. Native Canvas/jsdom tests are not browser layout tests.

## File ownership and interfaces

| File | Responsibility |
| --- | --- |
| `src/collage-core.js` | Output dimensions, frame/cut geometry, crop and sole artwork renderer |
| `src/collage-brand.js` (new) | Pure brand bounds and remapping of manually positioned frames |
| `src/collage-media.js` (new) | Sparse stable-ID asset store, logo validation and history-reference cleanup |
| `src/collage-app.js` | UI events, direct pointer/keyboard gestures, state/history and file transactions |
| `src/editor.html.template`, `src/editor.css` | Simplified controls and accessible on-canvas handle layer |
| `scripts/build.cjs` | Inline modules in dependency order, generated demo assets only |
| `tests/helpers/editor-harness.cjs` (new) | Shared jsdom/native Canvas harness, generated upload fixtures, downloads and pointer dispatch |
| `tests/branding.cjs`, `tests/media.cjs`, `tests/direct-edit.cjs` (new) | Pure geometry, lifetime/validation and shipped-editor interactions |
| Existing test files | Preserve applicable coverage; replace obsolete mode/shape assertions with absence assertions and direct editing checks |

State shape shared by all tasks (image data never stored in history):

```js
state.brand = {
  placement: 'none',
  square: null,       // or {id: number, width: number, height: number}
  wordmark: null,     // or {id: number, width: number, height: number}
  squareSize: .12,
  wordmarkSize: .24,
  padding: 24
};
```

The store's `images` array is indexed by stable numeric ID. Existing `state.slots[i].photo` stays numeric. Released entries become empty slots, never shift other IDs. The four generated demos remain pinned so Reset always works; all user uploads are reference-pruned.

## Task 1: Portrait dimensions without interaction changes

**Files:** Modify `src/collage-core.js`, `src/collage-app.js`, `src/editor.html.template`, `tests/reference.cjs`, `tests/editor.cjs`, `tests/dom.cjs`.

**Consumes:** Existing `CollageCore.defaults()`, `size(state)`, `frameBoxes(state)`, ratio change listener and JPEG download harness.
**Produces:** `size(state)` returns `{w:1080,h:1080|1440}`; only `1:1` and `3:4` are selectable.

- [ ] Add failing assertions to `tests/reference.cjs`; update DOM expected ratio values and downloaded portrait dimensions, not just test labels.

```js
const portrait = {...C.defaults(), ratio:'3:4'};
assert.deepEqual(C.size(portrait), {w:1080,h:1440});
for (const box of C.frameBoxes(portrait)) {
  assert(box.x >= 0 && box.y >= 0);
  assert(box.x + box.w <= 1080.001 && box.y + box.h <= 1440.001);
}
```

- [ ] Run `node tests/reference.cjs` and confirm a dimensions assertion fails before editing production code.
- [ ] Replace dimension calculation and ratio whitelist/options. Initial preview remains square; ratio changes scale manual frames by old/new available bounds (full canvas until Task 2).

```js
const size = state => ({w:1080, h:state.ratio === '3:4' ? 1440 : 1080});
// In ratio listener:
if (!['1:1','3:4'].includes(e.target.value)) return;
```

- [ ] Update native test geometry to derive display rectangle from canvas width/height instead of hard-coded 675 height; rename generated portrait artifact to `slanted-example-3x4.jpg`. Validate actual JPEG metadata with sharp and undo back to square.
- [ ] Run `npm run build && npm test`; all existing behavior still passes except intentionally replaced ratio assertions, which must now pass.
- [ ] Commit explicit changed files: `feat: support square and portrait social output`.

## Task 2: Artwork branding geometry and renderer

**Files:** Create `src/collage-brand.js`, `tests/branding.cjs`; modify `src/collage-core.js`, `scripts/build.cjs`, `scripts/test.cjs`, `src/editor.html.template`, existing test module-loading setup.

**Consumes:** `size(state)`; metadata in `state.brand`; decoded logo in `images[asset.id]`.
**Produces:** Global `CollageBrand.measure(size, brand) -> {photoArea, band, logo}` and `CollageBrand.remapFrames(state, beforeArea, afterArea)`. Area/rect fields are `{x,y,w,h}`; `band`/`logo` may be null; logo adds `assetId`. Pure functions do not read images or DOM.

- [ ] Write failing tests using square 100×100 and wordmark 400×100 metadata. For 1080×1440 top placement at .24 width and 24 padding, assert logo width 259.2, height 64.8 and band height 112.8; photoArea is `{x:0,y:112.8,w:1080,h:1327.2}`. Use tolerance `1e-6` for floating-point values.

```js
const b={placement:'top',square:null,wordmark:{id:4,width:400,height:100},squareSize:.12,wordmarkSize:.24,padding:24};
const m=B.measure({w:1080,h:1440},b);
assert(Math.abs(m.logo.w-259.2)<1e-6);
assert(Math.abs(m.logo.h-64.8)<1e-6);
assert(Math.abs(m.photoArea.y-112.8)<1e-6);
assert.equal(m.logo.assetId,4);
assert.throws(()=>B.measure({w:1080,h:1440},{...b,wordmark:null}),/標誌/);
```

- [ ] Run `node tests/branding.cjs`; confirm missing module/function failure, then implement the geometry with the following calculation. Export through a global IIFE, following `collage-core.js`.

```js
function measure({w,h},b) {
  const full={x:0,y:0,w,h};
  if(!b || b.placement==='none') return {photoArea:full,band:null,logo:null};
  const corner=b.placement==='corner';
  if(!['corner','top','bottom'].includes(b.placement)) throw Error('未知標誌排版');
  const a=corner?b.square:b.wordmark;
  if(!a || !Number.isFinite(a.width) || !Number.isFinite(a.height) || a.width<=0 || a.height<=0) throw Error('請先上載有效標誌');
  const p=Math.min(64,Math.max(12,b.padding));
  const fraction=corner?Math.min(.24,Math.max(.06,b.squareSize)):Math.min(.40,Math.max(.12,b.wordmarkSize));
  const maxH=corner?h-2*p:h*.2-2*p;
  const k=Math.min(w*fraction/a.width,(w-2*p)/a.width,maxH/a.height);
  const lw=a.width*k,lh=a.height*k;
  if(corner) return {photoArea:full,band:null,logo:{x:p,y:p,w:lw,h:lh,assetId:a.id}};
  const bh=lh+2*p,top=b.placement==='top';
  return {
    photoArea:{x:0,y:top?bh:0,w,h:h-bh},
    band:{x:0,y:top?0:h-bh,w,h:bh},
    logo:{x:(w-lw)/2,y:top?p:h-bh+p,w:lw,h:lh,assetId:a.id}
  };
}
function remapFrames(state,a,b) {
  for(const slot of state.slots) if(slot.frame) {
    const f=slot.frame;
    slot.frame={x:b.x+(f.x-a.x)*b.w/a.w,y:b.y+(f.y-a.y)*b.h/a.h,w:f.w*b.w/a.w,h:f.h*b.h/a.h};
  }
}
```

- [ ] Wire `boxes`, `cutBoxes`, `cutHandles` and manually positioned frame bounds to the same `photoArea`. Apply margins inside that area, not once against the whole canvas and again against the area. Remove the obsolete brand title/footer block and old brand defaults, replacing them with the shared state above; do not remove unrelated geometry helpers.
- [ ] In `C.draw`, render photos, fill `band` white, then draw `images[logo.assetId]` into the measured logo rectangle. Throw a useful error if active logo image is absent instead of silently omitting it. Existing export catch displays the error and restores export buttons.
- [ ] Add `__BRAND_JS__` replacement and script before `__CORE_JS__`. Build script requires brand module before core; direct Node tests and VM harness load it too. Preserve script-data discovery by ID, not assumptions about script index.
- [ ] Add exhaustive tests over both ratios × 29 layouts × four placements using generated colored logos; check photo area, cut endpoints, capped tall wordmark, aspect ratio, white bands and real logo pixels. Exercise top→bottom→none with a manual frame through `remapFrames`. All photo IDs and crop values remain unchanged.
- [ ] Run `node tests/branding.cjs` then `npm run build && npm test`; register the new suite and commit `feat: add shared artwork logo geometry and rendering`.

## Task 3: Safe local assets and logo controls

**Files:** Create `src/collage-media.js`, `tests/media.cjs`, `tests/helpers/editor-harness.cjs`; modify `src/collage-app.js`, `src/editor.html.template`, `scripts/build.cjs`, `scripts/test.cjs`, `tests/dom.cjs`, `tests/editor.cjs`.

**Consumes:** Brand state/measure/remap from Task 2; history and future arrays; current generated demos and photo upload flow.
**Produces:** `CollageMedia.create() -> store`; `store.add({name,src,image,pinned=false}) -> id`; `store.get(id) -> entry|undefined`; `store.images -> array`; `store.prune(states)`. `CollageMedia.validateLogo(file,image)` throws user-visible errors or returns `{width,height}`. No FileReader inside the store.

- [ ] Write failing media tests. Generated fake images with `width/height` suffice for pure validation; integration tests must decode actual PNG/JPEG bytes.

```js
const store=M.create();
const id=store.add({name:'logo.png',src:'data:image/png;base64,AA==',image:{width:200,height:50}});
const s=C.defaults();s.brand.wordmark={id,width:200,height:50};
store.prune([s]);assert(store.get(id));
store.prune([C.defaults()]);assert.equal(store.get(id),undefined);
assert.throws(()=>M.validateLogo({type:'image/svg+xml',size:10},{width:10,height:10}),/PNG/);
assert.throws(()=>M.validateLogo({type:'image/png',size:10*1024*1024+1},{width:10,height:10}),/10/);
assert.throws(()=>M.validateLogo({type:'image/png',size:20},{width:4097,height:10}),/4096/);
```

- [ ] Run `node tests/media.cjs` to see expected failure. Implement a sparse stable-ID store; never compact indices. Cleanup algorithm:

```js
const keep=new Set(entries.flatMap((e,i)=>e?.pinned?[i]:[]));
for(const s of states) {
  for(const slot of s.slots) keep.add(slot.photo);
  for(const key of ['square','wordmark']) if(s.brand[key]) keep.add(s.brand[key].id);
}
for(let i=0;i<entries.length;i++) if(entries[i]&&!keep.has(i)) {
  entries[i].image.close?.(); entries[i]=undefined; images[i]=undefined;
}
```

- [ ] Expose the store and validation through a global IIFE. Validate allowed MIME, positive finite dimensions, byte and dimension caps; rejected decoded objects are closed if supported. Pin exactly the four demo entries; on Reset restore their IDs. Replace photo/thumbnail array reads with store reads. Call `prune([state,...history,...future])` only after a completed state/history transaction, never mid-upload.
- [ ] Add two file inputs (`logo-square`, `logo-wordmark`), remove buttons, a placement radio group (`none`, `corner`, `top`, `bottom`), one context-sensitive size slider and padding slider. Missing corresponding assets disable placement choices but leave upload available. Logo upload alone does not silently enable a placement.
- [ ] Upload transaction: disable both logo inputs, logo removal/placement controls and export while decoding; snapshot state only immediately before successful commit, not before awaiting. On success add asset, measure old/new area, remap manual frames, record one undo state and redraw. On failure keep previous state and show error. Always re-enable controls in `finally`; clear input value so retrying same file works. Photo uploads use the same edit-busy guard to prevent interleaving asset transactions.
- [ ] On active-logo removal set placement to `none`, remap area and remember old asset via history. Slider pointer/input sequences group into one history entry. Keyboard changes commit through change/blur without leaving permanently open transactions. Pinning demos must not pin user images.
- [ ] Extract reusable shipped-HTML harness from `tests/dom.cjs`, preserving existing assertions; return `{window,document,surfaces,downloads,ready,close}`. Extend pointer capture mocks to HTMLElement for new handles. New helper `upload(id, files)` sets input.files to generated File objects and dispatches change; `settled()` waits until busy controls re-enable, with 5-second timeout that includes status text.
- [ ] Integration tests cover both uploads, switching all placements, failed decode, wrong type/oversize/oversized dimensions, replacement, active removal, undo/redo, and export disabled during pending decode. Run 70 replacements and expire history; assert unreachable assets are released but undo/future references survive. Use store tests for lifetime assertions rather than adding a production debug API.
- [ ] Run `node tests/media.cjs` and `npm run build && npm test`. Register media module before app in the standalone build and update VM harness globals. Commit `feat: upload and manage local artwork logos`.

## Task 4: Direct manipulation and simplified editor surface

**Files:** Modify `src/collage-app.js`, `src/editor.html.template`, `src/editor.css`, `tests/dom.cjs`, `tests/editor.cjs`, `tests/brand.cjs`, `scripts/test.cjs`; create `tests/direct-edit.cjs`.

**Consumes:** Core frame/crop/cut geometry; measured photoArea; existing history and media store; new shared DOM harness.
**Produces:** No mode state/dropdown. Explicit DOM handle actions `move`, `resize`, `cut-top`, `cut-bottom`, `cut-left`, `cut-right`; canvas interior action `crop`. Handles are keyboard-focusable native buttons with name/current value and pointer capture.

- [ ] Write a failing shipped-HTML absence test before removing controls:

```js
assert.equal(document.getElementById('edit-mode'),null);
for(const id of ['shape-rect','shape-diagonal','shape-circle','shape-triangle','shape-diamond','shape-hexagon','vertex','frame-x','frame-y','frame-w','frame-h']) {
  assert.equal(document.getElementById(id),null,id+' must be removed');
}
assert.equal(document.querySelectorAll('[data-action="move"]').length,1);
assert.equal(document.querySelectorAll('[data-action="resize"]').length,1);
```

- [ ] Run `npm run build && node tests/direct-edit.cjs`; confirm old-mode assertion fails. Remove obsolete event registration and selection-dependent vertex controls together with the markup so initialization never reads missing elements.
- [ ] Keep one gesture object `{pointerId,action,selected,start,stateBefore,box,cropGeometry,moved,target}`. Native handle pointerdown stops propagation; canvas pointerdown only finds the topmost hit photo and starts crop. Store pointer capture on actual initiating element. Pointerup commits once; pointercancel restores `stateBefore` and drops the uncommitted drag, with no fake undo entry. Unexpected lost capture also cancels. A second pointer never replaces the active one.
- [ ] Use the existing minimum movement threshold of two output pixels and only begin mutating preview state when it is exceeded. Defer history mutation until pointerup: push the captured `stateBefore` once and clear future only when the final state differs. Cancellation restores the captured state and leaves both history and future unchanged. Adapt the history helper to accept this captured prior state; do not record the already-mutated preview. Preview dragging uses the saved starting geometry, never accumulates error from the previous move. Clamp move/size to photoArea; minimum frame size is 80 output pixels or available area if smaller. Crop clamps 0–1. Core crop stays cover-fit.

```js
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const movedFrame={
  x:clamp(box.x+dx,area.x,area.x+area.w-box.w),
  y:clamp(box.y+dy,area.y,area.y+area.h-box.h),w:box.w,h:box.h
};
const resizedFrame={x:box.x,y:box.y,
  w:clamp(box.w+dx,Math.min(80,area.w),area.x+area.w-box.x),
  h:clamp(box.h+dy,Math.min(80,area.h),area.y+area.h-box.y)
};
```

- [ ] Show linked cuts only on `grid`/`cut-grid` when no slot has a manual frame. For untouched grid, endpoints start at .5. On first cut drag convert grid to cut-grid with all .5 endpoints before applying movement; photo order and crop stay unchanged. Update an endpoint relative to photoArea minus margins and clamp .15–.85. Moving/resizing one frame hides all shared cut controls; reapplying a layout deletes manual frames with a visible warning and undo support.
- [ ] Put move handle on selected frame's top edge and resize at bottom-right; place shared endpoints in an outside gutter connected by a thin line. Lay out 44px button rectangles without overlap: if an anchor collides with an earlier handle, move it outward in its gutter in 48px increments until disjoint. Reserve a 52px gutter around the canvas; on small viewports reduce displayed canvas size rather than overlapping buttons. If no collision-free on-canvas slot remains, place that handle in a labelled 44px control strip immediately below the canvas with its connector/label; never enlarge invisible hit areas over neighboring controls. Test the placement helper with 320px viewport and a minimum-size selected frame.
- [ ] Keyboard: photo thumbnail buttons select; arrows on canvas pan crop .01 (Shift .05); arrows on move/resize handles change 1 output pixel (Shift 10); cut handles change .01 (Shift .05) in applicable axis. Each key action creates an undo step only if state changes. Escape cancels active drag and clears active control; tab order follows visible layout. Supply accessible value text for buttons via description, not unsupported slider semantics.
- [ ] Redesign surface: top upload/ratio/download, large canvas, selected-photo compact strip with replace/zoom/center, layout thumbnails below, collapsible spacing/palette/brand sections. Retain photo reorder buttons, undo/redo, reset and unsaved-change warning. The primary photo upload button adds to selected slot as before; selected-photo replacement uses a single-file picker. Explain four-photo limit locally.
- [ ] Keep navy official header and decorative light-blue line. Remove superseded `.mode-row`, `.shapes`, `.numbers` styles; add 44px targets, visible focus, touch-safe spacing, reduced-motion behavior. Do not animate drag or layout switches. Update brand structural tests where controls have intentionally moved, keeping exact-logo/hash/contrast checks.
- [ ] Replace old shape/mode tests with direct pointer sequences. Test interior crop vs frame handle, resize, linked endpoint, detached frame controls, topmost overlapping photo, two pointers, outside drag, pointercancel, lost capture, Escape, key control and one-step undo/redo. Create an existing redo state before a cancelled drag and prove the redo entry survives cancellation. Compare picture pixels before/after hiding handle layer to ensure handles remain excluded.
- [ ] Run `npm run build && npm test`; commit `feat: simplify editor with direct on-canvas controls`.

## Task 5: Integration, regressions and handoff

**Files:** Modify `tests/distribution.cjs`, `tests/reference.cjs`, `tests/branding.cjs`, `tests/direct-edit.cjs`, `scripts/test.cjs`, `README.md`, `docs/STATUS.md`, `docs/ROADMAP.md`; update this plan's completed checkboxes with evidence.

**Consumes:** All preceding task interfaces and generated fixture assets.
**Produces:** Reproducible release candidate, explicit automated/manual status and one private dependent PR.

- [ ] Test complete generated-fixture flow: upload photos; upload square and wordmark; choose portrait; move frame; choose top band; undo/redo; choose slanted layout; drag divider; choose bottom; download; remove logo; download again. For each export compare JPEG dimensions and sampled expected band/logo pixels, allowing JPEG compression tolerance ≤12 per channel away from edges.

```js
const metadata=await sharp(download.bytes).metadata();
assert.equal(metadata.width,1080);
assert.equal(metadata.height,1440);
assert.equal(metadata.format,'jpeg');
assert.deepEqual([...document.querySelector('#ratio').options].map(o=>o.value),['1:1','3:4']);
assert.equal(document.querySelector('#edit-mode'),null);
```

- [ ] Run 29 layouts × both ratios × all brand placements and spacing extremes. Validate all frames remain positive, inside photoArea and renderer does not throw. Preserve geometric containment, palette pixels, photo reordering and deterministic distribution checks. Replace only assertions tied to removed shape features, not unrelated test coverage.
- [ ] Ensure build embeds brand/media modules exactly once and in order; no unresolved placeholders, private paths, remote requests or runtime assets. Keep exact official app-logo allowlist. Do not commit user-supplied logos or generated output; only generated fixture code belongs in tests.
- [ ] Execute complete checks from an isolated tracked checkout to avoid unknown duplicate files. At execution time read `superpowers:using-git-worktrees` before creating it. Prefer temporary directory created by `mktemp -d` outside the user's synchronized Documents folder; use `git worktree add --detach` on the candidate SHA. In that checkout run `npm ci --ignore-scripts`, `npm run check`, `git diff --check`. Record path/SHA/results; do not delete user checkout or clean unknown copies. This is local testing, not a browser-policy bypass.
- [ ] Update user docs with portrait dimensions, three logo placements, file limits, direct controls, undo/redo and no persistence. Mark browser layout/real-device tests as pending; no invented screenshots or success receipts. Preserve brand licensing/release gates.
- [ ] Obtain independent read-only code review under `superpowers:requesting-code-review` of the actual candidate range, fix important findings, rerun affected tests. Commit `test: verify simplified social editor end to end` with only explicit files. Verify full-suite pass on final candidate rather than a stale SHA.
- [ ] Read back PR #2 live status. If still open, create dependent PR against `codex/dotai-brand-interface`; if merged, fetch main and inspect ancestry before using main as base. Never merge it automatically. Push only this scoped private branch; verify repository visibility first.
- [ ] Read back remote head, diff scope and check results. Show Jimmy one acceptance action: upload his square logo, select corner placement and download the portrait image to compare with preview. Record any feedback as next bounded fix. Manual keyboard/mobile/Chrome/Safari acceptance remains explicit pending work until evidenced.

## Plan self-review and execution choice

- Spec sections 1–3: Tasks 1 and 4; sections 4–5: Tasks 2–3; section 6: Tasks 2–4; acceptance and release boundaries: Task 5.
- Every added global is loaded by the builder and both existing harnesses; sparse photo IDs remain compatible with `C.draw`.
- Branding history references keep replaced images alive; collecting orphaned assets never happens before state commit.
- Native tests cannot certify CSS layout, hit-area placement on an actual screen or system file/download dialogs.
- No implementation or merge occurred while writing this plan. Choose agent-by-agent execution with review gates or inline execution with checkpoints; both use the same approved scope and tests.
