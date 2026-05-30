// ── State ──────────────────────────────────────────────────────────────────────
const state = {
  screen: 'loading',   // loading | login | twofa | main | save
  token:  null,
  userId: null,
  vault:  [],
  domain: '',
  tabId:  null,
  tabUrl: '',
  gen: { length: 16, upper: true, lower: true, numbers: true, symbols: true, pw: '' },
  saveForm: { site: '', username: '', password: '', url: '' },
  error: '',
  loading: false,
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
};

const API = 'https://cognisafe-541n.onrender.com';

function getToken() {
  return new Promise(r => chrome.storage.local.get('token', d => r(d.token || null)));
}
function saveToken(token) {
  return new Promise(r => chrome.storage.local.set({ token }, r));
}
function clearToken() {
  return new Promise(r => chrome.storage.local.remove('token', r));
}

async function api(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

const AVATAR_COLORS = ['#4f6bed','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2'];
function avatarColor(name) {
  return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length];
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ── Password generator ─────────────────────────────────────────────────────────
function generatePassword() {
  const { length, upper, lower, numbers, symbols } = state.gen;
  let chars = '';
  if (upper)   chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lower)   chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*-_=+?';
  if (!chars)  chars  = 'abcdefghijklmnopqrstuvwxyz';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  state.gen.pw = Array.from(arr).map(b => chars[b % chars.length]).join('');
}

// ── Message to content script ──────────────────────────────────────────────────
function msgTab(msg) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(state.tabId, msg, res => resolve(res));
  });
}

// ── Render ─────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const screens = {
    loading: renderLoading,
    login:   renderLogin,
    twofa:   renderTwoFa,
    main:    renderMain,
    save:    renderSave,
  };
  app.appendChild((screens[state.screen] || renderLoading)());
}

// ── Loading ────────────────────────────────────────────────────────────────────
function renderLoading() {
  const wrap = el('div', { style: 'display:flex;align-items:center;justify-content:center;height:120px;' });
  const sp   = el('div', { className: 'spinner', style: 'border-color:rgba(79,107,237,.2);border-top-color:#4f6bed;' });
  wrap.appendChild(sp);
  return wrap;
}

// ── Login ──────────────────────────────────────────────────────────────────────
function renderLogin() {
  const wrap = el('div', { className: 'login-wrap' });

  const logo = el('div', { className: 'login-logo' });
  logo.appendChild(el('img', { src: 'icons/icon48.png', alt: 'CogniSafe' }));
  logo.appendChild(el('span', {}, 'CogniSafe'));
  wrap.appendChild(logo);
  wrap.appendChild(el('p', { className: 'login-sub' }, 'Sign in to access your vault'));

  if (state.error) wrap.appendChild(el('div', { className: 'alert alert-error' }, state.error));

  const emailField = el('div', { className: 'field' });
  emailField.appendChild(el('label', {}, 'Email'));
  const emailIn = el('input', { type: 'email', id: 'login-email', placeholder: 'you@example.com', autocomplete: 'email' });
  emailField.appendChild(emailIn);
  wrap.appendChild(emailField);

  const pwField = el('div', { className: 'field' });
  pwField.appendChild(el('label', {}, 'Master password'));
  const pwIn = el('input', { type: 'password', id: 'login-pw', placeholder: 'Enter your password', autocomplete: 'current-password' });
  pwField.appendChild(pwIn);
  wrap.appendChild(pwField);

  const btn = el('button', { className: 'btn btn-primary', onClick: doLogin }, 'Sign in');
  wrap.appendChild(btn);

  pwIn.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  setTimeout(() => emailIn.focus(), 50);
  return wrap;
}

async function doLogin() {
  state.error = '';
  state.loading = true;
  const email    = $('login-email')?.value?.trim() || '';
  const password = $('login-pw')?.value || '';
  if (!email || !password) { state.error = 'Please fill in all fields.'; state.loading = false; render(); return; }
  try {
    const data = await api('/api/auth/login', 'POST', { email, password });
    if (data.twoFactorRequired) {
      state.userId = data.userId;
      state.screen = 'twofa';
    } else {
      await saveToken(data.token);
      state.token = data.token;
      await loadVault();
      state.screen = 'main';
    }
  } catch (err) {
    state.error = err.message || 'Login failed.';
  } finally {
    state.loading = false;
    render();
  }
}

// ── Two-Factor Auth ────────────────────────────────────────────────────────────
function renderTwoFa() {
  const wrap = el('div', { className: 'login-wrap' });

  const logo = el('div', { className: 'login-logo' });
  logo.appendChild(el('img', { src: 'icons/icon48.png', alt: 'CogniSafe' }));
  logo.appendChild(el('span', {}, 'CogniSafe'));
  wrap.appendChild(logo);
  wrap.appendChild(el('p', { className: 'login-sub' }, 'Enter the verification code sent to your email'));

  if (state.error) wrap.appendChild(el('div', { className: 'alert alert-error' }, state.error));

  const codeField = el('div', { className: 'field' });
  codeField.appendChild(el('label', {}, '6-digit code'));
  const codeIn = el('input', { type: 'text', id: 'twofa-code', placeholder: '000000', maxlength: '6', autocomplete: 'one-time-code', style: 'letter-spacing:.2em;font-size:18px;text-align:center;' });
  codeField.appendChild(codeIn);
  wrap.appendChild(codeField);

  const btn = el('button', { className: 'btn btn-primary', onClick: doVerify }, 'Verify');
  wrap.appendChild(btn);

  const back = el('button', { className: 'open-vault', onClick: () => { state.screen = 'login'; state.error = ''; render(); } }, '← Back to login');
  wrap.appendChild(back);

  setTimeout(() => codeIn.focus(), 50);
  codeIn.addEventListener('keydown', e => { if (e.key === 'Enter') doVerify(); });
  return wrap;
}

async function doVerify() {
  state.error = '';
  const code = $('twofa-code')?.value?.trim() || '';
  if (!code) { state.error = 'Enter the 6-digit code.'; render(); return; }
  try {
    const data = await api('/api/auth/verify-2fa', 'POST', { userId: state.userId, code });
    await saveToken(data.token);
    state.token = data.token;
    await loadVault();
    state.screen = 'main';
  } catch (err) {
    state.error = err.message || 'Invalid code.';
  }
  render();
}

// ── Main screen ────────────────────────────────────────────────────────────────
async function loadVault() {
  const data = await api('/api/vault');
  state.vault = data || [];
}

function renderMain() {
  const frag = document.createDocumentFragment();

  // Header
  const header = el('div', { className: 'header' });
  header.appendChild(el('img', { src: 'icons/icon48.png', className: 'header-logo', alt: '' }));
  header.appendChild(el('span', { className: 'header-title' }, 'CogniSafe'));
  if (state.domain) header.appendChild(el('span', { className: 'header-site' }, state.domain));
  const logoutBtn = el('button', { className: 'header-logout', title: 'Sign out', onClick: doLogout });
  logoutBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
  header.appendChild(logoutBtn);
  frag.appendChild(header);

  // Saved for this site
  const siteEntries = state.domain
    ? state.vault.filter(v => {
        const d = extractDomain(v.url || '') || (v.site || '').toLowerCase();
        return d.includes(state.domain) || state.domain.includes(d);
      })
    : [];

  const savedSection = el('div', { className: 'section' });
  savedSection.appendChild(el('div', { className: 'section-label' }, state.domain ? `Saved for ${state.domain}` : 'Your Vault'));

  if (siteEntries.length === 0 && state.domain) {
    savedSection.appendChild(el('p', { className: 'empty-state' }, 'No saved passwords for this site'));
  } else {
    const list = el('div', { className: 'cred-list' });
    const entries = siteEntries.length > 0 ? siteEntries : state.vault.slice(0, 5);
    for (const entry of entries) {
      list.appendChild(renderCredCard(entry));
    }
    savedSection.appendChild(list);
  }
  frag.appendChild(savedSection);

  // Save current page button
  if (state.domain) {
    const saveSection = el('div', { className: 'section' });
    const saveBtn = el('button', { className: 'btn btn-ghost', style: 'width:100%', onClick: openSave });
    saveBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Save password for this site`;
    saveSection.appendChild(saveBtn);
    frag.appendChild(saveSection);
  }

  // Password generator
  if (!state.gen.pw) generatePassword();
  const genSection = el('div', { className: 'section' });
  genSection.appendChild(el('div', { className: 'section-label' }, 'Password Generator'));
  genSection.appendChild(renderGenerator());
  frag.appendChild(genSection);

  // Open full vault
  const link = el('button', { className: 'open-vault', onClick: () => chrome.tabs.create({ url: 'https://cognisafe-q98r.vercel.app' }) });
  link.innerHTML = `Open full vault <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`;
  frag.appendChild(link);

  const wrap = document.createElement('div');
  wrap.appendChild(frag);
  return wrap;
}

function renderCredCard(entry) {
  const card = el('div', { className: 'cred-card' });

  const avatar = el('div', { className: 'cred-avatar', style: `background:${avatarColor(entry.site)}` }, (entry.site || '?')[0].toUpperCase());
  card.appendChild(avatar);

  const info = el('div', { className: 'cred-info' });
  info.appendChild(el('div', { className: 'cred-site' }, entry.site || extractDomain(entry.url || '')));
  info.appendChild(el('div', { className: 'cred-user' }, entry.username || '—'));
  card.appendChild(info);

  const actions = el('div', { className: 'cred-actions' });

  const fillBtn = el('button', { className: 'btn-icon', title: 'Auto-fill', onClick: () => doFill(entry) });
  fillBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Fill`;
  actions.appendChild(fillBtn);

  const copyBtn = el('button', { className: 'btn-icon', title: 'Copy password', onClick: () => { copyToClipboard(entry.password); showCopied(copyBtn); } });
  copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  actions.appendChild(copyBtn);

  card.appendChild(actions);
  return card;
}

function showCopied(btn) {
  const orig = btn.innerHTML;
  btn.innerHTML = '✓ Copied';
  btn.style.color = 'var(--green)';
  setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 1500);
}

async function doFill(entry) {
  try {
    await msgTab({ type: 'FILL', username: entry.username, password: entry.password });
    window.close();
  } catch {
    // content script may not be ready on some pages
  }
}

async function doLogout() {
  await clearToken();
  state.token  = null;
  state.vault  = [];
  state.screen = 'login';
  state.error  = '';
  render();
}

// ── Generator ──────────────────────────────────────────────────────────────────
function renderGenerator() {
  const wrap = el('div', {});

  const output = el('div', { className: 'gen-output' });
  const pwText = el('span', { className: 'gen-pw', id: 'gen-pw-text' }, state.gen.pw);
  output.appendChild(pwText);

  const copyBtn = el('button', { className: 'btn-icon', onClick: () => { copyToClipboard(state.gen.pw); showCopied(copyBtn); } });
  copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  output.appendChild(copyBtn);

  const regenBtn = el('button', { className: 'btn-icon', onClick: () => { generatePassword(); $('gen-pw-text').textContent = state.gen.pw; } });
  regenBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
  output.appendChild(regenBtn);
  wrap.appendChild(output);

  // Length slider
  const controls = el('div', { className: 'gen-controls' });
  const lenRow   = el('div', { className: 'gen-row' });
  lenRow.appendChild(el('span', { className: 'gen-label' }, 'Length'));
  const slider = el('input', { type: 'range', className: 'gen-slider', min: '8', max: '32', value: String(state.gen.length) });
  const lenNum = el('span', { className: 'gen-len' }, String(state.gen.length));
  slider.addEventListener('input', () => {
    state.gen.length = +slider.value;
    lenNum.textContent = slider.value;
    generatePassword();
    $('gen-pw-text').textContent = state.gen.pw;
  });
  lenRow.appendChild(slider);
  lenRow.appendChild(lenNum);
  controls.appendChild(lenRow);

  // Checkboxes
  const checkRow = el('div', { className: 'gen-row' });
  checkRow.appendChild(el('span', { className: 'gen-label' }, 'Include'));
  const checks = el('div', { className: 'gen-checks' });
  [['upper','A-Z'],['lower','a-z'],['numbers','0-9'],['symbols','!@#']].forEach(([key, label]) => {
    const lbl = el('label', { className: 'gen-check' });
    const cb  = el('input', { type: 'checkbox' });
    cb.checked = state.gen[key];
    cb.addEventListener('change', () => {
      state.gen[key] = cb.checked;
      generatePassword();
      $('gen-pw-text').textContent = state.gen.pw;
    });
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(label));
    checks.appendChild(lbl);
  });
  checkRow.appendChild(checks);
  controls.appendChild(checkRow);
  wrap.appendChild(controls);
  return wrap;
}

// ── Save screen ────────────────────────────────────────────────────────────────
async function openSave() {
  // Try to grab current field values from the page
  try {
    const fields = await msgTab({ type: 'GET_FIELDS' });
    state.saveForm.username = fields?.username || '';
    state.saveForm.password = fields?.password || '';
  } catch { /* ignore */ }
  state.saveForm.site = state.domain;
  state.saveForm.url  = state.tabUrl;
  state.screen = 'save';
  state.error  = '';
  render();
}

function renderSave() {
  const frag = document.createDocumentFragment();

  const header = el('div', { className: 'header' });
  const backBtn = el('button', { className: 'btn-icon', onClick: () => { state.screen = 'main'; render(); } });
  backBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
  header.appendChild(backBtn);
  header.appendChild(el('span', { className: 'header-title' }, 'Save Password'));
  frag.appendChild(header);

  const section = el('div', { className: 'section' });
  if (state.error) section.appendChild(el('div', { className: 'alert alert-error', style: 'margin-bottom:8px' }, state.error));

  const form = el('div', { className: 'save-form' });

  const fields = [
    { label: 'Site name', key: 'site',     type: 'text',     placeholder: 'e.g. GitHub' },
    { label: 'Username / Email', key: 'username', type: 'text', placeholder: 'you@example.com' },
    { label: 'Password', key: 'password',  type: 'password', placeholder: '••••••••' },
    { label: 'URL (optional)', key: 'url', type: 'text',     placeholder: 'https://...' },
  ];
  for (const f of fields) {
    const fieldEl = el('div', { className: 'field' });
    fieldEl.appendChild(el('label', {}, f.label));
    const inp = el('input', { type: f.type, placeholder: f.placeholder, id: `save-${f.key}` });
    inp.value = state.saveForm[f.key] || '';
    fieldEl.appendChild(inp);
    form.appendChild(fieldEl);
  }

  const actions = el('div', { className: 'save-actions' });
  const cancelBtn = el('button', { className: 'btn btn-ghost', onClick: () => { state.screen = 'main'; render(); } }, 'Cancel');
  const saveBtn   = el('button', { className: 'btn btn-primary', onClick: doSave }, 'Save');
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  form.appendChild(actions);

  section.appendChild(form);
  frag.appendChild(section);

  const wrap = document.createElement('div');
  wrap.appendChild(frag);
  return wrap;
}

async function doSave() {
  state.error = '';
  const site     = $('save-site')?.value?.trim()     || '';
  const username = $('save-username')?.value?.trim() || '';
  const password = $('save-password')?.value         || '';
  const url      = $('save-url')?.value?.trim()      || '';

  if (!site || !username || !password) {
    state.error = 'Site, username and password are required.';
    render(); return;
  }
  try {
    await api('/api/vault', 'POST', { site, username, password, url });
    await loadVault();
    state.screen = 'main';
    state.error  = '';
  } catch (err) {
    state.error = err.message || 'Failed to save.';
  }
  render();
}

// ── Init ───────────────────────────────────────────────────────────────────────
async function init() {
  // Get current tab info
  const [tab] = await new Promise(r => chrome.tabs.query({ active: true, currentWindow: true }, r));
  state.tabId  = tab?.id;
  state.tabUrl = tab?.url || '';
  state.domain = extractDomain(state.tabUrl);

  // Check auth
  state.token = await getToken();
  if (!state.token) {
    state.screen = 'login';
    render();
    return;
  }

  // Load vault
  try {
    await loadVault();
    state.screen = 'main';
  } catch {
    // Token expired
    await clearToken();
    state.token  = null;
    state.screen = 'login';
  }
  render();
}

render(); // show loading immediately
init();
