---
version: 1
slug: "landing"
primary_target: "landing"
related_targets: []
---

## Scope

New route: public landing page at `/` for logged-out visitors (Persuade mode). Existing login form moves to `/login`. No auth/backend changes.

## Audience, job, proof, constraints

Audience: owner/office staff at an Australian solar install business, evaluating whether to move off spreadsheets/generic CRM/incumbent tools onto Capitalsun. Job: understand what it does and start a free workspace. Proof: real, working mechanisms already built — the government-compliance job pipeline stages, a live STC rebate calculation, the satellite-map design tool, real STC Assignment Form generation. No invented testimonials/logos/pricing (none exist yet).

## Direction contract

**THESIS**: The pipeline stage-strip IS the hero — not a generic dashboard screenshot or an abstract headline, but the real, specific, government-compliance job stages (Site Inspection → Submitted → Information Requested → Approved) rendered as the first thing seen, refusing the category-default "smiling person + vague headline + gradient blob" SaaS hero.

**OWN-WORLD**: Inherits the app's existing tokens (`--primary` burnt-orange `#c2560c`, `--bg`/`--panel`/`--text`/`--line`) but as a Persuade surface takes a Committed color strategy — orange carries real page-scale weight (full-bleed accent bands, bold CTA blocks), not just accent dots. Typeface: IBM Plex Sans for display/body (technical, engineering-adjacent character fitting a compliance/data-heavy product, not a generic SaaS default), IBM Plex Mono for every real number (STC counts, kWh, dollar figures) so the numerals themselves signal "this is computed, not decorative."

**STORY**: Visitor lands, immediately recognizes the real regulatory pipeline (not a toy CRM), scrolls into a live STC calculator that computes a real rebate figure as they type (proof this isn't vaporware), then sees the three other real mechanisms (map design tool, compliance paperwork, lead intake), then a direct CTA to start a free company workspace at `/?mode=signup`.

**FIRST VIEWPORT**: Full-width dark authority band top-to-bottom split: left ~55% headline + subhead + primary CTA ("Start free" → signup) + secondary ("Sign in" → /login) on the dark ground; right ~45% the pipeline stage-strip itself — real stage chips (Site Inspection, In Progress, Submitted, Information Requested, Approved, etc.) each holding one or two realistic example job cards, laid out as the actual kanban columns would render, tilted/staged for depth, orange accent picking out the active stage.

**FORM**: Own grounded structure ("pipeline-as-hero"), ranked #3 on my seven-candidate list (numbers-led calculator hero ranked #1, live-design-tool hero #2), dealt to lead by concept-seed (indices 3,7,6; seed key 088b3e4f) — built as the lead with the #1 candidate (interactive STC calculator) folded in as the proof section directly below the fold, and #7 (government-letterhead editorial authority) donating its typographic confidence to the compliance-paperwork section further down.

**FINISH**: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

None — no pricing/testimonials exist to include, so those sections are intentionally omitted rather than left as placeholders.
