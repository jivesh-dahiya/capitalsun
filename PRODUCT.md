# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solar installers and small-to-mid-size solar retail businesses in Australia — the office/admin staff, salespeople, and installers who run the day-to-day operation of selling and installing residential/commercial solar (and battery) systems. Their job spans the full lifecycle: qualifying a lead, designing a system and quoting it, running the install through government-compliance stages, generating the STC paperwork the rebate scheme requires, and getting paid.

## Product Purpose

Capitalsun is a job-management CRM purpose-built for the Australian solar industry, positioned as a modern SaaS alternative to incumbent tools in this space (e.g. Bridge Select). Success for a user is running their whole solar business — leads through installed, compliant, paid jobs — from one system, instead of stitching together spreadsheets, generic CRMs, and manual paperwork for government rebate compliance.

## Positioning

Two things a generic CRM competitor could not truthfully copy without rebuilding real domain-specific machinery:
1. **Real Australian solar compliance built in, not bolted on** — STC rebate calculations using the actual government deeming formula and zone ratings, a real CEC-approved equipment catalog (panels/inverters/batteries) for quoting, and generatable STC Assignment Form documents matching the structure the Clean Energy Regulator scheme requires.
2. **A satellite-map solar design tool inside the quoting flow** — draw the roof, auto-fill panels, pick real equipment, and get a production/rebate estimate, without leaving the CRM.

## Operating Context

Workflows already built and live: lead intake (including an AI-style guided chat widget and an API for a company's existing website to push leads in), quote creation with the map-based solar design tool, a job pipeline through the real government submission stages (site inspection → in progress → submitted → approved, etc.), a Retailer Declaration tab using real Clean Energy Regulator statement text, customer-facing proposal/contract pages with e-signature, STC Assignment Form generation, installer and inventory management, payments tracking, and service tickets. Ships as an installable Android app (and an iOS build path) wrapping the same web app, alongside the web product.

## Capabilities and Constraints

- Team accounts exist: an owner creates a company workspace; owner/admin can invite teammates as admin or member. This is the seat/ownership model a future paid plan would meter, but no billing, plans, or pricing are implemented yet.
- Public self-serve sign-up exists in the app (a "Sign up" flow creates a new company workspace) — the landing page's primary CTA can point at it.
- No case studies, customer logos, review quotes, or usage numbers exist yet — this is a pre-launch/early product. The landing page must not invent any.
- No pricing has been decided — omit a pricing section rather than inventing tiers.

## Brand Commitments

- Product name: **Capitalsun**. Legal entity behind it: Capital Solar Energy Pty Ltd (ABN 67642449590) — the entity, not necessarily the customer-facing product framing now that it's being positioned as a SaaS others can join.
- Logo mark: an orange pinwheel/flower icon, served at `/logo.png`, already in use across the app (sign-in, favicon, mobile app icon).
- Primary brand color: burnt-orange, `#c2560c` (light mode) / `#e0791f` (dark mode) — the `--primary` CSS custom property already defined in `src/styles.css`.
- Established visual direction (see Evidence on Hand): light-mode-first, utilitarian/grounded "Operate" surfaces — no violet/blue AI-SaaS gradient aesthetic. The user has explicitly rejected that look before.

## Evidence on Hand

- Real, running product at `src/` — every workflow named above is implemented and live in production, not mocked.
- `src/styles.css` carries the incumbent design tokens (`--primary`, `--bg`, `--panel`, `--text`, `--line`, etc., light and dark) used throughout the authenticated app.
- No testimonials, customer names, or metrics exist — do not fabricate them for this page.
- No pricing has been set — do not invent numbers or tiers.

## Product Principles

1. Real compliance and real equipment data are the product's credibility — lead with what's actually true (real STC math, real CEC catalog, real government-form generation), not generic CRM claims.
2. Built for the actual day-to-day: field-realistic workflows (site inspection stages, installer sign-off, RFIs) over abstract "productivity" messaging.
3. Grounded and utilitarian over flashy — this is a tool professionals trust with compliance paperwork, not a consumer app.
4. Positioned as a company others can join (per the confirmed SaaS-pitch direction), while staying honest that pricing/plans aren't public yet.
