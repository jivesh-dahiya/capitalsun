import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ZONE_DEFAULTS_BY_STATE, calculateStcCount } from '../lib/stcCalculator';
import { AU_STATES } from './jobs/jobConstants';
import { PeopleIcon } from '../components/icons';

const CURRENT_YEAR = new Date().getFullYear();
const ASSUMED_STC_PRICE = 35;

// Real capabilities, each paired with an illustrative (AI-generated, not a
// customer's actual site) photo — the tags are real product mechanisms, not
// invented usage stats.
const CAPABILITY_CARDS = [
  {
    num: '/01',
    title: 'Satellite roof design',
    image: '/landing-card-roof.jpg',
    body: 'Satellite map, draw the roof face, auto-fill panels, pick real CEC-approved equipment, and get a production and rebate estimate — before you’ve left the quoting screen.',
    tags: ['CEC-approved catalog', 'Production estimate'],
  },
  {
    num: '/02',
    title: 'Compliance paperwork',
    image: '/landing-card-compliance.jpg',
    body: 'Retailer declarations, STC Assignment Forms, customer proposals with e-signature — generated straight from the job’s real data, in the structure the scheme actually expects.',
    tags: ['STC Assignment Form', 'E-signature'],
  },
  {
    num: '/03',
    title: 'Lead intake',
    image: '/landing-card-leads.jpg',
    body: 'A guided chat widget on your own site — or your existing contact form pushed straight in via API — estimates a system size and books an appointment. No lead waits until morning.',
    tags: ['Chat widget', 'API intake'],
  },
];

export default function Landing() {
  const [calcKw, setCalcKw] = useState('6.6');
  const [calcState, setCalcState] = useState('NSW');
  const [calcYear, setCalcYear] = useState(CURRENT_YEAR);

  const zone = ZONE_DEFAULTS_BY_STATE[calcState] ?? 3;
  const stcCount = useMemo(
    () => calculateStcCount({ systemKw: Number(calcKw) || 0, zone, installYear: Number(calcYear) }),
    [calcKw, zone, calcYear]
  );
  const stcValue = stcCount * ASSUMED_STC_PRICE;

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-frame">
          <img className="landing-hero-photo" src="/landing-hero-photo.jpg" alt="" aria-hidden="true" />
          <div className="landing-hero-scrim" aria-hidden="true" />

          <header className="landing-nav landing-nav--overlay">
            <div className="landing-nav-brand">
              <img src="/logo.png" alt="Capitalsun" />
              <span>Capitalsun</span>
            </div>
            <Link className="landing-nav-signin" to="/login">Sign in</Link>
          </header>

          <div className="landing-hero-copy">
            <h1>The job manager built for how Australian solar actually gets installed.</h1>
            <p>
              Leads, quoting, satellite-map system design, the real government compliance pipeline, and STC
              paperwork generation — one system, not five spreadsheets and a shared inbox.
            </p>
          </div>
        </div>

        <div className="landing-hero-bar">
          <label className="landing-hero-bar-field">
            <span>System size (kW)</span>
            <input type="number" min="0" step="0.1" value={calcKw} onChange={(e) => setCalcKw(e.target.value)} />
          </label>
          <label className="landing-hero-bar-field">
            <span>State</span>
            <select value={calcState} onChange={(e) => setCalcState(e.target.value)}>
              {AU_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="landing-hero-bar-field">
            <span>Install year</span>
            <input type="number" min={CURRENT_YEAR} max="2030" value={calcYear} onChange={(e) => setCalcYear(e.target.value)} />
          </label>
          <div className="landing-hero-bar-result">
            <span className="landing-hero-bar-result-figure">{stcCount} STCs</span>
            <span className="landing-hero-bar-result-sub">${stcValue.toLocaleString()} est. value</span>
          </div>
          <Link className="landing-hero-bar-cta" to="/login?mode=signup">Get started</Link>
        </div>
      </section>

      <div className="landing-badges">
        <span className="landing-badge landing-badge--brand">
          <img src="/logo.png" alt="" aria-hidden="true" /> Capitalsun
        </span>
        <span className="landing-badge">Real STC compliance math</span>
        <div className="landing-scheme-chips" aria-label="Australian solar scheme compliance">
          <span>CEC</span>
          <span>STC</span>
          <span>CER</span>
        </div>
      </div>

      <section className="landing-mission">
        <div className="landing-mission-inner">
          <span className="landing-mission-eyebrow">Not five spreadsheets and a shared inbox</span>
          <h2>Capitalsun means running the whole job, one system.</h2>
          <div className="landing-mission-divider" aria-hidden="true">
            <span className="landing-mission-divider-dot" />
            <span className="landing-mission-divider-line" />
            <span className="landing-mission-divider-target" />
          </div>
        </div>
      </section>

      <section className="landing-gallery">
        <div className="landing-gallery-inner">
          <div className="landing-gallery-copy">
            <span className="landing-gallery-eyebrow">/01 Real compliance</span>
            <h3>Not a generic CRM wearing a solar hat.</h3>
            <p>
              Real STC rebate math using the actual government deeming formula, a real CEC-approved equipment
              catalog, and STC Assignment Forms in the structure the scheme actually expects.
            </p>
            <Link className="landing-hero-cta" to="/login?mode=signup">Get started</Link>
          </div>
          <div className="landing-gallery-photos">
            <figure className="landing-gallery-photo landing-gallery-photo--main">
              <img src="/landing-gallery-main.jpg" alt="Installer securing a solar panel on a residential roof" />
              <figcaption>Rooftop install</figcaption>
            </figure>
            <figure className="landing-gallery-photo landing-gallery-photo--top">
              <img src="/landing-gallery-hands.jpg" alt="Technician wiring a solar inverter" />
              <figcaption>Inverter wiring</figcaption>
            </figure>
            <figure className="landing-gallery-photo landing-gallery-photo--bottom">
              <img src="/landing-gallery-panel.jpg" alt="Close-up of a solar panel array" />
              <figcaption>Panel array</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="landing-cards">
        <div className="landing-cards-inner">
          <div className="landing-cards-header">
            <span>/What&apos;s inside</span>
            <span>Everything the job actually needs, not five separate tools</span>
          </div>
          <div className="landing-cards-grid">
            {CAPABILITY_CARDS.map((card) => (
              <article className="landing-card" key={card.num}>
                <div className="landing-card-photo">
                  <img src={card.image} alt="" aria-hidden="true" />
                  <span className="landing-card-num">{card.num}</span>
                </div>
                <div className="landing-card-body">
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                  <div className="landing-card-tags">
                    {card.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-team">
        <div className="landing-team-inner">
          <PeopleIcon width={26} height={26} />
          <h2>Built for a whole team, not one login.</h2>
          <p>
            Invite installers, salespeople, and office staff as admins or members. One owner, real roles, one
            shared pipeline — everyone working off the same job, not a copy of a spreadsheet.
          </p>
          <Link className="landing-hero-cta" to="/login?mode=signup">Start your workspace</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-nav-brand">
          <img src="/logo.png" alt="Capitalsun" />
          <span>Capitalsun</span>
        </div>
        <span className="landing-footer-meta">Capital Solar Energy Pty Ltd · ABN 67 642 449 590</span>
        <Link className="landing-nav-signin" to="/login">Sign in</Link>
      </footer>
    </div>
  );
}
