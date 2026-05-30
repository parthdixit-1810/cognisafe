import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { LockIcon, KeyIcon, ShieldIcon } from '../components/Icons';

const REQS = [
  { test: p => p.length >= 12,         label: 'At least 12 characters' },
  { test: p => /[A-Z]/.test(p),        label: 'One uppercase letter' },
  { test: p => /[a-z]/.test(p),        label: 'One lowercase letter' },
  { test: p => /[0-9]/.test(p),        label: 'One number' },
  { test: p => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
];

function strength(pw) {
  const s = REQS.filter(r => r.test(pw)).length;
  if (!pw || s === 0) return { s: 0, lbl: '',       cls: '' };
  if (s <= 1)         return { s: 1, lbl: 'Weak',   cls: 'weak' };
  if (s <= 2)         return { s: 2, lbl: 'Fair',   cls: 'fair' };
  if (s <= 3)         return { s: 3, lbl: 'Good',   cls: 'good' };
  return               { s: 4,       lbl: 'Strong',  cls: 'strong' };
}

const PERKS = [
  { icon: <LockIcon size={18} />,   text: <><strong>Zero-knowledge</strong> — your master password stays with you</> },
  { icon: <KeyIcon size={18} />,    text: <><strong>Password generator</strong> — stop reusing weak passwords</> },
  { icon: <ShieldIcon size={18} />, text: <><strong>Security audit</strong> — see your vault health at a glance</> },
];

export default function Signup({ onLogin }) {
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();

  const str     = strength(pw);
  const allMet  = REQS.every(r => r.test(pw));
  const pwMatch = pw === confirm;

  const handleGoogleCredential = async (response) => {
    setGoogleLoading(true);
    setError('');
    try {
      const data = await api.auth.googleLogin(response.credential);
      if (data.twoFactorRequired) {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        navigate('/2fa', { state: { userId: data.userId, email: payload.email } });
      } else {
        onLogin(data.token);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline', size: 'large', width: googleBtnRef.current.offsetWidth || 340,
      text: 'signup_with', shape: 'rectangular',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allMet)  return setError('Password does not meet all requirements.');
    if (!pwMatch) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const data = await api.auth.signup(email, pw);
      onLogin(data.token);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* ── Brand panel ── */}
      <div className="auth-brand">
        <div className="auth-brand-grid" />
        <Link to="/" className="auth-brand-logo">
          <img src="/cognisafe-logo.jpg" className="auth-brand-logo-img" alt="CogniSafe" />
        </Link>

        <div className="auth-brand-body">
          <h2 className="auth-brand-headline">
            Start protecting<br />
            <span className="grad-text">your passwords today.</span>
          </h2>
          <p className="auth-brand-sub">
            Free forever. No credit card required. Your vault is ready the moment you sign up.
          </p>
          <ul className="auth-brand-perks">
            {PERKS.map((p, i) => (
              <li key={i} className="auth-brand-perk">
                <div className="perk-icon">{p.icon}</div>
                <span className="perk-text">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-brand-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#60a5fa', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form-side">
        <div className="auth-form-box">
          <h1 className="auth-form-title">Create account</h1>
          <p className="auth-form-sub">
            Already registered? <Link to="/login">Sign in</Link>
          </p>

          <div style={{ marginBottom: 20 }}>
            <div ref={googleBtnRef} style={{ width: '100%', minHeight: 44 }} />
            {googleLoading && <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', marginTop: 8 }}>Continuing with Google…</p>}
          </div>

          <div className="divider" style={{ marginBottom: 20 }}>or sign up with email</div>

          <form onSubmit={handleSubmit} className="auth-form-fields" noValidate>
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="field">
              <label className="field-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="field-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="pw">Master password</label>
              <div className="input-wrap">
                <input
                  id="pw"
                  className="field-input"
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-btn right-1" onClick={() => setShowPw(v => !v)} aria-label="Toggle">
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {pw && (
                <>
                  <div className="pw-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`pw-bar ${i <= str.s ? str.cls : ''}`} />
                    ))}
                  </div>
                  <p className={`pw-strength-text ${str.cls}`}>{str.lbl} password</p>
                  <ul className="pw-reqs">
                    {REQS.map((r, i) => (
                      <li key={i} className={`pw-req ${r.test(pw) ? 'met' : ''}`}>
                        <span>{r.test(pw) ? '✓' : '○'}</span> {r.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                className="field-input"
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />
              {confirm && !pwMatch && <p className="pw-strength-text weak">Passwords do not match</p>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading || !allMet || !pwMatch || !confirm}
            >
              {loading && <span className="spinner" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Eye()    { return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOff() { return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
