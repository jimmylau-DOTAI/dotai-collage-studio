# Open-source release QA — 2026-09-20

## Scope

Release candidate: `main` at the commit created from `codex/large-logo-import`.
This review covers the public source tree, automated product behaviour and
repository metadata. It does not represent a hosted website launch.

## Passed

- `npm run check`: 28 test suites passed. It rebuilds the standalone editor,
  checks image/canvas behaviour and JPEG dimensions, then runs the privacy
  tripwire.
- `git diff --check`: passed before release commit.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities reported.
- Current source and all reachable commits were searched for private absolute
  paths and common credential patterns; no matches found.
- A read-only test imported the owner-provided 18,275×8,334 DotAI wordmark,
  normalized its local copy to 1,024×467, exported a 1,080×1,350 JPEG, tested
  delete/undo and confirmed the source checksum was unchanged. The original
  file and its path are not tracked.
- Build output, personal photos, test artifacts and environment files remain
  ignored. The only tracked raster asset is the owner-approved DotAI app icon.

## Known limits, deliberately disclosed

- This is an offline HTML editor, not a hosted service. It has no account,
  server, analytics, image upload endpoint, Meta publishing API or ad API.
- jsdom and native Canvas tests do not prove Chrome, Safari, mobile layout,
  touch gestures, native file picking or browser download prompts. The manual
  checklist in `docs/ACCEPTANCE.md` remains pending.
- Editable photo projects are not saved. Download a JPG before refresh/close;
  saving a brand kit does not save photographs or layouts.
- Large logo files are normalized after decoding. Very low-memory devices may
  still reject exceptionally large source images.

## Public-source boundary

The MIT licence covers source code. DotAI names, logos and other brand marks
are not granted as a trademark licence. Users remain responsible for the
rights to photos and logos they choose in the editor.
