# Current local handoff — 2026-09-20

Owner: Jimmy Lau. Integration: Codex. Local branch: `codex/light-editor-redesign`.

## Current: light editor and mobile tools

- Applied user-supplied light references: white header/panels, gray-blue workspace and blue selection. Official DotAI logo and exported artwork colors are unchanged.
- Color-block template previews follow the selected output ratio, with category filters, selected marks and a visible empty-category explanation. No real photos are used in template previews.
- Below 900px, bottom navigation switches between Canvas, Layout, Photos and Brand. Settings live in a nonmodal bottom panel with safe-area offsets and 44px controls. Pinch gestures and project persistence are not added.
- Tabler icons are embedded at build time with their MIT notice. The shipped editor remains single-file and has no runtime network dependency.
- Verification: all 23 suites plus privacy and whitespace checks pass. Desktop visual acceptance and real-phone portrait/landscape, file picker/download, gesture and larger-text checks are still PENDING. No restriction workaround was used to claim visual QA.
- Design audit and scope: `docs/LIGHT-EDITOR-DESIGN.md`. Local only; no push, PR, deployment or changes to the original checkout. Download existing artwork before refreshing because unsaved editable work is not persisted.

## Previous: direct photo tools and flexible shared dividers

- Slant gesture repair: frame tools now separate Proportion (round shared controls) and Slant (diamond boundary endpoints). Diamond drags update the shared slant angle, not custom cell proportions; paired boundaries remain constrained by the existing renderer. Legacy sidebar sliders are hidden in favour of the contextual operation and straighten action. Integration checks cover pointer-driven angle change, crop after slant, and undo/redo. Browser handfeel remains pending.

- Outside-selection follow-up: canvas margins and stage whitespace switch the currently selected frame into frame mode; clicking photo interiors returns to crop. Side panels and controls are excluded, and active drags remain locked. Mode buttons and icon actions share a wrapping row immediately above the canvas. Automated outside/inside and DOM-order checks added; real-browser appearance remains pending.

- Mode toolbar revision: fixed Photo/Frame segmented controls stay labelled with separate pressed states. Context actions now use labelled icon buttons in a compact strip above, never inside, the artwork. Photo actions are zoom/centre; frame actions are restore proportions/make hero. Buttons and photo selection cannot change mode during an active pointer gesture. New behavioural coverage checks mode state, action visibility, gesture locking and frame reset; browser visual acceptance remains pending.

- Latest direct controls: blue photo-corner handles zoom the clipped image without changing frames; orange shared handles adjust layout. Clicking a frame edge enters frame mode; clicking the interior returns to crop mode. Selected-photo percentage and secondary actions float by the selection; other actions live under More. Below the canvas, frame mode and history remain. Automated corner zoom, fixed geometry, undo and edge/interior checks pass; actual browser placement/gesture acceptance is still PENDING.

- Latest interaction: clicking a photo enters crop-only mode and hides shared-frame handles. Explicit frame adjustment retains flexible layout editing. Removed the separate swap grip: stationary 450ms hold arms a swap, immediate motion locks into crop, release/cancel clears the timer. Thumbnail and Shift swaps remain. All 18 suites and privacy checks pass; real-browser gesture feel remains PENDING.

- Follow-up: double-click now selects rather than opens the replacement picker; explicit upload remains available. Command/Ctrl Z and Shift redo share button history, excluding text-editing targets. Selecting another template clears inherited slant and cut coordinates. Single-frame slant is not implemented: awaiting clarification whether the requested scope is one frame or one template. All 17 suites and privacy checks passed; real browser acceptance remains pending.

- Empty start with explicit optional demo. First real import replaces all demo slots, including via single-file replacement. Reset returns to empty; image-dependent controls/exports are disabled until photos exist.
- Contextual canvas toolbar exposes zoom, centre, draggable swap grip and make-hero. Wheel zoom selects the photo under the pointer and groups a burst into one undo. Panning stays separate from resizing and works through slanted clips (verified with real stripe pixels).
- Thumbnails can be dragged to another thumbnail or canvas frame. Swap grip and Shift-pointer drag allow canvas-target swapping. Photo crop/zoom travels with the photo; layout proportions stay put.
- Shared white corner controls resize connected frame boundaries. A normalized custom-cell layout preserves neighbours instead of overlapping them; the selected third photo can become the largest. Make-hero is a one-step 65% main-photo layout with the remaining photos stacked beside it. Re-selecting a layout clears custom proportions.
- Slant, logo band, ratios and undo operate on custom cells. A minimum normalized frame span protects against collapse when maximum gutters/margins and a logo are added later.
- Tests include actual empty-start/import behaviour, canvas zoom, slanted crop pixels, swap routing, largest-third resizing, redo, JPEG output and 2,560 flexible-corner combinations. Native Canvas/jsdom checks are not real-browser gesture acceptance; live drag/drop and touch remain PENDING.
- Verification: `npm run check` passed all 16 suites and privacy checks; `git diff --check` passed. The focused direct-flex suite also passed after adding an explicit Shift-pointer swap and undo assertion.
- Local-only changes; no push, PR or deployment. Refreshing loses unsaved photos/edits: export current artwork first.

## Previous: constrained frames, photo controls, universal slant

- Removed the confusing advanced free-frame handles, not merely hidden them. Every canvas drag crops inside the chosen frame; photo zoom cannot resize frames. Intentional picture-in-picture layouts are excluded from the visible catalogue.
- Added append picker and an independently labelled remove button per thumbnail (minimum one, maximum nine). Remaining photos retain IDs, crop offsets and zoom; add/remove are undoable and reflow the layout. Whole-set replacement is a separate expandable action.
- Catalogue counts for 1–9 photos: 1, 14, 17, 26, 17, 16, 17, 17, 15. Directional hero arrangements and proportions extend the previous four-template variable-count catalogue.
- Every 2–9 photo layout has visible slant controls, reset and grouped undo. Shared boundary knots are warped together to avoid overlaps/cracks at T junctions. Gutters are painted after all photos to prevent coloured antialias seams.
- Canva reference: https://www.canva.com/en_gb/help/using-frames-variantb/ — media resizes and moves inside its frame. We retain Jimmy's existing double-click-to-replace shortcut, rather than claiming identical Canva shortcuts.
- Verification: `npm run check` passed all 14 suites plus privacy checks, and `git diff --check` passed. Includes 1,112 geometry/ratio/extreme combinations and real preview/JPEG gutter pixels. Live browser/manual acceptance remains pending; no alternate route was used to bypass the earlier local-file browser restriction.
- Refreshing the same built page loads this update but discards unsaved artwork: export first. No push, PR or deployment is authorized for this iteration.

## Previous: multi-photo and fixed-frame crop update

- Requested from the screenshot: replace the fixed four-slot assumption, add double-click replacement, prevent accidental frame resize while cropping.
- A batch picker accepts 1–9 images and replaces the whole set in one undoable operation. Matching layouts are shown by count; four photos retain all 29 templates. Brand, ratio and background are retained.
- Any failed or over-limit batch leaves the artwork intact. Latest file selections win; outdated reads cannot overwrite a newer group. Defaults remain generated demos, never user photos.
- Double-click a thumbnail or canvas photo to choose its replacement. Normal dragging pans only the clipped image; frame handles are opt-in through 調整相框（進階）. 還原排版相框 clears manual positions without resetting image crops.
- Verification: `npm run check` passed all 12 suites and privacy checks; `git diff --check` passed. This is native Canvas/jsdom, not live browser acceptance. Tests cover the reproduced corner-resize bug, all photo counts, batch failure/races, double-click dispatch, actual panning pixels, and a batch replacing photos during an unfinished drag. Refreshing the built page loses current unsaved images/edits; export first.

## Previous integrated stage

- Current outputs: square 1080×1080 and portrait 1080×1350 (4:5), default white background, 29 visual layout choices.
- Photo replacement, zoom buttons, local logo previews/placements and saved custom colors are implemented. Browser/manual acceptance remains pending.
- User requested local-only work: no further push, PR update or merge.
- Delegated first pass completed: Luna A delivered photo upload targeting, thumbnail selection/cache and real-image regression checks; Luna E delivered `docs/ACCEPTANCE.md`. Codex reviewed both, strengthened upload completion/pixel assertions and integrated the new suite.
- B/C/D integration: shared drawn/hit handle positions, cancelled/no-op drag history, grouped zoom history, atomic logo changes with manual-frame remapping, placement-specific logo size ranges, and named custom palette management. White remains the default; the misleading IG-blue name is now 亮藍. Saved colors can be renamed/removed, with an eight-color limit and storage failure messages.
- Verification: all 11 suites, privacy checks and `git diff --check` passed. Coverage includes actual decoded thumbnails/uploads, logo upload/removal undo, all 29 layout geometries across both ratios and four brand placements, palette persistence failures, and real JPEG logo pixels at both output sizes. Manual acceptance remains pending.
- Remaining product work: full keyboard/touch accessibility, save/reopen artwork, and real browser/manual acceptance. These are not declared finished by passing automated checks.
- Existing thumbnail checks now decode actual JPEG bytes instead of returning a fake thumbnail URL. This verifies image data, not browser rendering.

## Historical handoff — 2026-09-19

The notes below record the earlier foundation/brand-interface stage, not the current feature or test status.

Owner: Jimmy Lau. Repository: `jimmylau-DOTAI/dotai-collage-studio` (private).
Current work: `codex/dotai-brand-interface`.

## Foundation

[PR #1](https://github.com/jimmylau-DOTAI/dotai-collage-studio/pull/1) was merged with owner approval. GitHub readback: merged at 2026-09-18 17:17:02 UTC (2026-09-19 Hong Kong), merge commit `ccf528cd5f794f9c9c2df14c4e22e983ffa4f7a4`. The five original suites passed immediately before merging.

## Brand interface — implemented, awaiting review

- Navy application shell, official square DotAI icon, white working panels and separate artwork-background controls.
- Extracted interface CSS; single-file offline build retained.
- No changes to core geometry or editor state/history logic. The 29 layouts, two ratios and four canvas palette options remain.
- The exact brand asset is allowlisted by path and SHA-256; personal photos, private paths and generated distributions remain excluded from Git.
- `npm run check`: all six suites pass, including icon bytes/dimensions, UI contracts, contrast, crop/frame/shape/history and exact JPEG dimensions. `git diff --check` passes.
- Current changes have not been merged into the main version; there has been no public release or deployment.

## Important limits

The automated harness is jsdom plus native Canvas, not Chrome/Safari layout or touch verification. Browser-tool local-file access was blocked during this work; no alternate browser/server route was used to bypass it. Manual visual acceptance remains pending. Do not describe the new interface as browser-tested.

No real person's photos are included. Initial photos are generated numbered demos. User photos are processed locally but project save/load is not implemented; unsaved edits disappear on close.

Inherited shape-mode selection and repeated-upload memory issues remain recorded in `ROADMAP.md`. Brand redistribution rights and code licensing must be resolved before going public.

## Jimmy's next action

Open the newly built `dist/index.html` in Chrome and check the navy header, official square icon and whether moving one photo then pressing Undo behaves as expected. The old personal prototype file is a different artifact and was not overwritten.
