import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { SunIcon, MoonIcon } from '../components/icons';

export default function Login({ theme: { theme, toggleTheme } }) {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // Public sign-up isn't linked from the UI in production — a brand-new
  // company workspace is created once via this query param, then teammates
  // are added through Profile's "Invite" flow instead of open sign-up.
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn({ email: form.email, password: form.password });
      } else if (mode === 'reset') {
        await requestPasswordReset(form.email);
        setResetSent(true);
      } else {
        await signUp(form);
        // Clear ?mode=signup once the account exists — otherwise logging out
        // remounts this page with the same URL and lands back on the signup
        // form instead of sign-in, since the query param is still there.
        setSearchParams({}, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setResetSent(false);
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-row" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div className="brand-mark">C</div>
            <div>
              <div className="brand-name">Capitalsun</div>
              <div className="brand-subtitle">Solar Job Manager</div>
            </div>
          </div>
          <button type="button" className="icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === 'light' ? <MoonIcon width={18} height={18} /> : <SunIcon width={18} height={18} />}
          </button>
        </div>

        <h1 className="auth-title">
          {mode === 'signin' ? 'Welcome back' : mode === 'reset' ? 'Reset your password' : 'Create your account'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'signin'
            ? 'Sign in to manage jobs, installers and inventory.'
            : mode === 'reset'
            ? "Enter your account email and we'll send a link to set a new password."
            : 'Set up your company workspace in under a minute.'}
        </p>

        {mode === 'signup' && (
          <>
            <div className="field-row">
              <label>
                First name
                <input value={form.firstName} onChange={update('firstName')} required />
              </label>
              <label>
                Last name
                <input value={form.lastName} onChange={update('lastName')} required />
              </label>
            </div>
            <label>
              Company name
              <input value={form.companyName} onChange={update('companyName')} required />
            </label>
          </>
        )}

        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>

        {mode !== 'reset' && (
          <label>
            Password
            <input type="password" value={form.password} onChange={update('password')} required minLength={6} />
          </label>
        )}

        {mode === 'signin' && (
          <button type="button" className="link-btn auth-forgot-link" onClick={() => switchMode('reset')}>
            Forgot password?
          </button>
        )}

        {error && <div className="auth-error">{error}</div>}

        {mode === 'reset' && resetSent ? (
          <div className="readiness-pill ready" style={{ fontSize: '0.9rem', padding: '8px 14px', marginBottom: 14 }}>
            If an account exists for that email, a reset link is on its way.
          </div>
        ) : (
          <button className="primary-btn auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'reset' ? 'Send reset link' : 'Create account'}
          </button>
        )}

        {mode === 'reset' && (
          <button type="button" className="link-btn" onClick={() => switchMode('signin')}>
            Back to sign in
          </button>
        )}
        {mode === 'signup' && (
          <button type="button" className="link-btn" onClick={() => switchMode('signin')}>
            Already have an account? Sign in
          </button>
        )}
      </form>
    </div>
  );
}
