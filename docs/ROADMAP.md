# Small-PR roadmap

Owner: Jimmy Lau. This document records proposed stages, not a background automation.

## PR 1 — Foundation (this branch)

Standalone source, generated examples, locked installation, tests, CI and contributor/release documentation. Keep repo private; review before merge.

## PR 2 — Real-browser acceptance and interaction fixes

Use generated images only. On Chrome and Safari desktop, then a mobile/touch browser:

- [ ] Open built HTML: 4 images, 29 layout buttons, no console error.
- [ ] Replace 1–4 images using the real file picker; exercise invalid type and large-file error.
- [ ] Move/crop/resize with pointer capture, including dragging outside the canvas.
- [ ] Drag slanted endpoints and polygon vertices; test undo/redo.
- [ ] Change palette and both ratios, download JPEG; reopen it and verify dimensions/no handles.
- [ ] Check small screen layout, zoom, keyboard focus and range controls.
- [ ] Check offline operation and absence of network requests from editor code.

Treat any failure as a reproducible issue and regression test, not a blanket redesign.

## PR 3 — Save and reopen an editable project

Versioned local project file containing geometry/palette/images; validate imported schema, dimensions and data limits. Undo/redo must work after import. Explicit save/load; no cloud account needed. Separate privacy/size review before implementation.

## PR 4 — Maintainability and release readiness

Split crowded source responsibly, remove legacy unreachable branding/layout code with tests, improve accessibility and documentation. Choose licence and complete `PROVENANCE.md` gates before any public v0.1.0 release.
