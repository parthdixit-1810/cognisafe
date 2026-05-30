import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LockIcon, KeyIcon, ShieldIcon, MailIcon } from './Icons';

function HomeIcon({ size = 17 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function SettingsIcon({ size = 17 }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }

const NAV = [
  { path: '/dashboard', icon: <HomeIcon size={17} />,    label: 'Dashboard' },
  { path: '/vault',     icon: <LockIcon size={17} />,    label: 'My Vault' },
  { path: '/generator', icon: <KeyIcon size={17} />,     label: 'Generator' },
  { path: '/audit',     icon: <ShieldIcon size={17} />,  label: 'Security Audit' },
  { path: '/account',   icon: <SettingsIcon size={17} />, label: 'Account Settings' },
];

export default function AppShell({ children, onLogout, email, twoFAEnabled, onToggle2FA, topbarRight }) {
  const [open, setOpen] = useState(false);
  const navigate        = useNavigate();
  const { pathname }    = useLocation();
  const initial         = email ? email[0].toUpperCase() : '?';
  const currentNav      = NAV.find(n => n.path === pathname);
  const currentTitle    = currentNav?.label ?? 'CogniSafe';
  const currentIcon     = currentNav?.icon;

  const go = (path) => { navigate(path); setOpen(false); };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <img src="/cognisafe-logo.jpg" className="sidebar-logo-img" alt="CogniSafe" />
        </Link>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Menu</span>

          {NAV.map(n => (
            <button
              key={n.path}
              className={`sidebar-item ${pathname === n.path ? 'active' : ''}`}
              onClick={() => go(n.path)}
            >
              <span className="sidebar-item-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: 16 }}>Account</span>

          <div className="sidebar-2fa">
            <span className="sidebar-2fa-icon"><MailIcon size={17} /></span>
            <span className="sidebar-2fa-label">Two-Factor Auth</span>
            <label className="switch" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={!!twoFAEnabled} onChange={onToggle2FA} />
              <span className="switch-track" />
            </label>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-user" onClick={onLogout}>
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-email">{email || '—'}</div>
              <div className="sidebar-user-hint">Click to sign out</div>
            </div>
            <LogoutIcon size={15} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-content">
        <div className="app-topbar">
          <button className="menu-btn" onClick={() => setOpen(v => !v)} aria-label="Toggle sidebar">
            <MenuIcon />
          </button>
          <div className="app-topbar-title">
            {currentIcon && <span className="app-topbar-icon">{currentIcon}</span>}
            {currentTitle}
          </div>
          {topbarRight}
        </div>

        <div className="app-body">{children}</div>
      </main>
    </div>
  );
}

function LogoutIcon({ size = 18 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function MenuIcon({ size = 20 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
