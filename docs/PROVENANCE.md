# Sources and release gate

## Origin

The application grew from Jimmy Lau's local event-photo collage prototype, implemented with AI coding assistance. Only selected text source and test files were migrated into this new repository; the original project history was not imported.

The 29 layout structures were implemented as geometric coordinates with guidance from user-supplied collage reference screenshots. The screenshots, another application's name/logo/UI assets and paid template assets are not included. The visual provenance still needs owner review before public release; this note is not a legal clearance.

## Assets

- `scripts/build.cjs` generates four geometric, numbered demo images. It reads no local photograph directories and downloads no images.
- Built demo images and outputs are ignored. No real person's photograph is included in the source history.
- User-selected images are processed in browser memory; the user remains responsible for their publication rights.
- No DotAI logo file is included. Brand names/marks are not implicitly licensed by a future code licence.

## Palette

The private prototype's verified palette is preserved: IG accent `#0B63F6`, white `#FFFFFF`, soft web surface `#F5F8FF`, navy icon background `#00345C`; UI action color `#0059FF`. Soft blue/navy are adapted here as background options, not a new company-wide brand standard. Internal source documents are not distributed.

## Before public release

- [ ] Owner approves the product name, scope and public GitHub visibility.
- [ ] Owner chooses a code licence and adds a real `LICENSE` file; package metadata currently remains `UNLICENSED`.
- [ ] Review layout/reference provenance and any brand/trademark limits.
- [ ] Inspect dependency licences and required notices for the shipped form (the HTML has no bundled runtime libraries; build/test dependencies remain development tools).
- [ ] Scan all Git history, not just the current tree, for credentials, private paths, photos and proprietary documents.
- [ ] Complete Chrome/Safari/mobile manual acceptance and document known issues.
- [ ] Approve a tagged release and any public demo separately; never deploy as a side effect of CI.
