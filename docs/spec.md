# Collage Studio foundation

Owner: Jimmy Lau. Implementation and verification: Codex.

## Goal

Turn the existing offline collage prototype into a standalone, reproducible project, then open its first private GitHub PR. This is preparation for a later open-source release, not permission to make the repository public.

## Scope

- Preserve 29 four-image layouts, 1:1 (1080×1080) and 4:3 (1440×1080) output.
- Preserve crop, frame move/resize, shared slanted boundaries, editable polygon masks, palette, undo/redo and JPEG export.
- Keep DotAI blue default plus white, soft blue and navy choices. No logo asset required.
- Bundle only generated, non-photographic demo images. Users replace them locally through the existing file picker.
- No private event photos, reference screenshots, absolute local paths, credentials or built personal HTML in Git history.
- No browser runtime dependencies, analytics, upload endpoint or network calls.
- One locked npm installation; deterministic build; local test suite; CI on PRs; docs and contribution workflow.
- Keep source prototype untouched. New repository has its own Git history.
- Private GitHub repository: jimmylau-DOTAI/dotai-collage-studio. Base: main. Feature: codex/open-source-foundation. Open PR; do not merge, deploy or change visibility.

## Release limits

No open-source licence chosen yet. Do not publish a release until Jimmy chooses a licence and approves code/asset provenance and public visibility. Real Chrome/Safari/mobile interactions remain a separate manual acceptance gate; native Canvas/jsdom tests do not establish browser validation.

## Sources and methods

Existing collage prototype source and local tests; Jimmy's current GitHub/PR instructions. Planning: writing-plans; implementation inline because this migration's build/test paths are tightly coupled; verification-before-completion; finishing-a-development-branch for PR handoff. Source copying uses an explicit text-file allowlist, never the prototype's directory or Git history wholesale.
