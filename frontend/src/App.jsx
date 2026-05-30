import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home      from './pages/Home';
import Features  from './pages/Features';
import Pricing   from './pages/Pricing';
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import TwoFactor from './pages/TwoFactor';
import Dashboard from './pages/Dashboard';
import Vault     from './pages/Vault';
import Generator from './pages/Generator';
import Audit     from './pages/Audit';
import Account   from './pages/Account';

const TOKEN_KEY = 'cognisafe_token';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const isAuth = !!token;

  const login  = (t) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); };
  const logout = ()  => { localStorage.removeItem(TOKEN_KEY); setToken(null); };

  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Home     isAuth={isAuth} />} />
      <Route path="/features" element={<Features isAuth={isAuth} />} />
      <Route path="/pricing"  element={<Pricing  isAuth={isAuth} />} />
      <Route path="/login"    element={!isAuth ? <Login     onLogin={login}  /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup"   element={!isAuth ? <Signup    onLogin={login}  /> : <Navigate to="/dashboard" replace />} />
      <Route path="/2fa"      element={!isAuth ? <TwoFactor onLogin={login}  /> : <Navigate to="/dashboard" replace />} />

      {/* Protected */}
      <Route path="/dashboard" element={isAuth ? <Dashboard onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/vault"     element={isAuth ? <Vault     onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/generator" element={isAuth ? <Generator onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/audit"     element={isAuth ? <Audit     onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/account"   element={isAuth ? <Account   onLogout={logout} /> : <Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to={isAuth ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}
