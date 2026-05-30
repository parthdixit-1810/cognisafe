import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useUser() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then(d => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle2FA = useCallback(async () => {
    const next = !user?.twoFactorEnabled;
    await api.auth.toggle2fa(next);
    setUser(u => ({ ...u, twoFactorEnabled: next }));
    return next;
  }, [user]);

  return { user, loading, toggle2FA };
}
