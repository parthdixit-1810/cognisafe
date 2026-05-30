import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { LockIcon, KeyIcon, MailIcon, ShieldIcon, ZapIcon, EyeOffIcon, CheckCircleIcon, GitHubBrandIcon, AWSBrandIcon, StripeBrandIcon } from '../components/Icons';
import { useScrollReveal } from '../hooks/useScrollReveal';

const FEATURES = [
  { icon: <LockIcon size={24} />,      title: 'AES-256 Vault',       desc: 'Every password is encrypted with military-grade AES-256-CBC before it ever leaves your device.' },
  { icon: <KeyIcon size={24} />,       title: 'Password Generator',  desc: 'Create cryptographically secure passwords up to 64 characters with custom character sets.' },
  { icon: <MailIcon size={24} />,      title: 'Two-Factor Auth',     desc: 'Add an extra layer of protection with email-based 2FA — no authenticator app needed.' },
  { icon: <ShieldIcon size={24} />,    title: 'Security Audit',      desc: 'Automatically detect weak, reused, or short passwords across your entire vault.' },
  { icon: <ZapIcon size={24} />,       title: 'Instant Copy',        desc: 'One-click clipboard copy. No need to reveal your password to use it.' },
  { icon: <EyeOffIcon size={24} />,    title: 'Zero-Knowledge',      desc: 'We never see your master password. Your data is yours — always.' },
];

const STEPS = [
  { n: '1', title: 'Create your account',  desc: 'Sign up in seconds with just your email. No credit card, no setup fees.' },
  { n: '2', title: 'Add your passwords',   desc: 'Import existing passwords or add new ones. Our generator creates unbreakable credentials instantly.' },
  { n: '3', title: 'Stay secure forever',  desc: 'Every entry is encrypted end-to-end. Audit your vault health at any time.' },
];

const SECURITY = [
  { icon: <LockIcon size={20} />,        title: 'AES-256-CBC Encryption',      desc: 'Military-grade encryption for every stored password' },
  { icon: <EyeOffIcon size={20} />,      title: 'Zero-Knowledge Architecture', desc: 'We never have access to your unencrypted data' },
  { icon: <MailIcon size={20} />,        title: 'Two-Factor Authentication',   desc: 'Email OTP as an optional but powerful security layer' },
  { icon: <CheckCircleIcon size={20} />, title: 'bcrypt Password Hashing',     desc: 'Your master password is hashed, never stored in plain text' },
];

const MOCKUP_ROWS = [
  {
    icon: <GitHubBrandIcon size={18} />,
    iconBg: '#161B22', iconColor: '#f0f6ff',
    site: 'GitHub', siteColor: '#f0f6ff',
    user: 'dev@myapp.com',
  },
  {
    icon: <AWSBrandIcon size={18} />,
    iconBg: '#232F3E', iconColor: '#FF9900',
    site: 'Amazon AWS', siteColor: '#FF9900',
    user: 'admin@company.com',
  },
  {
    icon: <StripeBrandIcon size={18} />,
    iconBg: '#0A2540', iconColor: '#635BFF',
    site: 'Stripe', siteColor: '#625EFF',
    user: 'billing@startup.io',
  },
];

export default function Home({ isAuth }) {
  useScrollReveal();
  return (
    <div>
      <Navbar isAuth={isAuth} />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Trusted by security-first teams
        </div>

        <h1 className="hero-title">
          The Password Manager<br />
          <span className="grad-text">Built for Everyone</span>
        </h1>

        <p className="hero-desc">
          CogniSafe keeps your digital life secure with zero-knowledge encryption,
          a powerful password generator, real-time security audits, and two-factor authentication.
        </p>

        <div className="hero-actions">
          {isAuth ? (
            <Link to="/vault" className="btn btn-primary btn-lg">Open My Vault</Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/features" className="btn btn-ghost btn-lg">Explore features</Link>
            </>
          )}
        </div>

        {/* Browser mockup */}
        <div className="hero-mockup" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-mockup-bar">
            <span className="mockup-dot mockup-dot-r" />
            <span className="mockup-dot mockup-dot-y" />
            <span className="mockup-dot mockup-dot-g" />
            <span className="mockup-url">app.cognisafe.io/vault</span>
          </div>
          <div className="mockup-body">
            {MOCKUP_ROWS.map((r, i) => (
              <div key={i} className="mockup-row">
                <div className="mockup-icon" style={{ background: r.iconBg, color: r.iconColor }}>
                  {r.icon}
                </div>
                <div className="mockup-info">
                  <div className="mockup-site" style={{ color: r.siteColor }}>{r.site}</div>
                  <div className="mockup-user">{r.user}</div>
                </div>
                <span className="mockup-dots">••••••••••••</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        {[
          { n: '256-bit', l: 'AES Encryption' },
          { n: '100%',    l: 'Zero-Knowledge' },
          { n: '2FA',     l: 'Built-in' },
          { n: 'Open',    l: 'Architecture' },
        ].map((s, i) => (
          <div key={i} className={`stat-item reveal reveal-d${i + 1}`}>
            <span className="stat-num">{s.n}</span>
            <span className="stat-lbl">{s.l}</span>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section className="page-section dark-bg">
        <div className="page-section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Features</span>
            <h2 className="section-title">Everything you need to stay secure</h2>
            <p className="section-desc">A complete security toolkit, from vault management to real-time health auditing.</p>
          </div>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`feat-card reveal reveal-d${Math.min(i + 1, 6)}`}>
                <div className="feat-card-shine" />
                <div className="feat-icon">{f.icon}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="page-section">
        <div className="page-section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-desc">No complex setup. No technical knowledge required. Just instant security.</p>
          </div>
          <div className="steps-grid">
            <div className="steps-connector" />
            {STEPS.map((s, i) => (
              <div key={i} className={`step reveal reveal-d${i + 1}`}>
                <div className="step-num">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="page-section dark-bg">
        <div className="page-section-inner">
          <div className="security-panel">
            <div>
              <span className="section-eyebrow">Security</span>
              <h2 className="section-title">Built on a foundation of trust</h2>
              <p className="section-desc" style={{ marginBottom: 28 }}>
                We use industry-standard cryptographic protocols so your data stays private — even from us.
              </p>
              {!isAuth && (
                <Link to="/signup" className="btn btn-primary">Start Secure</Link>
              )}
            </div>
            <div className="sec-badges">
              {SECURITY.map((b, i) => (
                <div key={i} className={`sec-badge reveal reveal-d${i + 1}`}>
                  <div className="sec-badge-icon">{b.icon}</div>
                  <div className="sec-badge-body">
                    <h4>{b.title}</h4>
                    <p>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!isAuth && (
        <section className="cta-band">
          <h2 className="cta-band-title">
            Your passwords deserve<br />
            <span className="grad-text">better protection</span>
          </h2>
          <p className="cta-band-desc">
            Join others who trust CogniSafe to keep their digital lives secure — for free.
          </p>
          <div className="cta-band-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account</Link>
            <Link to="/login"  className="btn btn-ghost btn-lg">Sign In</Link>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/cognisafe-logo.jpg" className="footer-logo-img" alt="CogniSafe" />
        </div>
        <span className="footer-copy">© 2025 CogniSafe — Personal Password Vault</span>
        <div className="footer-links">
          <Link to="/features" className="footer-link">Features</Link>
          <Link to="/login"    className="footer-link">Sign In</Link>
          <Link to="/signup"   className="footer-link">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}
