import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || "Couldn't update your password. The reset link may have expired — request a new one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-row">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">Capitalsun</div>
            <div className="brand-subtitle">Solar Job Manager</div>
          </div>
        </div>

        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-subtitle">Choose a new password for your account.</p>

        {done ? (
          <div className="readiness-pill ready" style={{ fontSize: '0.9rem', padding: '8px 14px' }}>
            Password updated — taking you to the dashboard…
          </div>
        ) : (
          <>
            <label>
              New password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </label>
            <label>
              Confirm new password
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="primary-btn auth-submit" type="submit" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
