import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ZONE_DEFAULTS_BY_STATE, calculateStcCount } from '../lib/stcCalculator';
import { AU_STATES } from './jobs/jobConstants';
import { ChevronRightIcon, PeopleIcon } from '../components/icons';

const CURRENT_YEAR = new Date().getFullYear();
const ASSUMED_STC_PRICE = 35;

// Real stage labels from the actual job pipeline (jobConstants.js), a
// representative arc through it — not the full 13-stage list, which would
// be too dense to read at a glance here.
const HERO_STAGES = [
  { label: 'Site Inspection', cards: ['J. Whitfield — 6.6kW'] },
  { label: 'In progress', cards: ['M. Alavi — 10kW + battery', 'R. Costa — 8.4kW'] },
  { label: 'Submitted', cards: ['T. Nguyen — 13.2kW'] },
  { label: 'Approved', cards: ['K. Osei — 9.9kW', 'D. Farrow — 6.6kW'] },
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
        <header className="landing-nav landing-nav--overlay">
          <div className="landing-nav-brand">
            <img src="/logo.png" alt="Capitalsun" />
            <span>Capitalsun</span>
          </div>
          <Link className="landing-nav-signin" to="/login">Sign in</Link>
        </header>

        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <h1>The job manager built for how Australian solar actually gets installed.</h1>
            <p>
              Leads, quoting, satellite-map system design, the real government compliance pipeline, and STC
              paperwork generation — one system, not five spreadsheets and a shared inbox.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-hero-cta" to="/login?mode=signup">Start free</Link>
              <Link className="landing-hero-cta-secondary" to="/login">Sign in</Link>
            </div>
          </div>

          <div className="landing-pipeline-wrap">
            <span className="landing-pipeline-caption">Example jobs</span>
            <div className="landing-pipeline" role="img" aria-label="Example job pipeline showing stages from site inspection through approval">
              {HERO_STAGES.map((stage, i) => (
                <div className={'landing-pipeline-col' + (i === HERO_STAGES.length - 1 ? ' is-final' : '')} key={stage.label}>
                  <span className="landing-pipeline-label">{stage.label}</span>
                  {stage.cards.map((card) => (
                    <div className="landing-pipeline-card" key={card}>{card}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-calc">
        <div className="landing-calc-inner">
          <div className="landing-calc-copy">
            <h2>Real STC math, not a placeholder.</h2>
            <p>
              This is the same deeming calculation (system size × zone rating × years remaining on the scheme)
              the app uses on a real quote. Try it.
            </p>
          </div>
          <div className="landing-calc-tool">
            <div className="landing-calc-row">
              <label>System size (kW)
                <input type="number" min="0" step="0.1" value={calcKw} onChange={(e) => setCalcKw(e.target.value)} />
              </label>
              <label>State
                <select value={calcState} onChange={(e) => setCalcState(e.target.value)}>
                  {AU_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Install year
                <input type="number" min={CURRENT_YEAR} max="2030" value={calcYear} onChange={(e) => setCalcYear(e.target.value)} />
              </label>
            </div>
            <div className="landing-calc-result">
              <div>
                <span className="landing-calc-result-label">STCs</span>
                <span className="landing-calc-result-figure">{stcCount}</span>
              </div>
              <div>
                <span className="landing-calc-result-label">Indicative value</span>
                <span className="landing-calc-result-figure">${stcValue.toLocaleString()}</span>
              </div>
            </div>
            <p className="landing-calc-note">
              Assumes ${ASSUMED_STC_PRICE}/certificate — STC prices float daily on the open market, so this is a
              planning figure, not a live quote. Zone shown is a state default; the app lets you set the exact
              postcode zone.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-index">
        <div className="landing-index-inner">
          <div className="landing-index-header">
            <span>/What&apos;s inside</span>
            <span>Everything the job actually needs, not five separate tools</span>
          </div>

          <details className="landing-index-row" open>
            <summary>
              <span className="landing-index-num">/01</span>
              <span className="landing-index-title">Satellite roof design</span>
              <span className="landing-index-toggle"><span>See more</span><ChevronRightIcon width={16} height={16} /></span>
            </summary>
            <div className="landing-index-reveal">
              <p>
                The design tool sits inside the quote itself: satellite map, draw the roof face, auto-fill
                panels, pick real CEC-approved equipment, and get a production and rebate estimate — before
                you&apos;ve left the quoting screen.
              </p>
              <div className="landing-index-visual">
                <div className="landing-map-roof">
                  <div className="landing-map-panel-grid">
                    {Array.from({ length: 24 }).map((_, i) => <span key={i} />)}
                  </div>
                </div>
              </div>
            </div>
          </details>

          <details className="landing-index-row">
            <summary>
              <span className="landing-index-num">/02</span>
              <span className="landing-index-title">Compliance paperwork</span>
              <span className="landing-index-toggle"><span>See more</span><ChevronRightIcon width={16} height={16} /></span>
            </summary>
            <div className="landing-index-reveal">
              <p>
                Retailer declarations, STC Assignment Forms, customer proposals with e-signature — generated
                straight from the job&apos;s real data, in the structure the scheme actually expects.
              </p>
              <div className="landing-index-visual">
                <div className="landing-form-mock">
                  <div className="landing-form-mock-header">
                    <span>STC Assignment Form</span>
                    <span>Battery Systems</span>
                  </div>
                  <div className="landing-form-mock-row">
                    <span>Site address</span>
                    <span>14 Grovedale Cres, Ballarat VIC</span>
                  </div>
                  <div className="landing-form-mock-row">
                    <span>System capacity</span>
                    <span>6.6 kW</span>
                  </div>
                  <div className="landing-form-mock-row landing-form-mock-row--short">
                    <span>STC zone</span>
                    <span>Zone 3</span>
                  </div>
                  <div className="landing-form-mock-signature">Signed</div>
                </div>
              </div>
            </div>
          </details>

          <details className="landing-index-row">
            <summary>
              <span className="landing-index-num">/03</span>
              <span className="landing-index-title">Lead intake</span>
              <span className="landing-index-toggle"><span>See more</span><ChevronRightIcon width={16} height={16} /></span>
            </summary>
            <div className="landing-index-reveal">
              <p>
                A guided chat widget on your own site — or your existing contact form pushed straight in via
                API — asks what a lead wants, gets their address and bill, estimates a system size, and books
                an appointment. No lead waits until morning.
              </p>
              <div className="landing-index-visual">
                <div className="landing-chat-mock">
                  <div className="landing-chat-bubble landing-chat-bubble--them">What are you looking to install?</div>
                  <div className="landing-chat-bubble landing-chat-bubble--us">Solar + battery, bill&apos;s around $380/quarter</div>
                  <div className="landing-chat-bubble landing-chat-bubble--them">Got it — what&apos;s the install address?</div>
                </div>
              </div>
            </div>
          </details>
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
