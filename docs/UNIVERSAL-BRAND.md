# Universal brand tools

Owner: Codex implementation; Jimmy acceptance. Scope approved 2026-09-20.

- Keep the DotAI application identity, but do not seed user artwork with DotAI logos or brand colors.
- Offer neutral/general colors and individually saved colors; full-width saved rows, secondary actions in a disclosure.
- A local library holds up to eight uploaded logos, one active per artwork. Preserve proportions and original colors. User labels each variant for light/dark backgrounds.
- Four corner anchors, true zero edge offset, top/bottom bands, no backing or a compact badge. Band/badge color follows artwork by default, with custom override. Transparent-bounds trimming is optional, non-destructive and excludes opaque white margins.
- Explicit Save My Brand persists user logos and settings on this browser only. Existing saved colors remain locally persisted separately. Restore on startup or by button; explicit forget removes only the saved kit. No cloud/knowledge-base connector.
- Existing photo geometry, swap, slant, output sizes and history remain intact. Every brand artwork change is undoable. Brand persistence itself is not artwork history.
- Verification: test geometry and pixels, actual file ingestion, multi-upload failure, undo, kit reload/failure, and existing suites. Browser/mobile visual acceptance remains separate.
- No PR, push or deployment. Current saved artwork is not a project file; refresh loses photo edits.

Design guidance: UI/UX Pro Max interaction checklist (progressive disclosure, clear labels, touch targets). Its search script is unavailable in this installation; no framework migration or new styling dependency is required.
