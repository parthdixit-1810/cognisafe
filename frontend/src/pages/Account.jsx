import { useState, useCallback, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { useUser } from '../hooks/useUser';
import { api } from '../api';

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function Eye({ size = 18 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOff({ size = 18 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function DownloadIcon({ size = 16 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function TrashIcon({ size = 14 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function MonitorIcon({ size = 16 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function CrownIcon({ size = 14 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2 19h20l-2-10-5 5-3-8-3 8-5-5z"/></svg>; }
function ExternalLinkIcon({ size = 13 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>; }

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 12 }}>{title}</h2>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {children}
      </div>
    </section>
  );
}

function Row({ children, noBorder }) {
  return (
    <div style={{ padding: '20px 24px', borderBottom: noBorder ? 'none' : '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

export default function Account({ onLogout }) {
  const { user, loading: userLoading, toggle2FA } = useUser();
  const { toasts, add: toast } = useToast();

  /* ── Change password ─────────────────────────────────────────── */
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [pwError, setPwError]   = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) return setPwError('New passwords do not match.');
    if (newPw.length < 8) return setPwError('New password must be at least 8 characters.');
    setPwLoading(true);
    try {
      await api.auth.changePassword(currentPw, newPw);
      toast('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPwForm(false);
    } catch (err) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  /* ── Export data ─────────────────────────────────────────────── */
  const [exportLoading, setExportLoading] = useState(false);
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const entries = await api.vault.list();
      const payload = { entries, exportedAt: new Date().toISOString(), email: user?.email };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cognisafe-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Vault exported successfully.');
    } catch (err) {
      toast(err.message || 'Export failed.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  /* ── Recovery codes ─────────────────────────────────────────── */
  const [recoveryStatus, setRecoveryStatus] = useState(null);
  const [newCodes, setNewCodes] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.auth.recoveryStatus().then(setRecoveryStatus).catch(() => {});
  }, []);

  const handleGenerateCodes = async () => {
    setGenerating(true);
    try {
      const data = await api.auth.generateRecovery();
      setNewCodes(data.codes);
      setRecoveryStatus({ total: data.codes.length, unused: data.codes.length });
      toast('Recovery codes generated. Download them now — they won\'t be shown again.');
    } catch (err) {
      toast(err.message || 'Failed to generate recovery codes.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCodes = () => {
    if (!newCodes) return;
    const text = `CogniSafe Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes safe. Each can only be used once.\n\n${newCodes.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cognisafe-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ── Trusted devices ─────────────────────────────────────────── */
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    api.auth.listDevices().then(d => setDevices(d.devices || [])).catch(() => {}).finally(() => setDevicesLoading(false));
  }, []);

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      await api.auth.revokeDevice(id);
      setDevices(prev => prev.filter(d => d.id !== id));
      toast('Device revoked.');
    } catch (err) {
      toast(err.message || 'Failed to revoke device.', 'error');
    } finally {
      setRevoking(null);
    }
  };

  /* ── Billing ────────────────────────────────────────────────── */
  const [billingStatus, setBillingStatus] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    api.billing.status().then(setBillingStatus).catch(() => {});
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { url } = await api.billing.checkout();
      window.location.href = url;
    } catch (err) {
      toast(err.message || 'Failed to start checkout.', 'error');
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await api.billing.portal();
      window.location.href = url;
    } catch (err) {
      toast(err.message || 'Failed to open billing portal.', 'error');
      setPortalLoading(false);
    }
  };

  const isPro = billingStatus?.plan === 'pro';
  const planExpiry = billingStatus?.planExpiresAt
    ? new Date(billingStatus.planExpiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  /* ── Delete account ──────────────────────────────────────────── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState('');
  const [deleteLoading, setDeleteLoading]     = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) return;
    setDeleteLoading(true);
    try {
      await api.auth.deleteAccount();
      onLogout();
    } catch (err) {
      toast(err.message || 'Failed to delete account.', 'error');
      setDeleteLoading(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <AppShell email={user?.email} twoFAEnabled={user?.twoFactorEnabled} onToggle2FA={toggle2FA} onLogout={onLogout}>
      <div style={{ maxWidth: 580 }}>

        {/* ── Account Info ─────────────────────────── */}
        <Section title="Account">
          <Row noBorder>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'var(--grad-45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.email}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPro ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 50 }}>
                      <CrownIcon size={10} /> Pro
                    </span>
                  ) : (
                    <span>Free plan</span>
                  )}
                  {joinedDate && <span>· Member since {joinedDate}</span>}
                </div>
              </div>
            </div>
          </Row>
        </Section>

        {/* ── Plan & Billing ───────────────────────── */}
        <Section title="Plan &amp; Billing">
          <Row noBorder>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPro ? (
                    <>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', padding: '2px 9px', borderRadius: 50 }}>
                        <CrownIcon size={10} /> Pro
                      </span>
                      Active subscription
                    </>
                  ) : (
                    'Free plan'
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                  {isPro
                    ? planExpiry ? `Renews ${planExpiry}` : 'Your subscription is active'
                    : 'Upgrade to unlock unlimited entries, all vault types, and more'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {isPro ? (
                  <button className="btn btn-surface btn-sm" onClick={handlePortal} disabled={portalLoading}>
                    {portalLoading && <span className="spinner" style={{ width: 13, height: 13 }} />}
                    <ExternalLinkIcon size={13} />
                    {portalLoading ? 'Opening…' : 'Manage subscription'}
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={handleCheckout} disabled={checkoutLoading}>
                    {checkoutLoading && <span className="spinner" style={{ width: 13, height: 13 }} />}
                    <CrownIcon size={12} />
                    {checkoutLoading ? 'Redirecting…' : 'Upgrade to Pro — $4.99/mo'}
                  </button>
                )}
              </div>
            </div>
          </Row>
        </Section>

        {/* ── Security ─────────────────────────────── */}
        <Section title="Security">
          <Row>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Master password</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Change your vault login password</div>
              </div>
              <button className="btn btn-surface btn-sm" onClick={() => setShowPwForm(v => !v)}>
                {showPwForm ? 'Cancel' : 'Change'}
              </button>
            </div>

            {showPwForm && (
              <form onSubmit={handleChangePassword} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pwError && <div className="alert alert-error">{pwError}</div>}

                <div className="field">
                  <label className="field-label">Current password</label>
                  <div className="input-wrap">
                    <input className="field-input" type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} required autoComplete="current-password" />
                    <button type="button" className="input-icon-btn right-1" onClick={() => setShowCurrent(v => !v)} aria-label="Toggle">{showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">New password</label>
                  <div className="input-wrap">
                    <input className="field-input" type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} required autoComplete="new-password" placeholder="At least 8 characters" />
                    <button type="button" className="input-icon-btn right-1" onClick={() => setShowNew(v => !v)} aria-label="Toggle">{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Confirm new password</label>
                  <input className="field-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required autoComplete="new-password" />
                </div>

                <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ alignSelf: 'flex-start' }}>
                  {pwLoading && <span className="spinner" />}
                  {pwLoading ? 'Saving…' : 'Update password'}
                </button>
              </form>
            )}
          </Row>

          <Row noBorder>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Two-factor authentication</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                  {user?.twoFactorEnabled ? 'Enabled — an OTP is required at login' : 'Disabled — enable for stronger account protection'}
                </div>
              </div>
              <label className="switch" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={!!user?.twoFactorEnabled} onChange={async () => {
                  try {
                    await toggle2FA();
                    toast(`2FA ${user?.twoFactorEnabled ? 'disabled' : 'enabled'}.`);
                  } catch (err) {
                    toast(err.message || 'Failed to toggle 2FA.', 'error');
                  }
                }} />
                <span className="switch-track" />
              </label>
            </div>
          </Row>
        </Section>

        {/* ── Recovery Codes ───────────────────────── */}
        <Section title="Recovery Codes">
          <Row noBorder>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Emergency recovery codes</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                  {recoveryStatus
                    ? `${recoveryStatus.unused} of ${recoveryStatus.total} codes remaining`
                    : 'Use these if you lose access to your 2FA email'}
                </div>
                {newCodes && (
                  <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {newCodes.map(c => (
                      <code key={c} style={{ fontSize: 13, letterSpacing: '.05em', color: 'var(--text)' }}>{c}</code>
                    ))}
                    <button className="btn btn-surface btn-sm" style={{ marginTop: 10, alignSelf: 'flex-start' }} onClick={downloadCodes}>
                      <DownloadIcon size={13} /> Download codes
                    </button>
                  </div>
                )}
              </div>
              <button className="btn btn-surface btn-sm" onClick={handleGenerateCodes} disabled={generating} style={{ flexShrink: 0 }}>
                {generating && <span className="spinner" style={{ width: 13, height: 13 }} />}
                {generating ? 'Generating…' : newCodes ? 'Regenerate' : 'Generate codes'}
              </button>
            </div>
          </Row>
        </Section>

        {/* ── Trusted Devices ──────────────────────── */}
        <Section title="Trusted Devices">
          {devicesLoading ? (
            <Row noBorder><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Loading…</span></Row>
          ) : devices.length === 0 ? (
            <Row noBorder>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                No trusted devices yet. Check "Trust this device for 30 days" when signing in with 2FA.
              </span>
            </Row>
          ) : devices.map((d, i) => (
            <Row key={d.id} noBorder={i === devices.length - 1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: 'var(--text-2)', flexShrink: 0 }}><MonitorIcon size={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.deviceName || 'Unknown device'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    Added {new Date(d.createdAt).toLocaleDateString()} · Expires {new Date(d.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <button className="btn btn-surface btn-sm" onClick={() => handleRevoke(d.id)} disabled={revoking === d.id} style={{ flexShrink: 0 }}>
                  {revoking === d.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <TrashIcon size={12} />}
                  Revoke
                </button>
              </div>
            </Row>
          ))}
        </Section>

        {/* ── Data & Privacy ────────────────────────── */}
        <Section title="Data &amp; Privacy">
          <Row noBorder>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Export vault data</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Download an encrypted JSON backup of all your entries</div>
              </div>
              <button className="btn btn-surface btn-sm" onClick={handleExport} disabled={exportLoading}>
                {exportLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <DownloadIcon size={14} />}
                {exportLoading ? 'Exporting…' : 'Export'}
              </button>
            </div>
          </Row>
        </Section>

        {/* ── Danger Zone ───────────────────────────── */}
        <Section title="Danger Zone">
          <Row noBorder>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--danger)' }}>Delete account</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Permanently delete your account and all vault data. This cannot be undone.</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>Delete</button>
            </div>
          </Row>
        </Section>

      </div>

      {/* ── Delete confirmation modal ─────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete account?</h2>
              <p className="modal-sub">This will permanently delete your account and all {' '}<strong>vault entries</strong>. There is no undo.</p>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label">Type your email to confirm: <strong style={{ color: 'var(--text)' }}>{user?.email}</strong></label>
                <input
                  className="field-input"
                  type="email"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={user?.email}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-surface" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={deleteConfirm !== user?.email || deleteLoading}
                onClick={handleDeleteAccount}
              >
                {deleteLoading && <span className="spinner" />}
                {deleteLoading ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toasts">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div>
    </AppShell>
  );
}
