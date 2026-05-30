import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar({ isAuth }) {
  const { pathname } = useLocation();
  const active = (p) => pathname === p ? 'nav-link active' : 'nav-link';

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <Link to="/" className="nav-brand">
        <img src="/cognisafe-logo.jpg" className="nav-logo-img" alt="CogniSafe" />
      </Link>

      <ul className="nav-links">
        <li><Link to="/"         className={active('/')}>Home</Link></li>
        <li><Link to="/features" className={active('/features')}>Features</Link></li>
        <li><a href="/#security" className="nav-link">Security</a></li>
        <li><Link to="/pricing"  className={active('/pricing')}>Pricing</Link></li>
      </ul>

      <div className="nav-actions">
        {isAuth ? (
          <Link to="/vault" className="btn btn-primary">Open Vault</Link>
        ) : (
          <>
            <Link to="/login"  className="btn btn-ghost">Sign in</Link>
            <Link to="/signup" className="btn btn-primary">Get started free</Link>
          </>
        )}
      </div>
    </nav>
  );
}
