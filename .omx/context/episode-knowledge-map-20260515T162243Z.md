---

authored_by: external
content_role: reference
trust_level: primary
authoring_mode: human
last_verified: 2026-05-17
---
# Episode Knowledge Map Deep Interview Context

Task statement: Clarify a proposed experiment for an episode-level knowledge map module, likely using EP147 as a trial case.

Desired outcome: Convert a linear spoken episode/transcript into a richer knowledge network that follows the speaker's argument while showing extensions, counterpoints, missing context, books, people, concepts, value judgments, and adjacent claims.

Stated solution: Add or prototype a "知识地图" module, possibly on the current website, but the user explicitly allows not putting it on the live page yet.

Probable intent hypothesis: The user wants the site to reveal the richer thinking space behind an episode, not just the small subset expressed linearly in speech.

Known facts/evidence:
- Existing site has episode JSON, generated site data, and a global graph view.
- Current build already links episodes to concepts, models, people, themes, and keywords.
- Existing graph is mostly a global entity relationship graph, not an episode-centered argument/extension map.
- External references reviewed at a high level: Obsidian-style local graphs, Kumu-style system maps, and question/path-guided knowledge exploration.

Constraints:
- User wants deep clarification before implementation.
- User asks for web research when unclear.
- Trial should likely be small and reversible.
- Output may be a prototype module or an artifact before live webpage integration.

Unknowns/open questions:
- Whether EP147 exists locally yet, and what transcript/source material will be used.
- What node taxonomy the user wants: claims, evidence, concepts, counterarguments, missing context, books, people, values, etc.
- Whether the map should be generated automatically, manually curated, or AI-drafted then human-reviewed.
- Whether the first prototype should be visual graph, structured reading page, or both.

Decision-boundary unknowns:
- Whether Codex may choose the visual format.
- Whether Codex may add files/routes to the site.
- Whether external viewpoints should be source-cited and browsed per node.
- Whether controversial counterpoints may be included without user approval.

Likely codebase touchpoints:
- `content/episodes/EPxxx.json`
- `src/app.js`
- `src/graph-view.js`
- `build.mjs`
- `docs/data/site.json`
- possible new `content/episode-maps/EPxxx.json`
- possible new route `#/episodes/EPxxx/map`
