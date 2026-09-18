# Product handoff — 2026-09-19

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
