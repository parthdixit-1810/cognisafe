import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useUser } from '../hooks/useUser';
import { api } from '../api';
import { ShieldIcon, KeyIcon, LockIcon, MailIcon } from '../components/Icons';

function quickScore(entries) {
  if (!entries.length) return 100;
  let issues = 0;
  const seen = {};
  entries.forEach(e => {
    const pw = e.password ?? '';
    if (pw.length < 12) issues++;
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) issues++;
    if (seen[pw]) issues += 2;
    seen[pw] = true;
  });
  return Math.max(0, Math.min(100, 100 - issues * 8));
}

export default function Dashboard({ onLogout }) {
  const { user, toggle2FA } = useUser();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.vault.list()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const score = quickScore(entries);
  const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <AppShell
      email={user?.email}
      twoFAEnabled={user?.twoFactorEnabled}
      onToggle2FA={toggle2FA}
      onLogout={onLogout}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 32, height: 32, display: 'block', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          <div className="audit-score-card" style={{ marginBottom: 24 }}>
            <div className="audit-score-num" style={{ color: scoreColor }}>{score}</div>
            <div className="audit-score-lbl">Vault health</div>
            <div className="audit-score-desc">
              {entries.length} saved {entries.length === 1 ? 'password' : 'passwords'}
              {!user?.twoFactorEnabled && ' · Enable 2FA for stronger protection'}
            </div>
          </div>

          <div className="audit-grid" style={{ marginBottom: 28 }}>
            <Link to="/vault" className="audit-mini" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="audit-mini-num" style={{ color: 'var(--brand-light)' }}><LockIcon size={28} /></div>
              <div className="audit-mini-lbl">My Vault</div>
            </Link>
            <Link to="/generator" className="audit-mini" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="audit-mini-num" style={{ color: 'var(--brand-light)' }}><KeyIcon size={28} /></div>
              <div className="audit-mini-lbl">Generator</div>
            </Link>
            <Link to="/audit" className="audit-mini" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="audit-mini-num" style={{ color: 'var(--brand-light)' }}><ShieldIcon size={28} /></div>
              <div className="audit-mini-lbl">Security audit</div>
            </Link>
          </div>

          {!user?.twoFactorEnabled && (
            <div className="alert alert-info" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <MailIcon size={18} />
              <span style={{ flex: 1, fontSize: 14 }}>
                Two-factor authentication is off — enable it for stronger account protection.
              </span>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/account')}>
                Enable 2FA
              </button>
            </div>
          )}

          {entries.length > 0 ? (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 12 }}>Recent entries</h3>
              <div className="pw-grid">
                {entries.slice(0, 3).map(e => (
                  <div key={e.id} className="pw-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/vault?edit=${e.id}`)}>
                    <div className="pw-card-icon">{e.site?.[0]?.toUpperCase() ?? '?'}</div>
                    <div className="pw-card-info">
                      <div className="pw-card-site">{e.site}</div>
                      <div className="pw-card-user">{e.username}</div>
                    </div>
                  </div>
                ))}
              </div>
              {entries.length > 3 && (
                <Link to="/vault" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--brand-light)' }}>
                  View all {entries.length} entries →
                </Link>
              )}
            </>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '28px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Your vault is empty</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Save your first password to start tracking your vault health.</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/vault" className="btn btn-primary btn-sm">Add first password</Link>
                <Link to="/vault" className="btn btn-surface btn-sm">Import from browser</Link>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
