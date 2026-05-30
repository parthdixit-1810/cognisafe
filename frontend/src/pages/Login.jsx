import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { LockIcon, KeyIcon, ShieldIcon } from '../components/Icons';

const PERKS = [
  { icon: <LockIcon size={18} />, text: <><strong>Encrypted vault</strong> — every saved password stays protected</> },
  { icon: <KeyIcon size={18} />, text: <><strong>Built-in generator</strong> — create strong passwords instantly</> },
  { icon: <ShieldIcon size={18} />, text: <><strong>Security audit</strong> — catch weak or reused credentials</> },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const deviceToken = localStorage.getItem('cognisafe_device_token') || undefined;
      const data = await api.auth.login(email, password, deviceToken);
      if (data.twoFactorRequired) {
        navigate('/2fa', { state: { userId: data.userId, email } });
      } else {
        onLogin(data.token);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    setGoogleLoading(true);
    setError('');
    try {
      const data = await api.auth.googleLogin(response.credential);
      if (data.twoFactorRequired) {
        // Extract email from JWT payload (base64)
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
      text: 'signin_with', shape: 'rectangular',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="auth-split">
      <div className="auth-brand">
        <div className="auth-brand-grid" />
        <Link to="/" className="auth-brand-logo">
          <img src="/cognisafe-logo.jpg" className="auth-brand-logo-img" alt="CogniSafe" />
        </Link>

        <div className="auth-brand-body">
          <h2 className="auth-brand-headline">
            Welcome back.<br />
            <span className="grad-text">Your vault awaits.</span>
          </h2>
          <p className="auth-brand-sub">
            Sign in to access your dashboard, vault, and password security tools.
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
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: '#60a5fa', fontWeight: 500 }}>Create one free</Link>
        </p>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <h1 className="auth-form-title">Sign in</h1>
          <p className="auth-form-sub">
            New here? <Link to="/signup">Create an account</Link>
          </p>

          <div style={{ marginBottom: 20 }}>
            <div ref={googleBtnRef} style={{ width: '100%', minHeight: 44 }} />
            {googleLoading && <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', marginTop: 8 }}>Signing in with Google…</p>}
          </div>

          <div className="divider" style={{ marginBottom: 20 }}>or continue with email</div>

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
              <label className="field-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  className="field-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="input-icon-btn right-1" onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Eye() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOff() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
