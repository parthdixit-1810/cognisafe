const BASE_URL = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('cognisafe_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE_URL + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  auth: {
    login:          (email, password, deviceToken)  => apiFetch('/api/auth/login',       { method: 'POST', body: JSON.stringify({ email, password, ...(deviceToken ? { deviceToken } : {}) }) }),
    signup:         (email, password)              => apiFetch('/api/auth/signup',      { method: 'POST', body: JSON.stringify({ email, password }) }),
    verify2fa:      (userId, code, opts = {})       => apiFetch('/api/auth/verify-2fa',  { method: 'POST', body: JSON.stringify({ userId, code, ...opts }) }),
    resendOtp:      (userId)                       => apiFetch('/api/auth/resend-otp',  { method: 'POST', body: JSON.stringify({ userId }) }),
    googleLogin:          (token)                       => apiFetch('/api/auth/google',             { method: 'POST', body: JSON.stringify({ token }) }),
    toggle2fa:            (enable)                       => apiFetch('/api/auth/2fa',                { method: 'POST', body: JSON.stringify({ enable }) }),
    sendOperationCode:    ()                             => apiFetch('/api/auth/send-operation-code', { method: 'POST' }),
    verifyOperation:      (code)                         => apiFetch('/api/auth/verify-operation',    { method: 'POST', body: JSON.stringify({ code }) }),
    me:             ()                             => apiFetch('/api/auth/me'),
    changePassword:   (currentPassword, newPassword)          => apiFetch('/api/auth/password',        { method: 'PUT',    body: JSON.stringify({ currentPassword, newPassword }) }),
    deleteAccount:    ()                                       => apiFetch('/api/auth/account',         { method: 'DELETE' }),
    generateRecovery: ()                                       => apiFetch('/api/auth/recovery-codes',  { method: 'POST' }),
    recoveryStatus:   ()                                       => apiFetch('/api/auth/recovery-codes'),
    listDevices:      ()                                       => apiFetch('/api/auth/devices'),
    revokeDevice:     (id)                                     => apiFetch(`/api/auth/devices/${id}`,   { method: 'DELETE' }),
  },
  billing: {
    status:   ()  => apiFetch('/api/billing/status'),
    checkout: ()  => apiFetch('/api/billing/checkout', { method: 'POST' }),
    portal:   ()  => apiFetch('/api/billing/portal',   { method: 'POST' }),
  },
  vault: {
    list:    ()              => apiFetch('/api/vault'),
    add:     (data)          => apiFetch('/api/vault',           { method: 'POST',   body: JSON.stringify(data) }),
    update:  (id, data)      => apiFetch(`/api/vault/${id}`,   { method: 'PUT',    body: JSON.stringify(data) }),
    delete:  (id)            => apiFetch(`/api/vault/${id}`,   { method: 'DELETE' }),
    import:  (entries)       => apiFetch('/api/vault/import',    { method: 'POST',   body: JSON.stringify({ entries }) }),
    export:  ()              => apiFetch('/api/vault/export'),
    history: (id)            => apiFetch(`/api/vault/${id}/history`),
  },
};
