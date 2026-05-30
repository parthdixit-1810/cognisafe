import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { LockIcon, KeyIcon, ShieldIcon, MailIcon, ZapIcon, EyeOffIcon, CheckCircleIcon } from '../components/Icons';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { api } from '../api';

const FREE_FEATURES = [
  'Up to 50 vault entries',
  'Password generator',
  'Basic security audit',
  'Email two-factor authentication',
  'AES-256-CBC encryption',
  '1 trusted device',
];

const PRO_FEATURES = [
  'Unlimited vault entries',
  'All vault types (notes, cards, Wi-Fi, licenses)',
  'Custom fields per entry',
  'Full password history (10 versions)',
  'Up to 10 trusted devices',
  'Recovery codes (emergency access)',
  'Priority support',
  'Everything in Free',
];

const FAQ = [
  {
    q: 'Can I try Pro before paying?',
    a: 'Yes — start on the Free plan and upgrade whenever you need more. No trial period required.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your data is never deleted. If you exceed Free limits after downgrading, existing entries are preserved in read-only mode until you re-upgrade.',
  },
  {
    q: 'Is my data safe on the Free plan?',
    a: 'Absolutely. Every vault entry is encrypted with AES-256-CBC on both plans. Encryption is not a premium feature.',
  },
  {
    q: 'Do you store my credit card?',
    a: 'No. Payments are processed by Stripe — we never see or store your card details.',
  },
];

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Pricing({ isAuth }) {
  useScrollReveal();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const handleUpgrade = async () => {
    if (!isAuth) { navigate('/signup'); return; }
    setUpgrading(true);
    setUpgradeError('');
    try {
      const { url } = await api.billing.checkout();
      window.location.href = url;
    } catch (err) {
      setUpgradeError(err.message || 'Failed to start checkout. Please try again.');
      setUpgrading(false);
    }
  };

  return (
    <div>
      <Navbar isAuth={isAuth} />

      {/* Hero */}
      <div className="feat-page-hero">
        <div className="hero-badge" style={{ margin: '0 auto 20px' }}>
          <span className="hero-badge-dot" />
          Simple, honest pricing
        </div>
        <h1>
          Start free.<br />
          <span className="grad-text">Upgrade when you're ready.</span>
        </h1>
        <p>No hidden fees. No data held hostage. Cancel anytime.</p>
      </div>

      {/* Plans */}
      <section className="page-section">
        <div className="page-section-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 760, margin: '0 auto' }}>

            {/* Free */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: '36px 32px',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-2)', marginBottom: 12 }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>$0</span>
                <span style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>/month</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 28 }}>Everything you need to get started.</p>

              {isAuth ? (
                <Link to="/vault" className="btn btn-surface" style={{ justifyContent: 'center', marginBottom: 28 }}>
                  Go to My Vault
                </Link>
              ) : (
                <Link to="/signup" className="btn btn-surface" style={{ justifyContent: 'center', marginBottom: 28 }}>
                  Create free account
                </Link>
              )}

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0 }}><CheckIcon /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border-brand)',
              borderRadius: 'var(--r-xl)', padding: '36px 32px',
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--glow)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 18, right: 18,
                background: 'var(--brand)', color: '#fff',
                fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 50,
              }}>Most popular</div>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--brand-light)', marginBottom: 12 }}>Pro</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>$4.99</span>
                <span style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>/month</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 28 }}>For power users who want everything.</p>

              {upgradeError && <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13 }}>{upgradeError}</div>}

              <button className="btn btn-primary" style={{ justifyContent: 'center', marginBottom: 28 }} onClick={handleUpgrade} disabled={upgrading}>
                {upgrading && <span className="spinner" />}
                {upgrading ? 'Redirecting…' : isAuth ? 'Upgrade to Pro' : 'Get started'}
              </button>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: i === PRO_FEATURES.length - 1 ? 'var(--text-3)' : 'var(--text-2)' }}>
                    <span style={{ color: 'var(--brand-light)', flexShrink: 0 }}><CheckIcon /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="page-section dark-bg">
        <div className="page-section-inner" style={{ maxWidth: 720 }}>
          <div className="section-header center">
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">Common questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQ.map((f, i) => (
              <div key={i} className={`reveal reveal-d${i + 1}`} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '22px 28px',
                transition: 'border-color var(--trans), opacity .7s ease, transform .7s ease',
              }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.q}</h4>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuth && (
        <section className="cta-band">
          <h2 className="cta-band-title">
            Nothing to lose,<br />
            <span className="grad-text">everything to protect.</span>
          </h2>
          <p className="cta-band-desc">Set up your vault in under 60 seconds. Free forever.</p>
          <div className="cta-band-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link to="/login"  className="btn btn-ghost btn-lg">Sign In</Link>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/cognisafe-logo.jpg" className="footer-logo-img" alt="CogniSafe" />
        </div>
        <span className="footer-copy">© 2025 CogniSafe</span>
        <div className="footer-links">
          <Link to="/"         className="footer-link">Home</Link>
          <Link to="/features" className="footer-link">Features</Link>
          <Link to="/login"    className="footer-link">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
