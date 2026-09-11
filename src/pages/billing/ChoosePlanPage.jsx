import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    seats: 'Up to 3 seats',
    priceMonthly: 49,
    priceAnnual: 490,
  },
  {
    id: 'growth',
    name: 'Growth',
    seats: 'Up to 10 seats',
    priceMonthly: 99,
    priceAnnual: 990,
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    seats: 'Unlimited seats',
    priceMonthly: 199,
    priceAnnual: 1990,
  },
];

export default function ChoosePlanPage() {
  const { company, signOut } = useAuth();
  const [cycle, setCycle] = useState('monthly');
  const [busyPlan, setBusyPlan] = useState(null);
  const [error, setError] = useState('');

  async function subscribe(planId) {
    setError('');
    setBusyPlan(planId);
    const { data, error: invokeError } = await supabase.functions.invoke('create-checkout-session', {
      body: { planId, billingCycle: cycle },
    });
    setBusyPlan(null);
    if (invokeError || data?.error) {
      setError(data?.error || invokeError?.message || "Couldn't start checkout.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 900 }}>
        <div className="brand-row" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div className="brand-mark"><img src="/logo.png" alt="Capitalsun" /></div>
            <div>
              <div className="brand-name">Capitalsun</div>
              <div className="brand-subtitle">Solar Job Manager</div>
            </div>
          </div>
          <button type="button" className="link-btn" onClick={signOut}>Sign out</button>
        </div>

        <h1 className="auth-title">Choose a plan for {company?.company_name || 'your workspace'}</h1>
        <p className="auth-subtitle">
          Every plan includes every feature — leads, quoting, the satellite design tool, STC compliance
          paperwork, installer and inventory management. Plans only differ by team size.
        </p>

        <div className="plan-cycle-toggle" role="tablist" aria-label="Billing cycle">
          <button type="button" className={cycle === 'monthly' ? 'active' : ''} onClick={() => setCycle('monthly')}>
            Monthly
          </button>
          <button type="button" className={cycle === 'annual' ? 'active' : ''} onClick={() => setCycle('annual')}>
            Annual <span className="plan-cycle-save">2 months free</span>
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginTop: 14 }}>{error}</div>}

        <div className="plan-grid">
          {PLANS.map((plan) => {
            const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
            return (
              <div className={'plan-card' + (plan.highlight ? ' plan-card--highlight' : '')} key={plan.id}>
                {plan.highlight && <span className="plan-card-badge">Most popular</span>}
                <h3>{plan.name}</h3>
                <div className="plan-card-price">
                  <span className="plan-card-price-figure">${price}</span>
                  <span className="plan-card-price-unit">AUD / {cycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <p className="plan-card-seats">{plan.seats}</p>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ width: '100%' }}
                  disabled={busyPlan !== null}
                  onClick={() => subscribe(plan.id)}
                >
                  {busyPlan === plan.id ? 'Redirecting…' : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
