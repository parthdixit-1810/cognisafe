import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { LockIcon, KeyIcon, ShieldIcon, MailIcon, EyeOffIcon, CheckCircleIcon } from '../components/Icons';
import { useScrollReveal } from '../hooks/useScrollReveal';

const OFFERINGS = [
  {
    icon: <LockIcon size={28} />,
    title: 'Encrypted Password Vault',
    desc: 'Your central hub for every login. Every entry is encrypted with AES-256-CBC before storage — not even we can read it.',
    bullets: ['Add, edit, and delete entries instantly', 'One-click copy to clipboard', 'Show/hide passwords on demand', 'Search and filter in real time'],
  },
  {
    icon: <KeyIcon size={28} />,
    title: 'Secure Password Generator',
    desc: 'Stop reusing weak passwords. Our cryptographic generator creates unique, unguessable credentials tailored to your needs.',
    bullets: ['Adjustable length: 8–64 characters', 'Toggle uppercase, lowercase, numbers, symbols', 'Visual strength meter', 'Save directly to your vault'],
  },
  {
    icon: <ShieldIcon size={28} />,
    title: 'Security Audit Engine',
    desc: 'Know your exposure before attackers do. The audit engine scans your vault and flags vulnerabilities automatically.',
    bullets: ['Detects weak and short passwords', 'Flags duplicate passwords across sites', 'Live security score (0–100)', 'Actionable fix recommendations'],
  },
  {
    icon: <MailIcon size={28} />,
    title: 'Two-Factor Authentication',
    desc: 'Even if someone gets your master password, 2FA stops them. A one-time code is sent to your email before access is granted.',
    bullets: ['Email-based OTP (6-digit codes)', 'Codes expire in 10 minutes', 'Enable or disable anytime in settings', 'SHA-256 hashed code storage'],
  },
  {
    icon: <EyeOffIcon size={28} />,
    title: 'Google OAuth Login',
    desc: 'Prefer to sign in with Google? CogniSafe supports OAuth 2.0 so you can authenticate without creating a separate password.',
    bullets: ['Sign in with your Google account', 'No extra password to remember', 'Verified via Google Identity Services', 'Seamless account creation on first use'],
  },
  {
    icon: <CheckCircleIcon size={28} />,
    title: 'Zero-Knowledge Architecture',
    desc: 'Your master password is never transmitted or stored — only its bcrypt hash lives on our servers. Encryption happens locally.',
    bullets: ['bcrypt password hashing (cost factor 10)', 'AES-256 key derived from your env secret', 'No plaintext credentials stored', 'Encrypted before network transit'],
  },
];

const COMPARISON = [
  { feat: 'Encrypted vault storage',     cs: true,  basic: true  },
  { feat: 'Password generator',          cs: true,  basic: false },
  { feat: 'Security audit & score',      cs: true,  basic: false },
  { feat: 'Two-factor authentication',   cs: true,  basic: false },
  { feat: 'Google OAuth login',          cs: true,  basic: false },
  { feat: 'Zero-knowledge encryption',   cs: true,  basic: false },
  { feat: 'AES-256-CBC per-entry',        cs: true,  basic: false },
  { feat: 'Clipboard copy & reveal',     cs: true,  basic: true  },
];

export default function Features({ isAuth }) {
  useScrollReveal();
  return (
    <div>
      <Navbar isAuth={isAuth} />

      {/* Hero */}
      <div className="feat-page-hero">
        <div className="hero-badge" style={{ margin: '0 auto 20px' }}>
          <span className="hero-badge-dot" />
          Full feature breakdown
        </div>
        <h1><span className="grad-text">Everything CogniSafe offers</span></h1>
        <p>Security tools designed to be powerful yet approachable — for individuals, developers, and teams alike.</p>
      </div>

      {/* Feature detail cards */}
      <section className="page-section">
        <div className="page-section-inner">
          <div className="section-header">
            <span className="section-eyebrow">Our Services</span>
            <h2 className="section-title">What's included</h2>
            <p className="section-desc">Every feature is available free. No paywalls, no trials.</p>
          </div>
          <div className="feat-detail-grid">
            {OFFERINGS.map((o, i) => (
              <div key={i} className={`feat-detail-card reveal reveal-d${(i % 2) + 1}`}>
                <div className="feat-detail-icon">{o.icon}</div>
                <h3>{o.title}</h3>
                <p>{o.desc}</p>
                <ul>
                  {o.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="page-section dark-bg">
        <div className="page-section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Comparison</span>
            <h2 className="section-title">CogniSafe vs basic password managers</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 20px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 600 }}>Feature</th>
                  <th style={{ textAlign: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)', color: '#93c5fd', fontWeight: 700 }}>CogniSafe</th>
                  <th style={{ textAlign: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontWeight: 600 }}>Basic Managers</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text)' }}>{r.feat}</td>
                    <td style={{ textAlign: 'center', padding: '14px 20px' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '18px' }}>✓</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 20px' }}>
                      {r.basic
                        ? <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '18px' }}>✓</span>
                        : <span style={{ color: 'var(--text-3)', fontSize: '18px' }}>–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <h2 className="cta-band-title">
          Ready to protect your<br />
          <span className="grad-text">digital identity?</span>
        </h2>
        <p className="cta-band-desc">
          All features, always free. No account limits. Start in under 30 seconds.
        </p>
        <div className="cta-band-actions">
          {isAuth ? (
            <Link to="/vault" className="btn btn-primary btn-lg">Go to My Vault</Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account</Link>
              <Link to="/login"  className="btn btn-ghost btn-lg">Sign In</Link>
            </>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/cognisafe-logo.jpg" className="footer-logo-img" alt="CogniSafe" />
        </div>
        <span className="footer-copy">© 2025 CogniSafe</span>
        <div className="footer-links">
          <Link to="/"       className="footer-link">Home</Link>
          <Link to="/login"  className="footer-link">Sign In</Link>
          <Link to="/signup" className="footer-link">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}
