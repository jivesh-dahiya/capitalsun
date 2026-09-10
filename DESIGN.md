---
name: Capitalsun
description: Job-management CRM for Australian solar installers — real compliance math, real equipment data, photography-led public landing page.
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
typography:
  display:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.1rem, 4vw, 3.15rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.15rem–1.9rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.9rem–1.08rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.65rem–0.82rem"
    fontWeight: 600
    letterSpacing: "0.04em–0.06em"
  numeral:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.72rem–2rem"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  section-y: "24px–80px"
  section-x: "28px"
  gap-lg: "56px"
  gap-md: "16px"
  gap-sm: "8px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: "13px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "22px 28px"
---

# Design System: Capitalsun

## Overview

**Creative North Star: "The Real Jobsite"**

Capitalsun's public landing page proves the product by showing the actual work it manages — a real Australian rooftop install, mid-job — rather than a UI screenshot, a dark SaaS gradient band, or a stock-photo model smiling at a laptop. The authenticated app stays a compliance-grade working tool with no photography at all (data, forms, and the real pipeline are the entire UI); the public landing surface is a Persuade surface and earns page-scale photography accordingly. Both inherit the same token set (`--primary`, `--bg`, `--panel`, `--text`, `--line`) — one brand, two registers for two different jobs (operate vs. persuade).

Every photograph on the landing page is AI-generated but photorealistic and specific to the actual mechanism being sold (a rooftop mid-install, an inverter being wired, a satellite-style overhead panel array) — never generic stock-photo people-at-laptops filler, and never presented as a specific customer's real jobsite. The pairing of IBM Plex Sans for all display/body text with IBM Plex Mono reserved strictly for computed or structured numerals still carries the system's credibility signal: the typeface tells the reader which numbers are real math versus which text is persuasive copy. Real Australian compliance-scheme acronyms (CEC, STC, CER) appear as small factual chips — true statements, never invented usage stats or customer counts.

**Key Characteristics:**
- Inherited, not forked: one token set spans the authenticated app and the public landing page; the landing page adds photography and a floating utility-bar pattern the app itself never uses.
- Orange is used at page scale on this surface (the hero utility bar's CTA, capability-card tags, closing CTA band), a deliberate departure from the accent-only role it plays inside the authenticated app's UI chrome.
- IBM Plex Mono is a semantic signal, not a decorative monospace — it appears only on numerals and structured/tabular data (the hero calculator's live STC figure, form-mock values).
- Flat, bordered surfaces with soft single-layer shadows; no glassmorphism, no violet/blue AI-gradient aesthetic (explicitly rejected per PRODUCT.md). Photography is real-world and specific, never a generic gradient or icon-tile substitute for content.

## Colors

The palette is a light neutral-gray working surface built around one committed burnt-orange accent. The landing page's dark register now lives only in the hero photo's top/bottom scrim gradient (for nav and copy legibility over photography), not as a flat near-black band — the earlier "one dark band" hero is retired in favor of photography carrying that opening weight instead.

### Primary
- **Burnt Orange** (`#c2560c` light / `#e0791f` dark): the brand accent — the hero utility bar's CTA fill, capability-card tag chips, the closing section's CTA button, and every real computed dollar/STC figure's accent color. Not decorative; every use ties to either the primary action or a real number.
- **Orange Strong** (`#a5480a` light / `#f2892c` dark): hover/pressed state for orange fills, and the color of the live-computed calculator figures.
- **Orange Tint** (`#fdf1e8` light / `rgba(224, 121, 31, 0.14)` dark): low-emphasis orange backgrounds — the sign-in hover chip, capability-card tag backgrounds, and the closing team section's full-bleed background wash.

### Neutral
- **Page Gray** (`#eef0f3`): the default page background outside the hero photo.
- **Panel White** (`#ffffff`): card and tool surfaces (the hero utility bar, capability cards).
- **Line** (`#e1e4e9`) / **Line Strong** (`#cbd0d9`): hairline dividers, default borders, and the utility bar's internal field separators.
- **Ink** (`#171a20`): primary text on light surfaces.
- **Ink Soft** (`#454b56`): body copy on light surfaces.
- **Muted** (`#6b7280`): captions, labels, and secondary metadata.

### Hero Photography (surface-local, not a token role elsewhere)
- The hero is a full-bleed AI-generated photograph (a golden-hour Australian suburban rooftop mid-solar-install), not a flat color band. A layered dark scrim (`rgba(9,11,15,.6)` at the top fading to near-transparent through the middle, returning to `rgba(9,11,15,.72)` at the bottom) keeps the overlaid nav and headline legible while leaving the photo's midsection clear — never a single flat-opacity overlay, which would either wash out the photo or fail contrast at the edges.
- White text/controls over the photo (nav, H1, subhead) are the one place the system uses white-on-photo instead of the light-ground ink tokens; this treatment is scoped to the hero photo only and does not recur as a section-alternation device.

### Named Rules
**The Inherited Token Rule.** New surfaces reuse the authenticated app's `--primary`/`--bg`/`--panel`/`--text`/`--line` custom properties rather than defining a parallel marketing palette. A landing/marketing surface may raise the primary's page-scale weight and add photography; it may not introduce a new accent hue.

**The Specific-Photography Rule.** Every landing-page photograph depicts the exact mechanism it sits beside (a rooftop install for the hero, an inverter being wired for "compliance," a satellite-style overhead roof for "satellite roof design") — never a generic office-worker-at-laptop stock substitute. Photography is AI-generated, not sourced customer/site photography, and never captioned or claimed as a specific real customer's job.

## Typography

**Display/Body Font:** IBM Plex Sans (with `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` fallback)
**Numeral Font:** IBM Plex Mono (with `ui-monospace, monospace` fallback)

**Character:** A technical, engineering-adjacent grotesk carrying all display and body text, paired with a monospace reserved exclusively for real computed or structured values. The pairing signals credibility through restraint rather than through decoration — this is a product that shows its math, even on a photography-led page.

### Hierarchy
- **Display** (700, `clamp(2.3rem, 4vw, 3.6rem)` desktop / `1.95rem` fixed size, `21ch` measure below the `860px` breakpoint, line-height 1.08, letter-spacing -0.03em): the hero H1 only, set in white over the hero photo's scrim. Desktop and mobile are tuned as two separate values, not one shared clamp, so the real headline copy breaks into 3 balanced lines at each width rather than inheriting a cap tuned for a wider column.
- **Headline** (700, 1.15rem–2.6rem, line-height 1.1, letter-spacing -0.02em): section H2/H3s — the mission statement (largest), capability-card titles and gallery copy (smallest step in this range).
- **Body** (400, 0.9rem–1.08rem, line-height 1.6, color `--text-soft`): all paragraph copy; capped at 36–46ch measure per section.
- **Label** (600, 0.65rem–0.82rem, letter-spacing 0.04–0.06em, uppercase or chip-cased, color `--muted`): utility-bar field captions, badge/scheme chips, eyebrows, card-tag pills.
- **Numeral** (IBM Plex Mono, 500–600, 0.72rem–2rem): the hero utility bar's live STC count and dollar estimate, and every value cell in structured mockups.

### Named Rules
**The Real-Number Mono Rule.** IBM Plex Mono is applied only to values that are computed or pulled from structured data — never to marketing copy, headlines, or labels for decorative effect.

## Layout

Single-column, centered content model: a `1200px` max-width container with `28px` horizontal padding (`20px` on mobile, ≤860px breakpoint). The hero photo is full-bleed (no max-width); the utility bar beneath it is inset to `1080px` and floats, pulled up over the photo's bottom edge by a negative top margin, so it reads as a card straddling the photo rather than a section boundary. Below the hero, sections alternate between a two-column grid (copy/gallery, mission statement centered) and a card grid (three capability cards). Section vertical rhythm ranges `24px`–`80px` padding top/bottom depending on how tightly two sections relate, with `56px` gutters between grid columns.

At the ≤860px breakpoint, every two-column grid collapses to a single `minmax(0, 1fr)` column. The hero utility bar stacks its fields vertically with bottom-border dividers in place of right-border dividers, and its CTA becomes a full-width bottom bar. The staggered photo gallery collapses from a 2-column asymmetric grid to one large top photo plus two square photos side by side beneath it.

## Elevation & Depth

Flat by default: bordered panels on a neutral ground, not stacked cards competing for depth. A single soft ambient shadow (`--shadow-card`: `0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)`) sits under white panels (capability cards, gallery photos) to lift them a hair off the page background. The hero utility bar gets a stronger floating shadow (`0 22px 48px rgba(10,12,16,.22)`) appropriate to a card visually detached from and overlapping the photo above it — still diffuse and never hard-edged.

### Named Rules
**The Ambient-Only Rule.** Shadows on this surface are always soft and multi-directional (blur radius ≥ offset), never a hard single-offset "sticker" shadow.

## Shapes

Small, consistent corner radii throughout: `6px` for buttons and small controls; `8px` for the logo mark; `12px` for larger content panels (hero utility bar, capability cards, gallery photos); `999px` for pill-shaped badge and tag chips. Borders are consistently `1px` and hairline-weight (`--line` / `--line-strong`); no heavy strokes, no double borders.

## Components

### Buttons
- **Shape:** `6px` radius (`--radius-sm`), `13px 24px` padding for standalone CTAs; the hero utility bar's CTA fills its own card segment edge-to-edge instead (radius inherited from the card's clipped corner).
- **Primary:** solid orange fill (`--primary`/`--on-primary`), used for the single primary action per section ("Start free", "Start your workspace").
- **Hover:** fill shifts to the strong orange step; standalone CTAs add a `1px` upward translate.

### Cards / Containers
- **Corner Style:** `12px` (hero utility bar, capability cards, gallery photos).
- **Background:** white panel on the light ground throughout — no dark-panel variant remains on this surface.
- **Shadow Strategy:** ambient card shadow per Elevation & Depth, except the hero utility bar's stronger floating shadow.
- **Internal Padding:** `22px–26px` for capability-card bodies, `16px–22px` for utility-bar field segments.

### Inputs / Fields
- **Style (page body):** inherited from the app's form controls — bordered, `--panel` background.
- **Style (hero utility bar only):** a scoped exception — borderless, background-less fields inside the bar's own white card, separated by hairline dividers instead of individual input borders, so the bar reads as one continuous instrument rather than a row of separate form fields. This exception is local to `.landing-hero-bar`; every other input on the page keeps the app's default field chrome.

### Navigation
- Minimal top bar: logo mark (`32px`, `8px` radius) plus wordmark left, single bordered "Sign in" link-button right. No nav menu, no sticky behavior.
- Two instances of the same markup, two treatments: the hero instance overlays transparently on the photo (white text/border, full-width flex row); the footer instance sits inline on the light ground with default dark text.

### Hero Utility Bar (signature component)
The hero's proof device and primary action, replacing the earlier dark-band pipeline strip: the real STC calculator (System size / State / Install year / live STC + dollar result) restyled as a floating white card straddling the hero photo's bottom edge, ending in a solid-orange "Start free" CTA that fills its own segment. Functionally identical to the calculator tool that used to sit in its own section further down the page — repositioned as the page's primary above-the-fold action instead of a secondary proof point. Field values compute live via the same `calculateStcCount` logic as the authenticated app's real quoting flow.

### Staggered Photo Gallery
A three-photo cluster (one tall/wide primary photo spanning two grid rows, two smaller photos stacked beside it) paired with the "not a generic CRM" proof copy. Each photo carries a small caption chip (e.g. "Rooftop install", "Inverter wiring") describing what it shows — a data-honesty label, not a place name or customer claim, following the same disclosure spirit the retired pipeline strip's "Example jobs" caption used.

### Capability Photo Card
Replaces the earlier expand-to-reveal accordion index. Each of the three real capabilities (`/01 Satellite roof design`, `/02 Compliance paperwork`, `/03 Lead intake`) is a static card: a photo with a small ordinal chip overlaid top-left, then a title, real descriptive copy, and 1–2 tag pills naming the actual mechanism (e.g. "CEC-approved catalog", "STC Assignment Form") rather than invented usage metadata. No interaction is required to see any capability's content — everything is visible without a click, trading the earlier accordion's progressive disclosure for photography-led scannability.

## Do's and Don'ts

### Do:
- **Do** reuse the app's existing `--primary`/`--bg`/`--panel`/`--text`/`--line` tokens on any new public-facing surface rather than defining a parallel palette.
- **Do** render every real, computed, or structured numeral in IBM Plex Mono; keep IBM Plex Sans for all narrative copy.
- **Do** make landing-page photography specific to the real mechanism beside it (per the Specific-Photography Rule), never generic stock-photo filler.
- **Do** keep shadows soft and ambient (`--shadow-card` family); keep radii small and consistent (`6px`/`8px`/`12px`/`999px` pill).
- **Do** cap paragraph measure (36–46ch) and headline measure (14–16ch) per the established pattern.

### Don't:
- **Don't** invent customer logos, testimonials, review quotes, usage counts, or pricing tiers — none exist yet, and PRODUCT.md forbids fabricating them. Factual chips (CEC/STC/CER scheme names) are fine; invented statistics are not.
- **Don't** introduce a violet/blue gradient "AI SaaS" aesthetic; the brand has explicitly rejected that look.
- **Don't** caption or present AI-generated landing-page photography as a specific real customer's jobsite.
- **Don't** apply IBM Plex Mono to decorative or non-computed text; its use is a semantic signal, not a stylistic flourish.
- **Don't** use hard-offset "sticker" shadows or heavy borders; depth stays ambient and hairline throughout.
