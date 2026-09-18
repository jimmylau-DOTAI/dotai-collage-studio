# Open-source foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task, inline for this tightly coupled source/build/test migration.

**Goal:** A reproducible, sanitized editor foundation in a private GitHub PR.

**Architecture:** Keep the offline Canvas application and geometry core, separate source, scripts, tests and generated output. Generate four non-photographic examples during build, embed them in a standalone HTML file, and exercise that same output in integration tests.

**Tech Stack:** Vanilla HTML/JavaScript, Node.js ^22.22.2 || ^24.15.0 || >=26.0.0, npm lockfile, native Canvas, sharp, jsdom, GitHub Actions.

**Spec:** `docs/spec.md`

## Global Constraints

- Preserve 29 layouts, two ratios, existing editing features and DotAI palette.
- No personal photos, private paths, credentials, prototype Git history or generated personal HTML.
- Private GitHub repository only; no merge, deployment, public release or licence selection.

### Task 1: Reproducible editor

**Files:** `src/collage-core.js`, `src/collage-app.js`, `src/editor.html.template`, `scripts/build.cjs`, `package.json`, `package-lock.json`, `.gitignore`, `tests/*.cjs`.

**Interfaces:** Source template consumes `__PREVIEW_DATA__`, `__PHOTO_DATA__`, `__CORE_JS__`, `__APP_JS__`; build produces `dist/index.html`. Tests read this exact output and put generated evidence in ignored `artifacts/`.

- [x] Add build/privacy tests before implementation. Assert a missing build fails; later assert exactly four generated `demo-N.jpg` images, no unresolved placeholders, private paths or known personal image names, and deterministic HTML.
- [x] Copy only the reviewed source and test text files; rewrite imports and test output paths. Replace user/event-specific copy and download name; retain editor behavior.
- [x] Build demo images with `createCanvas`, drawing numbered coloured geometric scenes; encode JPEG, render a preview via `CollageCore.draw`, embed source and demo data.
- [x] Install exact tested dev dependencies and generate npm lockfile. Scripts: `npm run build`, `npm test`, `npm run check`.
- [x] Run `npm ci --ignore-scripts && npm run check`; test actual JPEG sizes and palette pixels as well as geometry and interaction events.
- [x] Commit: `git add src scripts tests package.json package-lock.json .gitignore docs && git commit -m "feat: package reproducible offline collage editor"`.

### Task 2: PR and release workflow

**Files:** `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/ROADMAP.md`, `docs/PROVENANCE.md`.

**Interfaces:** CI executes `npm ci --ignore-scripts` and `npm run check`; contributor instructions use the same commands. Private GitHub PR compares feature branch against main.

- [x] Document setup, feature limits, privacy, manual browser acceptance and licence decision gate. Add small follow-up milestones rather than promise ongoing background development.
- [x] Add read-only CI for push/PR and a PR checklist covering tests, original assets and output dimensions; no deployment job or secret injection.
- [x] Run full checks and inspect generated preview. Inspect staged filenames/content and `git diff --check`; commit: `chore: add review workflow and release roadmap`.
- [ ] Create approved private repo, push base and feature branch, open first PR, read back visibility/base/head/URL. Wait for CI outcome, fix in feature branch if needed, never auto-merge.

## Completion evidence

Record real local verification and remote PR/CI evidence in the final response; do not substitute a successful build for real-browser validation.
