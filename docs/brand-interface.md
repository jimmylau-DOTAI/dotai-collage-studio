# Product shell — private review

Owner: Jimmy Lau. Scope: the editor's interface, not a marketing site or exported artwork.

## Problem and decision

The prototype used the IG accent as its apparent product identity and had no official logo. Use the official navy square mark in the application header. Keep the light editing surfaces, the existing four canvas-background choices and the current export defaults independent from the shell.

- Primary shell: navy `#00345C`; accent detail: `#3298EF`.
- White/light panels; dark text on light surfaces. Never put small white text on the light accent blue.
- No logo, heading or interface controls in the exported JPEG.
- Preserve 29 layouts, the two ratios, frame/shape controls, history and local-only operation.
- No framework migration or new runtime dependencies.

Design methods: verified DotAI brand rules for assets/scoped colors; `emil-design-eng` for immediate functional feedback, visible focus, touch-safe controls and reduced motion. Frequent canvas interactions stay unanimated.

## Acceptance

- [x] Official square logo is embedded in the header source, never redrawn; browser visual review remains pending below.
- [x] Navy application shell and separate artwork-background controls implemented.
- [x] No unresolved build placeholders or remote assets.
- [x] All existing tests pass, with added asset and interface-contract checks.
- [ ] Manual desktop/narrow-screen review: no overlap, readable labels, keyboard focus, upload and download.

Automated DOM/Canvas checks do not establish browser layout or touch usability. Manual review remains a release gate. Brand rights remain separate from any future open-source code licence.
