# Sources and release gate

## Origin

The application grew from Jimmy Lau's local event-photo collage prototype, implemented with AI coding assistance. Only selected text source and test files were migrated into this new repository; the original project history was not imported.

The 29 layout structures were implemented as geometric coordinates with guidance from user-supplied collage reference screenshots. The screenshots, another application's name/logo/UI assets and paid template assets are not included. The visual provenance still needs owner review before public release; this note is not a legal clearance.

## Assets

- `scripts/build.cjs` generates four geometric, numbered demo images. It reads no local photograph directories and downloads no images.
- Built demo images and outputs are ignored. No real person's photograph is included in the source history.
- User-selected images are processed in browser memory; the user remains responsible for their publication rights.
- `assets/brand/dotai-icon.png` is a proportional 256×256 derivative of official asset LOGO-007, the navy square `.ai` icon. Source/derivative SHA-256 and transformation are recorded in `assets/brand/manifest.json`; no source path or internal brand document is included.
- Owner Jimmy Lau approved public distribution of this derivative in this repository on 2026-09-20. Brand names/marks are not implicitly licensed by the MIT code licence; contributors must not treat them as reusable trademarks.
- The privacy scanner permits only this exact derivative's path and hash, checking both working tree and Git index. It does not allow arbitrary PNGs or personal photographs.

## Palette

The application shell adapts the official icon's navy `#00345C` and accent `#3298EF` to this product, following Jimmy's direction. The accent is decoration, not a small-text background. This is not a new company-wide brand standard.

Canvas backgrounds remain independent: IG accent `#0B63F6`, white `#FFFFFF`, soft web surface `#F5F8FF`, navy `#00345C`. The current canvas default remains unchanged. The logo is embedded in the HTML header only, not passed to the Canvas renderer or exported in JPEGs. Internal source documents are not distributed.

## Before public release

- [x] Owner approves the product name, scope and public GitHub visibility — 2026-09-20.
- [x] Owner chooses the MIT code licence and adds `LICENSE` — 2026-09-20.
- [x] Review layout/reference provenance and brand/trademark limits; no external screenshots or app assets are included. Brand marks remain separate from the code licence.
- [x] Inspect dependency audit for the shipped form — 0 production vulnerabilities reported on 2026-09-20; build/test dependencies remain development tools.
- [x] Scan all reachable Git history for credentials, private paths, photos and proprietary documents — no pattern matches on 2026-09-20.
- [ ] Complete Chrome/Safari/mobile manual acceptance and document known issues. This is still required for UX confidence, not a blocker to publishing source with the known limits disclosed.
- [ ] Approve a tagged release and any public demo separately; never deploy as a side effect of CI.
