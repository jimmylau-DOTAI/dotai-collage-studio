# Small-PR roadmap

Owner: Jimmy Lau. This document records proposed stages, not a background automation.

## PR 1 — Foundation (merged)

Standalone source, generated examples, locked installation, tests, CI and contributor/release documentation. Merged with owner approval on 2026-09-19 (Hong Kong). Repo stays private.

## Next PR — DotAI product shell (current branch)

Navy application shell, official square logo, independent artwork palette, responsive controls and interface-contract tests. See `brand-interface.md`. Browser visual/interaction acceptance is pending; the first two stages do not establish a finished product.

## Following PR — Real-browser acceptance and interaction fixes

Use generated images only. On Chrome and Safari desktop, then a mobile/touch browser:

- [ ] Open built HTML: 4 images, 29 layout buttons, no console error.
- [ ] Replace 1–4 images using the real file picker; exercise invalid type and large-file error.
- [ ] Move/crop/resize with pointer capture, including dragging outside the canvas.
- [ ] Drag slanted endpoints and polygon vertices; test undo/redo.
- [ ] Change palette and both ratios, download JPEG; reopen it and verify dimensions/no handles.
- [ ] Check small screen layout, zoom, keyboard focus and range controls.
- [ ] Check offline operation and absence of network requests from editor code.

Treat any failure as a reproducible issue and regression test, not a blanket redesign.

Independent foundation review identified two inherited cases to address in this stage:

- In custom-shape mode, switching to another photo without an initialized mask can leave the vertex controls empty. Reinitialize or clearly exit shape mode on selection; cover the sequence with a regression test.
- Replacing photos appends image data to in-memory arrays even after older undo states expire. Review reference-aware cleanup and decoded-image memory bounds; retain undo/redo correctness.

## Later — Save and reopen an editable project

Versioned local project file containing geometry/palette/images; validate imported schema, dimensions and data limits. Undo/redo must work after import. Explicit save/load; no cloud account needed. Separate privacy/size review before implementation.

## Later — Maintainability and release readiness

Split crowded source responsibly, remove legacy unreachable branding/layout code with tests, improve accessibility and documentation. Choose licence and complete `PROVENANCE.md` gates before any public v0.1.0 release.
