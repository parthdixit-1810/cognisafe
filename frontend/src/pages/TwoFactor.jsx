import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { MailIcon, ClockIcon, ShieldCheckIcon } from '../components/Icons';

const LEN = 6;
const DEVICE_TOKEN_KEY = 'cognisafe_device_token';

export default function TwoFactor({ onLogin }) {
  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const refs = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userId, email } = state || {};

  useEffect(() => {
    if (!userId) { navigate('/login', { replace: true }); return; }
    refs.current[0]?.focus();
  }, [userId, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const focus = (i) => refs.current[Math.max(0, Math.min(i, LEN - 1))]?.focus();

  const onChange = (i, val) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < LEN - 1) focus(i + 1);
    if (d && i === LEN - 1) submit(next);
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) focus(i - 1);
    if (e.key === 'ArrowLeft') focus(i - 1);
    if (e.key === 'ArrowRight') focus(i + 1);
  };

  const onPaste = (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    if (!raw) return;
    const next = Array(LEN).fill('');
    raw.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    focus(Math.min(raw.length, LEN - 1));
    if (raw.length === LEN) submit(next);
  };

  const deviceName = navigator.userAgent.slice(0, 80);

  const submit = async (d) => {
    const code = d.join('');
    if (code.length < LEN || !userId) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.auth.verify2fa(Number(userId), code, { rememberDevice, deviceName });
      if (data.deviceToken) localStorage.setItem(DEVICE_TOKEN_KEY, data.deviceToken);
      onLogin(data.token);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      setDigits(Array(LEN).fill(''));
      setTimeout(() => focus(0), 50);
    } finally {
      setLoading(false);
    }
  };

  const submitRecovery = async () => {
    if (!recoveryCode.trim() || !userId) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.auth.verify2fa(Number(userId), recoveryCode.trim(), { rememberDevice, deviceName });
      if (data.deviceToken) localStorage.setItem(DEVICE_TOKEN_KEY, data.deviceToken);
      onLogin(data.token);
    } catch (err) {
      setError(err.message || 'Invalid recovery code.');
      setRecoveryCode('');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!userId || cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      await api.auth.resendOtp(Number(userId));
      setCooldown(30);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-brand">
        <div className="auth-brand-grid" />
        <Link to="/" className="auth-brand-logo">
          <img src="/cognisafe-logo.jpg" className="auth-brand-logo-img" alt="CogniSafe" />
        </Link>

        <div className="auth-brand-body">
          <h2 className="auth-brand-headline">
            One more step<br />
            <span className="grad-text">to stay secure.</span>
          </h2>
          <p className="auth-brand-sub">
            We sent a one-time verification code to your email.
          </p>
          <ul className="auth-brand-perks">
            <li className="auth-brand-perk">
              <div className="perk-icon"><MailIcon size={18} /></div>
              <span className="perk-text">Code sent to <strong>{email}</strong></span>
            </li>
            <li className="auth-brand-perk">
              <div className="perk-icon"><ClockIcon size={18} /></div>
              <span className="perk-text"><strong>Code expires</strong> in 5 minutes</span>
            </li>
            <li className="auth-brand-perk">
              <div className="perk-icon"><ShieldCheckIcon size={18} /></div>
              <span className="perk-text"><strong>Code is hashed</strong> before storage</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <h1 className="auth-form-title">Check your email</h1>
          <p className="auth-form-sub" style={{ marginBottom: 20 }}>
            Enter the 6-digit code sent to <strong style={{ color: 'var(--text)' }}>{email || 'your email'}</strong>
          </p>

          <div className="auth-form-fields">
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {!useRecovery ? (
              <>
                <div className="otp-grid" onPaste={onPaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => refs.current[i] = el}
                      className={`otp-box ${d ? 'filled' : ''}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => onChange(i, e.target.value)}
                      onKeyDown={e => onKeyDown(i, e)}
                      disabled={loading}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || digits.join('').length < LEN} onClick={() => submit(digits)}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Verifying…' : 'Verify code'}
                </button>
                <button className="btn btn-surface" style={{ width: '100%', justifyContent: 'center' }} disabled={resending || cooldown > 0} onClick={resend}>
                  {resending ? 'Resending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </>
            ) : (
              <>
                <div className="field">
                  <label className="field-label">Recovery code</label>
                  <input
                    className="field-input"
                    type="text"
                    value={recoveryCode}
                    onChange={e => setRecoveryCode(e.target.value)}
                    placeholder="e.g. a1b2c3d4e5"
                    autoFocus
                    disabled={loading}
                    onKeyDown={e => e.key === 'Enter' && submitRecovery()}
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || !recoveryCode.trim()} onClick={submitRecovery}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Verifying…' : 'Use recovery code'}
                </button>
              </>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-2)', userSelect: 'none' }}>
              <input type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} />
              Trust this device for 30 days
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <button
                type="button"
                onClick={() => { setUseRecovery(v => !v); setError(''); setRecoveryCode(''); setDigits(Array(LEN).fill('')); }}
                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 14 }}
              >
                {useRecovery ? 'Use verification code instead' : 'Use a recovery code instead'}
              </button>
              <Link to="/login" style={{ color: 'var(--text-2)' }}>Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
