---
name: Capitalsun
description: Job-management CRM for Australian solar installers — real compliance math, real equipment data, no invented shine.
colors:
  primary: "#c2560c"
  primary-dark: "#e0791f"
  primary-strong: "#a5480a"
  primary-strong-dark: "#f2892c"
  primary-tint: "#fdf1e8"
  primary-tint-dark: "rgba(224, 121, 31, 0.14)"
  bg: "#eef0f3"
  bg-dark: "#0c0e12"
  panel: "#ffffff"
  panel-alt: "#f6f7f9"
  panel-dark: "#14171d"
  panel-alt-dark: "#1a1e25"
  line: "#e1e4e9"
  line-strong: "#cbd0d9"
  text: "#171a20"
  text-soft: "#454b56"
  muted: "#6b7280"
  on-primary: "#ffffff"
  on-primary-dark: "#1a0e04"
  success: "#157a43"
  hero-band: "#0c0e12"
  hero-text: "#eceef1"
  hero-text-soft: "#b7bcc6"
typography:
  display:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.1rem, 4vw, 3.15rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.7rem–1.9rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.66rem–0.78rem"
    fontWeight: 600
    letterSpacing: "0.04em–0.06em"
  numeral:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.74rem–2rem"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  section-y: "72px–76px"
  section-x: "28px"
  gap-lg: "56px"
  gap-md: "16px"
  gap-sm: "8px"
components:
  button-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
    rounded: "{rounded.sm}"
    padding: "13px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong-dark}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.hero-text}"
    rounded: "{rounded.sm}"
    padding: "13px 24px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "26px 28px"
---

# Design System: Capitalsun

## Overview

**Creative North Star: "The Working Machine"**

Capitalsun's visual system is a compliance-grade job manager that happens to have a public face, not a SaaS marketing site wearing a product's name. The landing surface inherits the authenticated app's tokens wholesale (`--primary`, `--bg`, `--panel`, `--text`, `--line`) rather than forking a separate "marketing" palette, and extends them with page-scale weight: the burnt-orange primary carries a full-bleed dark hero band and bold CTA fills, not just accent dots on a white page. Nothing is invented to look busier than the product is — no stock photography, no fabricated logos or testimonials, no gradient blobs. Where the page shows data (pipeline cards, STC figures, form fields), it is either the real app's actual data shape or explicitly labeled as an example.

The pairing of IBM Plex Sans for all display and body text with IBM Plex Mono reserved strictly for computed or structured numerals is the system's signature move: the typeface itself tells the reader which numbers are real math versus which text is persuasive copy. This is a deliberate rejection of the generic SaaS default (a geometric sans paired with nothing) in favor of an engineering-adjacent character that fits a government-compliance product.

**Key Characteristics:**
- Inherited, not forked: one token set spans the authenticated app and the public landing page.
- Orange is used at page scale on this surface (full-bleed CTA sections, dark hero band), a deliberate departure from the accent-only role it plays inside the authenticated app's UI chrome.
- IBM Plex Mono is a semantic signal, not a decorative monospace — it appears only on numerals and structured/tabular data.
- Flat, bordered surfaces with soft single-layer shadows; no heavy elevation, no glassmorphism, no violet/blue AI-gradient aesthetic (explicitly rejected per PRODUCT.md).

## Colors

The palette is a light neutral-gray working surface built around one committed accent, with a single full-bleed near-black band as the system's one deliberate contrast break.

### Primary
- **Burnt Orange** (`#c2560c` light / `#e0791f` dark): the brand accent, used at page scale on this surface — the hero's primary CTA fill, the final-stage pipeline card border, the closing section's CTA button, and every real computed dollar/STC figure's accent color. Not decorative; every use ties to either the primary action or a real number.
- **Orange Strong** (`#a5480a` light / `#f2892c` dark): hover/pressed state for orange fills, and the color of the live-computed calculator figures.
- **Orange Tint** (`#fdf1e8` light / `rgba(224, 121, 31, 0.14)` dark): low-emphasis orange backgrounds — the sign-in hover chip and the closing team section's full-bleed background wash.

### Neutral
- **Page Gray** (`#eef0f3`): the default page background outside the hero band.
- **Panel White** (`#ffffff`): card and tool surfaces (calculator tool, feature visuals).
- **Panel Alt** (`#f6f7f9`): secondary/recessed surfaces (e.g. "them" chat bubbles).
- **Line** (`#e1e4e9`) / **Line Strong** (`#cbd0d9`): hairline dividers and default borders.
- **Ink** (`#171a20`): primary text on light surfaces.
- **Ink Soft** (`#454b56`): body copy on light surfaces.
- **Muted** (`#6b7280`): captions, labels, and secondary metadata.

### Hero Band (surface-local, not a token role elsewhere)
- **Near-Black** (`#0c0e12`) with **Off-White** (`#eceef1`) text and **Soft Gray** (`#b7bcc6`) subhead text: the one full-bleed dark band on the page, reserved for the hero. This exact combination does not recur elsewhere on the page — it is the one deliberate register break, not a recurring "dark mode section" pattern.
- The band is a radial vignette (`#1b1f27` → `#0c0e12` → `#050609`), not a flat fill, plus a single soft ambient glow — enough to give the band depth and a sense of scale without faking photography or product imagery. One glow source only; this is not a license to add multiple accent blooms. The glow is implemented as a `::before` on `.landing-pipeline-wrap` itself (`inset: -20% -16%`, expanding outward from that element's own box) rather than hand-positioned percentages of the hero — it structurally covers the full card grid (both rows, all columns) and stays correct if the pipeline's size or position ever changes, instead of floating as a generic corner blob that merely grazes part of the content.
- The page opens directly into this band: the nav overlays it transparently (`position: absolute`, no background fill, white-on-transparent brand mark and sign-in link) rather than sitting in its own light strip above it, so there is no corporate top bar before the one deliberate statement. The footer's identical-looking nav-brand markup stays on the light ground with dark text — the overlay treatment is scoped to the hero instance only.

### Named Rules
**The Inherited Token Rule.** New surfaces reuse the authenticated app's `--primary`/`--bg`/`--panel`/`--text`/`--line` custom properties rather than defining a parallel marketing palette. A landing/marketing surface may raise the primary's page-scale weight (full-bleed bands, bold fills); it may not introduce a new accent hue.

**The One Dark Band Rule.** The near-black hero background is a one-time register break used exactly once per page, for the single most important above-the-fold statement. It does not repeat as a section-alternation device (light/dark/light/dark banding is not this system's pattern — every section after the hero stays on the light neutral ground).

## Typography

**Display/Body Font:** IBM Plex Sans (with `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` fallback)
**Numeral Font:** IBM Plex Mono (with `ui-monospace, monospace` fallback)

**Character:** A technical, engineering-adjacent grotesk carrying all display and body text, paired with a monospace reserved exclusively for real computed or structured values (STC counts, dollar figures, pipeline job cards, form field values). The pairing signals credibility through restraint rather than through decoration — this is a product that shows its math.

### Hierarchy
- **Display** (700, `clamp(2.3rem, 4vw, 3.6rem)` desktop / `1.95rem` fixed size, `21ch` measure below the `860px` breakpoint, line-height 1.08, letter-spacing -0.03em): the hero H1 only. Raised from an earlier `2.1rem–3.15rem` step deliberately — at the smaller size the hero read as a standard SaaS card rather than the deliberate, editorial-weight statement the One Dark Band Rule exists to make. Desktop and mobile are tuned as two separate values, not one shared clamp: a single clamp's floor is what mobile actually renders at (the `vw` term is negligible on a narrow viewport), so fixing desktop's line-break balance by raising the clamp floor would silently also grow the mobile size and break its own balance. Both sizes are chosen so the real headline copy breaks into 3 balanced lines at that width, not a stray short line at the end.
- **Headline** (700, 1.7rem–1.9rem, line-height 1.1, letter-spacing -0.02em): section H2s (calculator, feature sections, closing CTA).
- **Body** (400, 1rem, line-height 1.6, color `--text-soft`): all paragraph copy; capped at 36–46ch measure per section.
- **Label** (600, 0.66rem–0.78rem, letter-spacing 0.04–0.06em, uppercase, color `--muted`): pipeline stage labels, result labels, form-mock field captions.
- **Numeral** (IBM Plex Mono, 500–600, 0.74rem–2rem): the calculator's live STC count and dollar value, every pipeline job card, and every value cell in the compliance-form mock.

### Named Rules
**The Real-Number Mono Rule.** IBM Plex Mono is applied only to values that are computed or pulled from structured data (STC counts, dollar figures, job/kW labels, form field values) — never to marketing copy, headlines, or labels for decorative effect. If a number on the page is invented or illustrative, it does not get the mono treatment.

## Layout

Single-column, centered content model: a `1200px` max-width container with `28px` horizontal padding (`20px` on mobile, ≤860px breakpoint). Sections alternate between a two-column grid (copy left/right, visual opposite — feature sections literally flip column order via `--reverse`) and a centered single-column block (calculator intro, closing CTA). Section vertical rhythm sits at `72px`–`76px` padding top/bottom, with `56px` gutters between grid columns.

At the ≤860px breakpoint, every two-column grid collapses to a single `minmax(0, 1fr)` column (not a bare `1fr`, which fails to shrink below the pipeline strip's content width and forces horizontal page scroll). The hero's pipeline strip becomes a horizontally scrollable, snap-aligned row with an edge fade mask and a "swipe for more" caption suffix — the one place the layout admits to scroll rather than reflowing to fit.

## Elevation & Depth

Flat by default: bordered panels on a neutral ground, not stacked cards competing for depth. A single soft ambient shadow (`--shadow-card`: `0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)`) sits under white panels (calculator tool, feature visuals) to lift them a hair off the page background — never a directional or hard-offset shadow. Pipeline job cards inside the dark hero band get a stronger ambient shadow (`0 4px 14px rgba(0,0,0,.28)`) appropriate to their darker ground, still diffuse and never hard-edged.

### Named Rules
**The Ambient-Only Rule.** Shadows on this surface are always soft and multi-directional (blur radius ≥ offset), never a hard single-offset "sticker" shadow. Depth comes from a 1px border plus a diffuse shadow, not from graphic outline devices.

## Shapes

Small, consistent corner radii throughout: `6px` for buttons, chips, and small controls; `8px` for the logo mark and pipeline cards; `12px` for larger content panels (calculator tool, feature visual frames). Chat bubbles use a larger `14px` radius with one corner pinched to `4px` toward the speaker, the one place the system borrows a conversational-bubble convention. Borders are consistently `1px` and hairline-weight (`--line` / `--line-strong`); no heavy strokes, no double borders.

## Components

### Buttons
- **Shape:** `6px` radius (`--radius-sm`), `13px 24px` padding.
- **Primary:** solid orange fill (`#e0791f` on the dark hero band, `--primary`/`--on-primary` elsewhere), dark or white text depending on ground for contrast; used for the single primary action per section ("Start free", "Start your workspace").
- **Hover:** fill shifts to the strong orange step plus a `1px` upward translate; no shadow growth.
- **Secondary/Ghost:** transparent fill, `1px` translucent white border on the dark hero band (`rgba(255,255,255,.22)`); border opacity increases on hover. Used exactly once per screen, paired with a primary button, never standalone.

### Cards / Containers
- **Corner Style:** `12px` (feature visuals, calculator tool) or `6px` (compliance-form mock).
- **Background:** white panel on the light ground; near-black panel with hairline white-alpha border inside the hero band.
- **Shadow Strategy:** ambient card shadow per Elevation & Depth; no hover lift on static content cards (only interactive buttons get the hover translate).
- **Internal Padding:** `26px 28px` for tool/calculator panels, `20px`–`28px` for feature-visual mockups.

### Inputs / Fields
- **Style:** inherited from the app's form controls — bordered, `--panel` background, default border-radius, no custom landing-specific input skin.
- **Focus:** inherited app-wide focus treatment (`2px solid var(--primary)` outline).

### Navigation
- Minimal top bar: logo mark (`32px`, `8px` radius) plus wordmark left, single bordered "Sign in" link-button right. No nav menu, no mega-menu, no sticky behavior — appropriate to a single-scroll landing page with one job (get to signup or sign-in).
- Two instances of the same markup, two treatments: the hero instance overlays transparently on the dark band (absolute position, white text/border); the footer instance sits inline on the light ground with default dark text. Not a general "transparent nav" pattern — only valid where a nav sits directly on the hero band.

### Pipeline Stage Card (signature component)
The hero's proof device: a column-per-stage kanban strip using the product's real stage vocabulary (Site Inspection → In progress → Submitted → Approved), each holding one or two example job cards in IBM Plex Mono. Columns carry a slight independent rotation and vertical offset (`--tilt`, `--lift`, roughly ±2deg / ±8px) with a staggered entrance animation, giving the strip a "cards laid on a desk" physicality rather than a flat screenshot crop. The final stage's cards get an orange-tinted border/background to mark completion. The strip is explicitly captioned "Example jobs" in a small uppercase label — a functional data-honesty disclosure (these are illustrative, not real customer jobs), not a decorative marketing eyebrow.

### Numbered Index Row
Replaces the earlier stacked icon+copy feature sections. Each capability (`/01 Satellite roof design`, `/02 Compliance paperwork`, `/03 Lead intake`) is a native `<details>/<summary>` row: an index ordinal, a Headline-weight title, and a "See more" affordance with a chevron that rotates 90° on expand (desktop shows the "See more" label; ≤860px collapses to the chevron alone). The first row is open by default so the section isn't fully gated behind interaction. Expanding a row reveals the same copy/visual pairing the old feature sections used, alternating grid order row-to-row exactly as the retired `.landing-feature--reverse` pattern did.

This idiom is adapted from a numbered-project-list pattern (real-estate portfolio reference, not a competitor product) the user supplied as inspiration: the numbered-row/expand-to-reveal structure is borrowed, but the reference's dark full-bleed background is deliberately not — this component stays on the light neutral ground per the One Dark Band Rule below. The ordinals (`/01`–`/03`) and the "/What's inside" header label are set in IBM Plex Sans at the Label scale, not IBM Plex Mono — they are decorative/structural index markers, not computed values, so the Real-Number Mono Rule excludes them.

Row titles (`.landing-index-title`, `clamp(1.3rem, 2.4vw, 1.7rem)`, 700 weight) introduce a new type step between Body and Headline — a deliberate choice: three consecutive rows set at full Headline scale (1.7–1.9rem) would read as three competing section headers stacked in one list rather than one list with three entries.

## Do's and Don'ts

### Do:
- **Do** reuse the app's existing `--primary`/`--bg`/`--panel`/`--text`/`--line` tokens on any new public-facing surface rather than defining a parallel palette.
- **Do** render every real, computed, or structured numeral in IBM Plex Mono; keep IBM Plex Sans for all narrative copy.
- **Do** label illustrative/example data explicitly in the UI (as the hero pipeline does with "Example jobs") rather than presenting invented data as real.
- **Do** keep shadows soft and ambient (`--shadow-card` family); keep radii small and consistent (`6px`/`8px`/`12px`).
- **Do** cap paragraph measure (36–46ch) and headline measure (14–16ch) per the established pattern.

### Don't:
- **Don't** invent customer logos, testimonials, review quotes, or pricing tiers — none exist yet, and PRODUCT.md forbids fabricating them.
- **Don't** introduce a violet/blue gradient "AI SaaS" aesthetic; the brand has explicitly rejected that look.
- **Don't** repeat the near-black hero band as a recurring section-alternation pattern; it is a one-time register break for the hero only.
- **Don't** apply IBM Plex Mono to decorative or non-computed text; its use is a semantic signal, not a stylistic flourish.
- **Don't** use hard-offset "sticker" shadows or heavy borders; depth stays ambient and hairline throughout.
