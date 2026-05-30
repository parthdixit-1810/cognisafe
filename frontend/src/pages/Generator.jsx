import { useState, useCallback, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { useUser } from '../hooks/useUser';
import { api } from '../api';
import { copyWithAutoClear } from '../utils/clipboard';

/* ── Password generation ────────────────────────────────────── */
const SETS = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function generatePw(length, opts) {
  const enabled = Object.entries(opts).filter(([,v]) => v).map(([k]) => SETS[k]);
  if (!enabled.length) return '';
  const all = enabled.join('');
  // Guarantee at least one char per enabled set
  let pw = enabled.map(s => s[cryptoRandomInt(s.length)]);
  const arr = new Uint32Array(Math.max(length - pw.length, 0));
  crypto.getRandomValues(arr);
  arr.forEach(n => pw.push(all[n % all.length]));
  pw = pw.slice(0, length);
  // Fisher-Yates shuffle
  for (let i = pw.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join('');
}

function calcStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#475569', pct: 0 };
  let s = 0;
  if (pw.length >= 12)              s++;
  if (pw.length >= 16)              s++;
  if (/[A-Z]/.test(pw))            s++;
  if (/[a-z]/.test(pw))            s++;
  if (/[0-9]/.test(pw))            s++;
  if (/[^A-Za-z0-9]/.test(pw))     s++;
  const pct = Math.round((s / 6) * 100);
  if (s <= 2) return { score: s, label: 'Weak',   color: '#ef4444', pct };
  if (s <= 3) return { score: s, label: 'Fair',   color: '#f59e0b', pct };
  if (s <= 4) return { score: s, label: 'Good',   color: '#84cc16', pct };
  return       { score: s, label: 'Strong',  color: '#22c55e', pct };
}

/* ── Toast ──────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, add };
}

/* ── Save modal ─────────────────────────────────────────────── */
function SaveModal({ pw, onClose, onSaved }) {
  const [site,    setSite]    = useState('');
  const [user,    setUser]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.vault.add({ site, username: user, password: pw });
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Save to vault</h2>
          <p className="modal-sub">Store this generated password in your vault.</p>
        </div>
        <form onSubmit={handleSave} noValidate>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="field">
              <label className="field-label">Generated password</label>
              <div style={{ fontFamily: 'monospace', fontSize: 14, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border-brand)', borderRadius: 'var(--r)', color: 'var(--text)', wordBreak: 'break-all' }}>
                {pw}
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="sv-site">Website / Service</label>
              <input id="sv-site" className="field-input" type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="GitHub, Gmail…" required autoFocus />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="sv-user">Username / Email</label>
              <input id="sv-user" className="field-input" type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="your@email.com" required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-surface" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Saving…' : 'Save to vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Generator({ onLogout }) {
  const { user, toggle2FA } = useUser();
  const { toasts, add: toast } = useToast();

  const [length,   setLength]   = useState(16);
  const [opts,     setOpts]     = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState('');
  const [history,  setHistory]  = useState([]);
  const [showSave, setShowSave] = useState(false);

  const generate = useCallback(() => {
    const pw = generatePw(length, opts);
    setPassword(pw);
    if (pw) setHistory(h => [pw, ...h].slice(0, 10));
  }, [length, opts]);

  useEffect(() => { generate(); }, [generate]);

  const toggleOpt = (key) => {
    const active = Object.values({ ...opts, [key]: !opts[key] }).filter(Boolean).length;
    if (active === 0) return; // keep at least one
    setOpts(o => ({ ...o, [key]: !o[key] }));
  };

  const copy = (pw) => {
    copyWithAutoClear(pw, () => toast('Copied (auto-clears in 30s)'), () => toast('Copy failed', 'error'));
  };

  const handleToggle2FA = async () => {
    try {
      const next = await toggle2FA();
      toast(next ? '2FA enabled' : '2FA disabled', 'info');
    } catch (err) {
      toast(err.message || 'Failed to update 2FA', 'error');
    }
  };

  const str = calcStrength(password);

  const OPT_ITEMS = [
    { key: 'upper',   icon: 'A',  label: 'Uppercase' },
    { key: 'lower',   icon: 'a',  label: 'Lowercase' },
    { key: 'numbers', icon: '1',  label: 'Numbers' },
    { key: 'symbols', icon: '!',  label: 'Symbols' },
  ];

  return (
    <AppShell
      email={user?.email}
      twoFAEnabled={user?.twoFactorEnabled}
      onToggle2FA={handleToggle2FA}
      onLogout={onLogout}
    >
      <div className="gen-layout">
        {/* ── Generator card ── */}
        <div className="gen-card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Password Generator</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
            Cryptographically secure. Customise then copy or save.
          </p>

          {/* Display */}
          <div className="pw-display">{password || <span style={{ color: 'var(--text-3)' }}>—</span>}</div>

          {/* Strength strip */}
          <div className="pw-strength-strip">
            <div className="pw-strength-fill" style={{ width: `${str.pct}%`, background: str.color }} />
          </div>
          <p style={{ fontSize: 12, color: str.color, marginBottom: 20, fontWeight: 600 }}>
            {str.label} {str.label && `(${str.pct}%)`}
          </p>

          {/* Actions */}
          <div className="gen-actions">
            <button className="btn btn-primary" onClick={generate}>
              <Refresh size={14} /> Regenerate
            </button>
            <button className="btn btn-surface" onClick={() => copy(password)} disabled={!password}>
              <CopyIcon size={14} /> Copy
            </button>
            <button className="btn btn-success btn-sm" onClick={() => setShowSave(true)} disabled={!password} style={{ padding: '10px 18px' }}>
              <SaveIcon size={14} /> Save to vault
            </button>
          </div>

          {/* Length slider */}
          <div className="slider-row">
            <div className="slider-row-label">
              <span style={{ color: 'var(--text-2)' }}>Password length</span>
              <span className="slider-val">{length}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={8} max={64}
              value={length}
              onChange={e => setLength(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              <span>8</span><span>64</span>
            </div>
          </div>

          {/* Character options */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--text-3)', marginBottom: 10 }}>
            Character sets
          </p>
          <div className="opt-grid">
            {OPT_ITEMS.map(({ key, icon, label }) => (
              <label key={key} className={`opt-item ${opts[key] ? 'on' : ''}`}>
                <input type="checkbox" checked={opts[key]} onChange={() => toggleOpt(key)} />
                <span style={{ fontSize: 15, fontWeight: 700, color: opts[key] ? '#a5b4fc' : 'var(--text-3)', width: 20, textAlign: 'center' }}>{icon}</span>
                <span className="opt-label">{label}</span>
                <span className="opt-check">{opts[key] && '✓'}</span>
              </label>
            ))}
          </div>

          {/* Stats */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px', fontSize: 13, color: 'var(--text-2)' }}>
            <strong style={{ color: 'var(--text)' }}>Entropy: </strong>
            {password ? `~${Math.floor(password.length * Math.log2(Object.values(opts).filter(Boolean).length * 26))} bits` : '—'}
            <span style={{ marginLeft: 20 }}>
              <strong style={{ color: 'var(--text)' }}>Charset: </strong>
              {Object.entries(opts).filter(([,v]) => v).map(([k]) => k).join(', ')}
            </span>
          </div>
        </div>

        {/* ── History ── */}
        <div className="history-card">
          <div className="history-title">
            <span>Recent passwords</span>
            {history.length > 0 && (
              <button className="btn btn-sm btn-surface" onClick={() => setHistory([])}>Clear</button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="history-empty">Generated passwords will appear here</p>
          ) : (
            <div className="history-list">
              {history.map((pw, i) => (
                <div key={i} className="history-item">
                  <span className="history-pw">{pw}</span>
                  <button className="icon-btn" onClick={() => copy(pw)} title="Copy" style={{ flexShrink: 0 }}>
                    <CopyIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20, padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            History is session-only and never stored. Close the tab to clear it.
          </div>
        </div>
      </div>

      {showSave && (
        <SaveModal
          pw={password}
          onClose={() => setShowSave(false)}
          onSaved={() => { setShowSave(false); toast('Saved to vault', 'success'); }}
        />
      )}

      <div className="toasts">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>
    </AppShell>
  );
}

function Refresh({ size=16 })  { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>; }
function CopyIcon({ size=16 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function SaveIcon({ size=16 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function cryptoRandomInt(max) { const arr = new Uint32Array(1); crypto.getRandomValues(arr); return arr[0] % max; }
