---

authored_by: external
content_role: reference
trust_level: primary
authoring_mode: human
last_verified: 2026-05-17
---
## Knowledge Page SOP Cleanup Plan

Goal: finish the provided concept/model/theme SOP by converging the detail-page renderer on one three-layer template without undoing in-progress work.

1. Lock the current concept-page template with smoke coverage.
2. Reuse the existing concept helpers where possible instead of branching per page type.
3. Promote the same overview / analysis / evidence structure to `model` and `theme` detail pages.
4. Prefer fallback reads from current fields (`description`, `context`, `episodes`, `episodeHighlights`) so the migration does not require bulk data edits.
5. Keep the diff reversible: touch `src/app.js`, `src/style.css`, `scripts/ui-smoke.mjs`, then rebuild generated `docs/*`.

Verification target:
- `npm run build`
- `npm run test:ui`
