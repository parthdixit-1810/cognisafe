import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useUser } from '../hooks/useUser';
import { api } from '../api';
import { DatabaseIcon } from '../components/Icons';
import { copyWithAutoClear } from '../utils/clipboard';
import { generateSecurePassword } from '../utils/password';
import { useFocusTrap } from '../hooks/useFocusTrap';

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, add };
}

const TYPES = [
  { value: 'password', label: 'Password' },
  { value: 'note',     label: 'Note'     },
  { value: 'card',     label: 'Card'     },
  { value: 'wifi',     label: 'Wi-Fi'    },
  { value: 'license',  label: 'License'  },
];

const TYPE_META = {
  password: { siteLabel: 'Website / Service',   sitePH: 'GitHub, Gmail…',      userLabel: 'Username / Email',  userPH: 'john@example.com', pwLabel: 'Password',    showUser: true,  showUrl: true,  pwRequired: true  },
  note:     { siteLabel: 'Title',               sitePH: 'Meeting notes…',       userLabel: '',                  userPH: '',                 pwLabel: '',            showUser: false, showUrl: false, pwRequired: false },
  card:     { siteLabel: 'Card name',           sitePH: 'Visa, Amex…',          userLabel: 'Cardholder name',   userPH: 'Jane Smith',       pwLabel: 'Card number', showUser: true,  showUrl: false, pwRequired: true  },
  wifi:     { siteLabel: 'Network name (SSID)', sitePH: 'My Home Wi-Fi',        userLabel: '',                  userPH: '',                 pwLabel: 'Wi-Fi password', showUser: false, showUrl: false, pwRequired: true },
  license:  { siteLabel: 'Software name',       sitePH: 'Adobe, JetBrains…',   userLabel: 'Email / Account',   userPH: 'john@example.com', pwLabel: 'License key', showUser: true,  showUrl: true,  pwRequired: true  },
};

function PwModal({ entry, onSave, onClose }) {
  const isEdit = !!entry;
  const [type, setType]           = useState(entry?.type ?? 'password');
  const [site, setSite]           = useState(entry?.site ?? '');
  const [username, setUsername]   = useState(entry?.username ?? '');
  const [pw, setPw]               = useState(entry?.password ?? '');
  const [url, setUrl]             = useState(entry?.url ?? '');
  const [notes, setNotes]         = useState(entry?.notes ?? '');
  const [showPw, setShowPw]       = useState(false);
  const [customFields, setCustomFields] = useState(() => {
    const cf = entry?.customFields;
    if (Array.isArray(cf) && cf.length) return cf;
    return [];
  });
  const [history, setHistory]     = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const meta = TYPE_META[type] ?? TYPE_META.password;
  const modalRef = useRef(null);
  useFocusTrap(modalRef);

  const loadHistory = async () => {
    if (!isEdit || history !== null) return;
    setHistoryLoading(true);
    try { setHistory(await api.vault.history(entry.id)); }
    catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  const toggleHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next) loadHistory();
  };

  const addCustomField = () => setCustomFields(cf => [...cf, { label: '', value: '', hidden: false }]);
  const removeCustomField = (i) => setCustomFields(cf => cf.filter((_, idx) => idx !== i));
  const updateCustomField = (i, key, val) => setCustomFields(cf => cf.map((f, idx) => idx === i ? { ...f, [key]: val } : f));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanFields = customFields.filter(f => f.label.trim());
      await onSave({ type, site, username, password: pw, url, notes, customFields: cleanFields.length ? cleanFields : null });
    } catch (err) {
      setError(err.message || 'Failed to save entry.');
    } finally {
      setLoading(false);
    }
  };

  const relTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={modalRef} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit entry' : 'New entry'}</h2>
          <p className="modal-sub">{isEdit ? 'Update the saved details' : 'Add a new item to your vault'}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'contents' }}>
          <div className="modal-body">
            {/* Type selector */}
            <div className="type-tabs">
              {TYPES.map(t => (
                <button key={t.value} type="button" className={`type-tab${type === t.value ? ' active' : ''}`} onClick={() => setType(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Site / Title */}
            <div className="field">
              <label className="field-label">{meta.siteLabel}</label>
              <input className="field-input" type="text" value={site} onChange={e => setSite(e.target.value)} placeholder={meta.sitePH} required autoFocus />
            </div>

            {/* Username */}
            {meta.showUser && (
              <div className="field">
                <label className="field-label">{meta.userLabel}</label>
                <input className="field-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={meta.userPH} autoComplete="off" />
              </div>
            )}

            {/* URL */}
            {meta.showUrl && (
              <div className="field">
                <label className="field-label">Website URL (optional)</label>
                <input className="field-input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}

            {/* Password / key field */}
            {meta.pwRequired && (
              <div className="field">
                <label className="field-label">{meta.pwLabel}</label>
                <div className="input-wrap">
                  <input className={`field-input ${type === 'password' ? 'input-dual' : ''}`} type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder={`Enter ${meta.pwLabel.toLowerCase()}`} required={meta.pwRequired} autoComplete="new-password" />
                  <button type="button" className="input-icon-btn right-2" onClick={() => setShowPw(v => !v)} aria-label="Toggle">{showPw ? <EyeOff /> : <Eye />}</button>
                  {type === 'password' && <button type="button" className="input-icon-btn right-1" onClick={() => { setPw(generateSecurePassword(16)); setShowPw(true); }} title="Generate"><Refresh /></button>}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="field">
              <label className="field-label">Notes{type !== 'note' ? ' (optional)' : ''}</label>
              <textarea
                className="field-input"
                rows={type === 'note' ? 6 : 3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={type === 'note' ? 'Write your secure note here…' : 'Any additional details…'}
                style={{ resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Custom fields */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="field-label" style={{ margin: 0 }}>Custom fields</span>
                <button type="button" className="btn btn-surface btn-sm" onClick={addCustomField}><Plus size={12} /> Add field</button>
              </div>
              {customFields.length > 0 && (
                <div className="custom-fields">
                  {customFields.map((cf, i) => (
                    <div key={i} className="custom-field-row">
                      <input className="field-input custom-field-label" type="text" placeholder="Label" value={cf.label} onChange={e => updateCustomField(i, 'label', e.target.value)} />
                      <div className="input-wrap custom-field-value">
                        <input className="field-input" style={{ paddingRight: cf.hidden ? 76 : 44 }} type={cf.hidden ? 'password' : 'text'} placeholder="Value" value={cf.value} onChange={e => updateCustomField(i, 'value', e.target.value)} />
                        <button type="button" className="input-icon-btn right-2" onClick={() => updateCustomField(i, 'hidden', !cf.hidden)} title={cf.hidden ? 'Show' : 'Hide'}>{cf.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                      </div>
                      <button type="button" className="icon-btn danger" onClick={() => removeCustomField(i)} title="Remove"><Trash size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Password history (edit mode only) */}
            {isEdit && (
              <div className="history-panel">
                <div className="history-panel-header" onClick={toggleHistory} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggleHistory()}>
                  <span>Password history</span>
                  <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{historyOpen ? '▲ hide' : '▼ show'}</span>
                </div>
                {historyOpen && (
                  <div className="history-panel-body">
                    {historyLoading && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-3)' }}>Loading…</div>}
                    {!historyLoading && history?.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-3)' }}>No history yet — changes will appear here.</div>}
                    {!historyLoading && history?.map(h => (
                      <div key={h.id} className="history-entry">
                        <span className="history-entry-pw">{'•'.repeat(10)} {h.password.slice(-4)}</span>
                        <span className="history-entry-date">{relTime(h.createdAt)}</span>
                        <button type="button" className="icon-btn" title="Restore this password" onClick={() => { setPw(h.password); setShowPw(true); }}><Refresh size={13} /></button>
                        <button type="button" className="icon-btn" title="Copy" onClick={() => navigator.clipboard.writeText(h.password)}><Copy size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-surface" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add to vault'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Operation 2FA verification modal ──────────────────────────── */
function OpVerifyModal({ action, onVerified, onClose }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);
  useFocusTrap(ref);

  const sendCode = async () => {
    setSending(true); setError('');
    try {
      await api.auth.sendOperationCode();
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send code.');
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!code.trim()) return;
    setLoading(true); setError('');
    try {
      await api.auth.verifyOperation(code.trim());
      onVerified();
    } catch (err) {
      setError(err.message || 'Invalid code.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={ref} style={{ maxWidth: 400 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Verify to continue
          </h2>
          <p className="modal-sub">
            {sent
              ? 'Enter the 6-digit code sent to your email.'
              : `This action (${action}) requires identity verification.`}
          </p>
        </div>
        <div className="modal-body" style={{ paddingBottom: 4 }}>
          {error && <div className="alert alert-error">{error}</div>}
          {!sent ? (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={sendCode} disabled={sending}>
              {sending && <span className="spinner" />}
              {sending ? 'Sending…' : 'Send verification code to my email'}
            </button>
          ) : (
            <div className="field">
              <label className="field-label">6-digit code</label>
              <input
                className="field-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && verify()}
                style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center' }}
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-surface" onClick={onClose}>Cancel</button>
          {sent && (
            <button className="btn btn-primary" onClick={verify} disabled={loading || code.length < 6}>
              {loading && <span className="spinner" />}
              {loading ? 'Verifying…' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DelModal({ entry, onConfirm, onClose }) {
  const ref = useRef(null);
  useFocusTrap(ref);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={ref} style={{ maxWidth: 380 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete entry?</h2>
          <p className="modal-sub"><strong>{entry.site}</strong> will be permanently removed from your vault.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-surface" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* Inline SVG icons for onboarding — no emojis */
function IconShield() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function IconZap() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function IconBarChart() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function IconLayers() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
}

const SIDEBAR_FEATURES = [
  { Icon: IconShield, color: '#4f6bed', bg: 'rgba(79,107,237,.08)', title: 'AES-256 encryption', desc: 'Every entry encrypted before storage' },
  { Icon: IconZap,    color: '#059669', bg: 'rgba(16,185,129,.08)', title: 'One-click copy',      desc: 'Instantly copy any credential' },
  { Icon: IconBarChart, color: '#d97706', bg: 'rgba(217,119,6,.08)', title: 'Security audit',    desc: 'Detect weak & reused passwords' },
  { Icon: IconLayers, color: '#7c3aed', bg: 'rgba(124,58,237,.08)', title: 'All vault types',    desc: 'Passwords, cards, Wi-Fi, notes' },
];

const ONBOARDING_STEPS = [
  {
    stepNum: 1,
    tag: 'Get started',
    title: 'Save your first password',
    body: 'Add any login — email, bank, social account. CogniSafe encrypts it with AES-256 before it ever leaves your device.',
    bullets: ['Takes less than 10 seconds', 'Works for any website or app', 'Encrypted locally, never readable by us'],
    primary: 'Add password',
    skip: 'Skip for now',
  },
  {
    stepNum: 2,
    tag: 'Migrate',
    title: 'Import from your browser',
    body: 'Already using Chrome, Firefox, or Bitwarden? Bring everything over at once — no manual entry needed.',
    bullets: ['Supports Chrome & Firefox CSV export', 'Supports Bitwarden JSON format', 'Duplicates automatically skipped'],
    primary: 'Choose import file',
    skip: 'Skip this step',
  },
  {
    stepNum: 3,
    tag: 'Security',
    title: 'Enable two-factor auth',
    body: 'Add a second layer of protection. Even if your password leaks, nobody can access your vault without your device.',
    bullets: ['One-time code sent to your email', 'Recovery codes for emergencies', 'Trust devices for 30 days'],
    primary: 'Go to Account Settings',
    skip: 'Maybe later',
  },
];

function OnboardingWizard({ onAddFirst, onImportFile, onDone }) {
  const [step, setStep] = useState(0);
  const fileRef = useRef(null);
  const cur = ONBOARDING_STEPS[step];

  const handlePrimary = () => {
    if (step === 0) { onDone(); onAddFirst(); }
    else if (step === 1) { fileRef.current?.click(); }
    else { onDone(); window.location.href = '/account'; }
  };

  return (
    <div style={{ display: 'flex', gap: 24, padding: '32px 24px', alignItems: 'flex-start' }}>

      {/* ── Main panel ───────────────────────────────── */}
      <div style={{
        flex: '1 1 400px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', padding: '36px 40px',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
          {ONBOARDING_STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
              <button onClick={() => setStep(i)} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: i < step ? 'var(--brand)' : i === step ? 'var(--brand)' : 'var(--surface-3)',
                color: i <= step ? '#fff' : 'var(--text-3)',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: i === step ? '0 0 0 4px rgba(79,107,237,.18)' : 'none',
                transition: 'all .2s',
              }}>
                {i < step
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i + 1
                }
              </button>
              {i < 2 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 6px',
                  background: i < step ? 'var(--brand)' : 'var(--border-2)',
                  transition: 'background .3s',
                }} />
              )}
            </div>
          ))}
          <span style={{ marginLeft: 16, fontSize: 12, fontWeight: 600, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {step + 1} of 3
          </span>
        </div>

        {/* Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '4px 12px', borderRadius: 50, background: 'var(--accent-dim)', border: '1px solid rgba(79,107,237,.15)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: 'var(--brand)' }}>{cur.tag}</span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--text)', marginBottom: 10, lineHeight: 1.2 }}>{cur.title}</h2>
        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.75, marginBottom: 28 }}>{cur.body}</p>

        {/* Bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
          {cur.bullets.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-2)' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--success-dim)', border: '1.5px solid rgba(16,185,129,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontWeight: 500 }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {step > 0 && (
            <button className="btn btn-surface" onClick={() => setStep(s => s - 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
          )}
          <button className="btn btn-primary" onClick={handlePrimary} style={{ flex: 1, padding: '12px 20px', fontSize: 15 }}>
            {cur.primary}
          </button>
          <button className="btn btn-ghost" onClick={() => step < 2 ? setStep(s => s + 1) : onDone()} style={{ color: 'var(--text-3)', fontSize: 13 }}>
            {cur.skip}
          </button>
        </div>
      </div>

      {/* ── Sidebar ───────────────────────────────────── */}
      <div style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', overflow: 'hidden',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--grad-45)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,.6)', marginBottom: 4 }}>Included in your plan</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Everything you need</div>
        </div>

        {/* Feature rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {SIDEBAR_FEATURES.map(({ Icon, color, bg, title, desc }, i) => (
            <div key={title} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px',
              borderBottom: i < SIDEBAR_FEATURES.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color,
              }}>
                <Icon />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>End-to-end encrypted. We never see your data.</span>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".json,.csv,application/json,text/csv" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ''; }} />
    </div>
  );
}

/* Brand colours for letter-avatars */
const AVATAR_COLORS = [
  ['#4f6bed','#dde3fc'], ['#7c3aed','#ede9fe'], ['#059669','#d1fae5'],
  ['#d97706','#fef3c7'], ['#dc2626','#fee2e2'], ['#0891b2','#cffafe'],
  ['#be185d','#fce7f3'], ['#65a30d','#ecfccb'],
];
function avatarColor(name = '') {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

function SiteFavicon({ site, url }) {
  const [failed, setFailed] = useState(false);
  const letter = site?.trim()[0]?.toUpperCase() ?? '?';
  const [fg, bg] = avatarColor(site);

  const getDomain = () => {
    try {
      if (url) {
        const href = url.startsWith('http') ? url : `https://${url}`;
        return new URL(href).hostname;
      }
      const cleaned = site.toLowerCase().replace(/\s+/g, '');
      return cleaned + '.com';
    } catch { return null; }
  };
  const domain = getDomain();

  if (failed || !domain) {
    return (
      <div className="pw-card-icon" style={{ background: bg, color: fg, border: 'none' }}>
        {letter}
      </div>
    );
  }
  return (
    <div className="pw-card-icon" style={{ padding: 8 }}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt=""
        width={26} height={26}
        onError={() => setFailed(true)}
        style={{ display: 'block', width: 26, height: 26, objectFit: 'contain' }}
      />
    </div>
  );
}

function PwCard({ entry, onEdit, onDelete, onCopy }) {
  const [show, setShow] = useState(false);
  const external = entry.url ? (entry.url.startsWith('http') ? entry.url : `https://${entry.url}`) : null;
  const isNote = entry.type === 'note';
  const hasPw  = entry.password && entry.password.length > 0;
  const copyValue = isNote ? (entry.notes || '') : entry.password;

  const displayDomain = (() => {
    try {
      if (!entry.url) return null;
      const href = entry.url.startsWith('http') ? entry.url : `https://${entry.url}`;
      return new URL(href).hostname.replace(/^www\./, '');
    } catch { return null; }
  })();

  return (
    <div className="pw-card">
      <SiteFavicon site={entry.site} url={entry.url} />

      <div className="pw-card-info">
        <div className="pw-card-site">
          {entry.site}
          {entry.type && entry.type !== 'password' && (
            <span className={`type-badge ${entry.type}`}>{entry.type}</span>
          )}
        </div>
        {entry.username
          ? <div className="pw-card-user">{entry.username}</div>
          : isNote && <div className="pw-card-user" style={{ fontStyle: 'italic' }}>Secure note</div>
        }
        {displayDomain && <div className="pw-card-domain">{displayDomain}</div>}
      </div>

      {/* Password area */}
      <div className="pw-card-pw-area">
        {hasPw && (
          show
            ? <span className="pw-card-pw-revealed">{entry.password}</span>
            : <span>{'•'.repeat(Math.min(entry.password.length, 14))}</span>
        )}
        {isNote && entry.notes && (
          show
            ? <span className="pw-card-pw-revealed">{entry.notes.slice(0, 40)}</span>
            : <span>{'•'.repeat(10)}</span>
        )}
      </div>

      <div className="pw-card-actions">
        {(hasPw || isNote) && (
          <button className={`icon-btn ${show ? 'active' : ''}`} onClick={() => setShow(v => !v)} title={show ? 'Hide' : 'Reveal'}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        <button className="icon-btn" onClick={() => onCopy(copyValue)} title="Copy password"><Copy size={15} /></button>
        {external && <a className="icon-btn" href={external} target="_blank" rel="noreferrer" title="Open site"><LinkIcon size={15} /></a>}
        <button className="icon-btn" onClick={() => onEdit(entry)} title="Edit"><Edit size={15} /></button>
        <button className="icon-btn danger" onClick={() => onDelete(entry)} title="Delete"><Trash size={15} /></button>
      </div>
    </div>
  );
}

export default function Vault({ onLogout }) {
  const { user, toggle2FA } = useUser();
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [vaultLoad, setVaultLoad] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [delEntry, setDelEntry] = useState(null);
  const [opVerify, setOpVerify] = useState(null); // { action, onVerified }
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('cognisafe_onboarded'));
  const { toasts, add: toast } = useToast();
  const [searchParams] = useSearchParams();

  const dismissOnboarding = () => { localStorage.setItem('cognisafe_onboarded', '1'); setOnboarded(true); };

  const load = useCallback(() => {
    setVaultLoad(true);
    api.vault.list().then(setEntries).catch(err => toast(err.message || 'Failed to load vault', 'error')).finally(() => setVaultLoad(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const editId = Number(searchParams.get('edit'));
    if (!editId || !entries.length) return;
    const found = entries.find(e => e.id === editId);
    if (found) { setEditEntry(found); setShowModal(true); }
  }, [searchParams, entries]);

  const handleToggle2FA = async () => {
    try {
      const next = await toggle2FA();
      toast(next ? '2FA enabled' : '2FA disabled', 'info');
    } catch (err) {
      toast(err.message || 'Failed to update 2FA', 'error');
    }
  };

  const handleSave = async (data) => {
    if (editEntry) {
      const updated = await api.vault.update(editEntry.id, data);
      setEntries(p => p.map(e => e.id === editEntry.id ? updated : e));
      toast('Entry updated');
    } else {
      const created = await api.vault.add(data);
      setEntries(p => [created, ...p]);
      toast('Entry added to vault');
    }
    setShowModal(false);
    setEditEntry(null);
  };

  const handleDelete = () => {
    setOpVerify({
      action: `delete "${delEntry.site}"`,
      onVerified: async () => {
        await api.vault.delete(delEntry.id);
        setEntries(p => p.filter(e => e.id !== delEntry.id));
        setDelEntry(null);
        setOpVerify(null);
        toast('Entry deleted');
      },
    });
  };

  const handleCopy = (pw) => {
    copyWithAutoClear(pw, () => toast('Password copied (auto-clears in 30s)'), () => toast('Copy failed', 'error'));
  };

  const handleExport = () => {
    setOpVerify({
      action: 'export vault',
      onVerified: async () => {
        setOpVerify(null);
        try {
          const data = await api.vault.export();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `cognisafe-export-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
          toast('Vault exported');
        } catch (err) {
          toast(err.message || 'Export failed', 'error');
        }
      },
    });
  };

  const parseImportFile = (text, fileName) => {
    // CSV (Chrome / Firefox / Bitwarden CSV)
    if (fileName.endsWith('.csv') || text.trimStart().toLowerCase().startsWith('name,') || text.trimStart().toLowerCase().startsWith('"name",')) {
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      return lines.slice(1).map(line => {
        const fields = [];
        let cur = '', inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
          else { cur += ch; }
        }
        fields.push(cur);
        const row = {};
        headers.forEach((h, i) => { row[h] = (fields[i] ?? '').replace(/^"|"$/g, '').trim(); });
        return { site: row.name || row.title || row.site || '', username: row.username || row.email || '', password: row.password || '', url: row.url || row.uri || '' };
      }).filter(r => r.site && r.username && r.password);
    }
    // JSON formats
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      // CogniSafe plain array or Firefox JSON export
      return parsed.map(r => ({ site: r.site || r.hostname || r.name || '', username: r.username || '', password: r.password || '', url: r.url || r.uri || '' }));
    }
    if (parsed.entries) return parsed.entries; // CogniSafe export format
    if (parsed.items) {
      // Bitwarden JSON
      return parsed.items.filter(i => i.type === 1).map(i => ({
        site: i.name || '',
        username: i.login?.username || '',
        password: i.login?.password || '',
        url: i.login?.uris?.[0]?.uri || '',
      }));
    }
    throw new Error('Unrecognised file format. Supports: Chrome/Firefox/Bitwarden CSV, Bitwarden JSON, CogniSafe JSON.');
  };

  const handleImport = async (file) => {
    const text = await file.text();
    const rows = parseImportFile(text, file.name);
    if (!rows.length) throw new Error('No valid entries found in the file.');
    const result = await api.vault.import(rows);
    toast(`Imported ${result.imported} entries${result.skipped ? ` · ${result.skipped} skipped` : ''}`);
    load();
  };

  // Keyboard shortcuts: / = focus search, n = new entry, Esc = close modal
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      if (e.key === 'Escape') {
        if (showModal) { setShowModal(false); setEditEntry(null); }
        if (delEntry) setDelEntry(null);
        return;
      }
      if (inInput) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setEditEntry(null);
        setShowModal(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showModal, delEntry]);

  const filtered = entries.filter(e => !search || e.site?.toLowerCase().includes(search.toLowerCase()) || e.username?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell email={user?.email} twoFAEnabled={user?.twoFactorEnabled} onToggle2FA={handleToggle2FA} onLogout={onLogout} topbarRight={<button className="btn btn-primary btn-sm" onClick={() => { setEditEntry(null); setShowModal(true); }}><Plus size={14} /> Add password</button>}>
      <div className="vault-toolbar">
        <div className="search-wrap"><Search /><input className="search-input" type="search" placeholder="Search vault…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <label className="btn btn-surface" style={{ cursor: 'pointer' }} title="Import from Chrome, Firefox, Bitwarden CSV/JSON">
          Import
          <input type="file" accept=".json,.csv,application/json,text/csv" style={{ display: 'none' }} onChange={async (e) => {
            try {
              const f = e.target.files?.[0];
              if (f) await handleImport(f);
            } catch (err) {
              toast(err.message || 'Import failed', 'error');
            } finally {
              e.target.value = '';
            }
          }} />
        </label>
        <button className="btn btn-surface" onClick={handleExport}>Export</button>
      </div>

      {vaultLoad
        ? <div style={{ textAlign: 'center', padding: '80px' }}><span className="spinner" style={{ width: 32, height: 32, display: 'block', margin: '0 auto' }} /></div>
        : !onboarded && entries.length === 0 && !search
          ? <OnboardingWizard
              onAddFirst={() => { setEditEntry(null); setShowModal(true); }}
              onImportFile={async (f) => { try { await handleImport(f); dismissOnboarding(); } catch (err) { toast(err.message || 'Import failed', 'error'); } }}
              onDone={dismissOnboarding}
            />
          : filtered.length === 0
            ? <div className="empty-state"><span className="empty-icon"><DatabaseIcon size={64} /></span><h3>{search ? 'No results found' : 'Your vault is empty'}</h3><p>{search ? `No entries matching "${search}"` : 'Add your first password to get started.'}</p></div>
            : <div className="pw-grid">{filtered.map(entry => <PwCard key={entry.id} entry={entry} onEdit={(e) => { setEditEntry(e); setShowModal(true); }} onDelete={e => setDelEntry(e)} onCopy={handleCopy} />)}</div>
      }

      {showModal && <PwModal entry={editEntry} onSave={handleSave} onClose={() => { setShowModal(false); setEditEntry(null); }} />}
      {delEntry && !opVerify && <DelModal entry={delEntry} onClose={() => setDelEntry(null)} onConfirm={handleDelete} />}
      {opVerify && <OpVerifyModal action={opVerify.action} onVerified={opVerify.onVerified} onClose={() => { setOpVerify(null); setDelEntry(null); }} />}

      <div className="toasts">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div>
    </AppShell>
  );
}

function Eye({ size = 18 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOff({ size = 18 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function Copy({ size = 18 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function Edit({ size = 18 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function Trash({ size = 18 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function Plus({ size = 16 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function Refresh({ size = 16 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>; }
function Search({ size = 15 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function LinkIcon({ size = 16 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L11.94 5"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07L12.06 19"/></svg>; }
