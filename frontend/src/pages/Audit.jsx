import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useUser } from '../hooks/useUser';
import { api } from '../api';
import { ShieldIcon } from '../components/Icons';
import { checkPasswordBreached } from '../utils/password';

function analyzeVault(entries, breachedSet) {
  const issues = [];
  const pwMap = {};

  entries.forEach(e => {
    const pw = e.password ?? '';
    if (pw.length < 8) issues.push({ severity: 'high', title: 'Very short password', sub: 'Under 8 characters.', site: e.site, id: e.id });
    else if (pw.length < 12) issues.push({ severity: 'medium', title: 'Short password', sub: '8–11 characters.', site: e.site, id: e.id });
    if (!/[A-Z]/.test(pw)) issues.push({ severity: 'medium', title: 'No uppercase letter', sub: 'Add uppercase letters.', site: e.site, id: e.id });
    if (!/[0-9]/.test(pw)) issues.push({ severity: 'medium', title: 'No number', sub: 'Add numbers.', site: e.site, id: e.id });
    if (!/[^A-Za-z0-9]/.test(pw)) issues.push({ severity: 'medium', title: 'No symbol', sub: 'Add special characters.', site: e.site, id: e.id });
    if (breachedSet.has(e.id)) issues.push({ severity: 'high', title: 'Found in breach database', sub: 'This password appears in known leaks.', site: e.site, id: e.id });
    if (!pwMap[pw]) pwMap[pw] = [];
    pwMap[pw].push(e);
  });

  Object.values(pwMap).forEach(group => {
    if (group.length > 1) {
      group.forEach(e => {
        issues.push({ severity: 'high', title: 'Reused password', sub: `Used on ${group.length} sites.`, site: e.site, id: e.id });
      });
    }
  });

  return issues;
}

function calcScore(entries, issues) {
  if (!entries.length) return 100;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  return Math.max(0, 100 - (high * 9 + medium * 3));
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, add };
}

export default function Audit({ onLogout }) {
  const { user, toggle2FA } = useUser();
  const { toasts, add: toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breachedSet, setBreachedSet] = useState(new Set());
  const [checkingBreach, setCheckingBreach] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.vault.list().then(setEntries).catch(err => toast(err.message || 'Failed to load vault', 'error')).finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!entries.length) return;
      setCheckingBreach(true);
      const breached = new Set();
      for (const e of entries.slice(0, 20)) {
        const bad = await checkPasswordBreached(e.password);
        if (bad) breached.add(e.id);
      }
      if (!cancelled) setBreachedSet(breached);
      if (!cancelled) setCheckingBreach(false);
    };
    run();
    return () => { cancelled = true; };
  }, [entries]);

  const handleToggle2FA = async () => {
    try { const next = await toggle2FA(); toast(next ? '2FA enabled' : '2FA disabled', 'info'); }
    catch (err) { toast(err.message || 'Failed to update 2FA', 'error'); }
  };

  const issues = analyzeVault(entries, breachedSet);
  const score = calcScore(entries, issues);
  const uniqueIssues = issues.filter((v, i, a) => a.findIndex(t => t.id === v.id && t.title === v.title) === i);

  return (
    <AppShell email={user?.email} twoFAEnabled={user?.twoFactorEnabled} onToggle2FA={handleToggle2FA} onLogout={onLogout}>
      {loading ? <div style={{ textAlign: 'center', padding: 80 }}><span className="spinner" style={{ width: 32, height: 32, display: 'block', margin: '0 auto' }} /></div> : entries.length === 0 ? (
        <div className="empty-state"><span className="empty-icon"><ShieldIcon size={64} /></span><h3>No passwords to audit</h3><p>Add passwords to your vault to see your security score.</p></div>
      ) : (
        <>
          <div className="audit-score-card">
            <div className="audit-score-num" style={{ color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{score}</div>
            <div className="audit-score-lbl">Security Score</div>
            <div className="audit-score-desc">{entries.length} passwords analysed {checkingBreach && '· checking breach database...'}</div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            {uniqueIssues.length === 0 ? '✅ No issues found — great job!' : `${uniqueIssues.length} issue${uniqueIssues.length > 1 ? 's' : ''} found`}
          </h3>

          <div className="audit-issues">
            {uniqueIssues.map((issue, i) => (
              <div key={i} className="audit-issue">
                <div className={`issue-dot ${issue.severity === 'high' ? 'high' : 'medium'}`} />
                <div className="issue-info">
                  <div className="issue-title">{issue.title}</div>
                  <div className="issue-site">{issue.site}</div>
                  <div className="issue-sub">{issue.sub}</div>
                </div>
                <button className="btn btn-sm btn-surface" onClick={() => navigate(`/vault?edit=${issue.id}`)}>Fix</button>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="toasts">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div>
    </AppShell>
  );
}
