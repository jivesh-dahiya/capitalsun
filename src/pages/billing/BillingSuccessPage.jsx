import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

// Stripe redirects here right after checkout, but the webhook that flips
// company_subscriptions to 'active' is a separate, slightly-delayed async
// call from Stripe — so this page polls briefly rather than assuming the
// subscription is already active the instant the user lands back.
export default function BillingSuccessPage() {
  const { subscription, refreshCompany } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (subscription?.status === 'active') {
      navigate('/', { replace: true });
      return;
    }
    if (attemptsRef.current >= 10) {
      setTimedOut(true);
      return;
    }
    const timer = setTimeout(async () => {
      attemptsRef.current += 1;
      await refreshCompany();
    }, 1500);
    return () => clearTimeout(timer);
  }, [subscription, refreshCompany, navigate]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">
          {timedOut ? 'Still working on it' : 'Activating your subscription…'}
        </h1>
        <p className="auth-subtitle">
          {timedOut
            ? "This is taking longer than expected. Your payment likely went through — refresh in a moment, or contact us if it doesn't activate."
            : 'This only takes a few seconds.'}
        </p>
        {timedOut && (
          <button type="button" className="primary-btn" onClick={() => { attemptsRef.current = 0; setTimedOut(false); refreshCompany(); }}>
            Check again
          </button>
        )}
      </div>
    </div>
  );
}
