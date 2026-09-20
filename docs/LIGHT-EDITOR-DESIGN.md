# Light editor redesign

Owner: Jimmy Lau. Implementation: Codex. Local-only branch: `codex/light-editor-redesign`.

## Read and scope

A social-photo editor for daily posting, inspired by the two supplied light editor screenshots. White tools, cool gray-blue workspace and restrained blue selection. Native offline HTML/CSS retained, not a framework migration or an official third-party design-system implementation.

Taste skill: redesign audit and visual consistency only. Its landing-page/hero patterns are out of scope for a dense product editor. Supporting UI/UX rules cover touch targets, contextual controls and mobile panels. Dials: DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 5. Deliberately light-only per the supplied references.

## Audit and preservation

- Preserve official square DotAI asset and branded artwork export controls.
- Preserve photo/frame modes, crop, held swap, slant, undo, 1:1 and 4:5 output.
- Replace the heavy navy application header, small monochrome template diagrams and vertically stacked mobile controls.
- No public URLs, routes, analytics or publishing configuration changed. This is an offline editor, not an SEO website.
- No real photos in template previews. Uploaded photos stay local.

## Visual rules

- Workspace `#EEF2F8`, panel white, accent `#2563EB`, ink `#172B4D`, muted `#526079`, line `#DFE5EE`.
- Keep official brand navy/accent variables for identity, separate from UI selection and exported artwork.
- Buttons 8px radius; mobile panels 16px top corners; canvas remains rectangular.
- System sans-serif with Traditional Chinese fallbacks. No external font or runtime requests.
- Tabler outline icons embedded at build time; licence included in generated HTML. No runtime icon dependency.
- Orange retained only to distinguish frame manipulation from blue photo manipulation, with text and shape cues too.

## Layouts and mobile

- Desktop: 68px white header, 248px templates, flexible canvas, 288px properties. Narrow desktop uses reduced side widths.
- Templates use blue-gray geometry, real output aspect, names, category filtering and selected markers. Slanted template uses angled blocks. Empty category explains how to recover.
- Below 900px: canvas first, fixed bottom tool navigation, one nonmodal settings panel at a time. Active settings reduce canvas size; no fake phone screenshots.
- Mobile panels use safe-area padding, 44px controls, 16px inputs, independently scrollable settings and a visible Canvas action to close them.
- Not implemented: pinch gestures, save/reopen projects, hosted mobile access. Existing local HTML must still be opened in a script-capable browser.

## Validation boundary

Automated native Canvas/jsdom checks cover actual behavior, local output and template filtering. They do not prove responsive layout or touch handfeel. Pending: real 375/390px portrait, tablet, landscape, enlarged text, icon discoverability, mobile file pickers/download and desktop visual acceptance. No browser restriction was bypassed to obtain screenshots. Do not call this design fully accepted until these checks are completed.
