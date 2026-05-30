const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
dotenv.config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('./cryptoUtil');
const { OAuth2Client } = require('google-auth-library');
// nodemailer removed — using Resend API (SMTP blocked on Render free tier)
const crypto = require('crypto');
const Stripe = require('stripe');

const app = express();
const prisma = new PrismaClient();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const allowedOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === allowedOrigin ||
        /^chrome-extension:\/\//.test(origin) ||
        origin === 'http://localhost:3000' ||
        origin === 'http://localhost:3001') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── Stripe webhook (must be raw body, before express.json) ────────────────────
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const obj = event.data.object;
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sub = await stripe.subscriptions.retrieve(obj.subscription);
        await prisma.user.updateMany({
          where: { stripeCustomerId: obj.customer },
          data: {
            plan: 'pro',
            stripeSubscriptionId: obj.subscription,
            planExpiresAt: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const active = ['active', 'trialing'].includes(obj.status);
        await prisma.user.updateMany({
          where: { stripeCustomerId: String(obj.customer) },
          data: {
            plan: active ? 'pro' : 'free',
            stripeSubscriptionId: obj.id,
            planExpiresAt: active ? new Date(obj.current_period_end * 1000) : null,
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        await prisma.user.updateMany({
          where: { stripeCustomerId: String(obj.customer) },
          data: { plan: 'free', stripeSubscriptionId: null, planExpiresAt: null },
        });
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }
  res.json({ received: true });
});

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Cognisafe backend is running!' });
});

// TODO: Add auth and vault routes here

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Send 2FA code via Resend API (works on Render — uses HTTPS not SMTP)
async function send2FACode(email, code) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CogniSafe <onboarding@resend.dev>',
      to: email,
      subject: `${code} is your CogniSafe verification code`,
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#050c18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050c18;padding:40px 20px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0d1626;border:1px solid rgba(37,99,235,.3);border-radius:16px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:32px;text-align:center">
<div style="font-size:22px;font-weight:900;color:#fff">CogniSafe</div>
<div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px">Personal Password Vault</div>
</td></tr>
<tr><td style="padding:36px 32px;text-align:center">
<div style="font-size:14px;color:#8892b0;margin-bottom:24px">Your verification code</div>
<div style="font-size:48px;font-weight:900;color:#60a5fa;letter-spacing:10px;font-family:monospace">${code}</div>
<div style="margin:24px 0;height:1px;background:rgba(255,255,255,.06)"></div>
<p style="font-size:13px;color:#8892b0;line-height:1.7;margin:0">Expires in <strong style="color:#f0f4ff">10 minutes</strong>. If you didn't request this, ignore this email.</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${err.message || res.status}`);
  }
}

function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    res.status(500).json({ error: 'Signup failed.', detail: err.message });
  }
});

// Modified login route for 2FA
app.post('/api/auth/login', async (req, res) => {
  const { email, password, deviceToken } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    // Check if device is trusted — skip 2FA if so
    if (deviceToken) {
      const hashed = hashCode(deviceToken);
      const trusted = await prisma.trustedDevice.findFirst({
        where: { tokenHash: hashed, userId: user.id, expiresAt: { gt: new Date() } },
      });
      if (trusted) {
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: user.id, email: user.email }, deviceTrusted: true });
      }
    }
    // Only require 2FA if user has enabled it
    if (user.twoFactorEnabled) {
      const code = generate2FACode();
      const hash = hashCode(code);
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorTempCode: hash, twoFactorTempExpires: expires } });
      await send2FACode(user.email, code);
      return res.json({ twoFactorRequired: true, userId: user.id });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Login failed.', detail: err.message });
  }
});

// Google OAuth login/signup
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing Google token' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    if (!email) return res.status(400).json({ error: 'No email in Google account' });
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, passwordHash: '' } });
    }
    // Always require 2FA
    const code = generate2FACode();
    const hash = hashCode(code);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorTempCode: hash, twoFactorTempExpires: expires } });
    await send2FACode(user.email, code);
    res.json({ twoFactorRequired: true, userId: user.id });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// Send operation verification code (for sensitive in-app actions)
app.post('/api/auth/send-operation-code', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const code = generate2FACode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorTempCode: hashCode(code), twoFactorTempExpires: expires } });
    await send2FACode(user.email, code);
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send code.' });
  }
});

// Verify operation code
app.post('/api/auth/verify-operation', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required.' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (!user.twoFactorTempCode || !user.twoFactorTempExpires || user.twoFactorTempExpires < new Date()) {
      return res.status(400).json({ error: 'Code expired or not found. Request a new one.' });
    }
    if (hashCode(code) !== user.twoFactorTempCode) {
      return res.status(401).json({ error: 'Invalid code.' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorTempCode: null, twoFactorTempExpires: null } });
    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Enable/disable 2FA endpoint
app.post('/api/auth/2fa', requireAuth, async (req, res) => {
  const { enable } = req.body;
  try {
    await prisma.user.update({ where: { id: req.userId }, data: { twoFactorEnabled: !!enable } });
    res.json({ success: true, twoFactorEnabled: !!enable });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update 2FA status' });
  }
});

// 2FA code verification endpoint
app.post('/api/auth/verify-2fa', async (req, res) => {
  const { userId, code, rememberDevice, deviceName } = req.body;
  if (!userId || !code) return res.status(400).json({ error: 'Missing userId or code' });
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let verified = false;

    // Check OTP
    if (user.twoFactorTempCode && user.twoFactorTempExpires) {
      if (user.twoFactorTempExpires >= new Date() && hashCode(code) === user.twoFactorTempCode) {
        verified = true;
        await prisma.user.update({ where: { id: user.id }, data: { twoFactorTempCode: null, twoFactorTempExpires: null } });
      }
    }

    // Check recovery code (format: 8 alphanumeric chars, not all digits)
    if (!verified && !/^\d+$/.test(code.trim())) {
      const normalised = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const unused = await prisma.recoveryCode.findFirst({ where: { userId: user.id, usedAt: null } });
      if (unused) {
        const allCodes = await prisma.recoveryCode.findMany({ where: { userId: user.id, usedAt: null } });
        for (const rc of allCodes) {
          if (hashCode(normalised) === rc.codeHash) {
            await prisma.recoveryCode.update({ where: { id: rc.id }, data: { usedAt: new Date() } });
            verified = true;
            break;
          }
        }
      }
    }

    if (!verified) return res.status(401).json({ error: 'Invalid or expired code' });

    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    let deviceToken = null;

    if (rememberDevice) {
      const raw = crypto.randomBytes(40).toString('hex');
      const hashed = hashCode(raw);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await prisma.trustedDevice.create({ data: { tokenHash: hashed, deviceName: deviceName || 'Browser', expiresAt, userId: user.id } });
      // Purge old expired devices
      await prisma.trustedDevice.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
      deviceToken = raw;
    }

    res.json({ token: jwtToken, user: { id: user.id, email: user.email }, deviceToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '2FA verification failed' });
  }
});

// JWT auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function validatePassword(password) {
  if (!password || password.length < 12) return 'Password must be at least 12 characters.';
  if (password.length > 128) return 'Password must be at most 128 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one digit.';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return 'Password must include at least one special character.';
  if (/^\s+$/.test(password)) return 'Password cannot be only spaces.';
  return '';
}
function validateFields(site, username, password) {
  if (!site || site.trim().length < 2 || site.length > 64) return 'Site name must be 2-64 characters.';
  if (!username || username.trim().length < 2 || username.length > 64) return 'Username must be 2-64 characters.';
  const pwdError = validatePassword(password);
  if (pwdError) return pwdError;
  return '';
}

const VAULT_SELECT = { id: true, site: true, username: true, password: true, url: true, notes: true, type: true, customFields: true, createdAt: true };
const decryptEntry = (p) => ({ ...p, password: p.password ? decrypt(p.password) : '' });

// Get all passwords for user
app.get('/api/vault', requireAuth, async (req, res) => {
  try {
    const passwords = await prisma.password.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: VAULT_SELECT,
    });
    res.json(passwords.map(decryptEntry));
  } catch {
    res.status(500).json({ error: 'Failed to fetch passwords' });
  }
});

// Export vault (all entries, decrypted)
app.get('/api/vault/export', requireAuth, async (req, res) => {
  try {
    const passwords = await prisma.password.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: VAULT_SELECT,
    });
    res.json({ entries: passwords.map(decryptEntry), exportedAt: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Failed to export vault' });
  }
});

// Bulk import (relaxed validation — imported passwords may not meet complexity rules)
app.post('/api/vault/import', requireAuth, async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' });
  let imported = 0;
  let skipped = 0;
  for (const e of entries.slice(0, 2000)) {
    const { site, username, password, url, notes, type } = e;
    if (!site || !username || !password) { skipped++; continue; }
    try {
      const encrypted = encrypt(String(password));
      await prisma.password.create({
        data: {
          site: String(site).slice(0, 64),
          username: String(username).slice(0, 64),
          password: encrypted,
          url: url ? String(url).slice(0, 512) : null,
          notes: notes ? String(notes).slice(0, 10000) : null,
          type: ['note','card','wifi','license'].includes(type) ? type : 'password',
          customFields: e.customFields || undefined,
          userId: req.userId,
        },
      });
      imported++;
    } catch { skipped++; }
  }
  res.json({ imported, skipped });
});

// Add a new password
app.post('/api/vault', requireAuth, async (req, res) => {
  const { site, username, password, url, notes, type, customFields } = req.body;
  // Notes entries don't require password complexity
  if (type !== 'note') {
    const validationError = validateFields(site, username || '_placeholder_', password);
    if (validationError) return res.status(400).json({ error: validationError });
  }
  if (!site) return res.status(400).json({ error: 'Site name required' });
  try {
    const encrypted = password ? encrypt(password) : encrypt('');
    const entry = await prisma.password.create({
      data: {
        site, username: username || '', password: encrypted,
        url: url || null, notes: notes || null,
        type: type || 'password',
        customFields: customFields ? customFields : undefined,
        userId: req.userId,
      },
    });
    res.status(201).json({ ...entry, password: password || '' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add password', details: err.message });
  }
});

// Update a password (snapshots old password to history first)
app.put('/api/vault/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { site, username, password, url, notes, type, customFields } = req.body;
  if (type !== 'note') {
    const validationError = validateFields(site, username || '_placeholder_', password);
    if (validationError) return res.status(400).json({ error: validationError });
  }
  try {
    // Snapshot old password into history before overwriting
    const existing = await prisma.password.findUnique({ where: { id: Number(id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });
    const oldPw = existing.password;
    const newPw = password ? encrypt(password) : encrypt('');
    // Only create history record if password actually changed
    if (oldPw !== newPw) {
      await prisma.passwordHistory.create({ data: { passwordId: Number(id), password: oldPw } });
      // Keep only last 10 history records per entry
      const history = await prisma.passwordHistory.findMany({ where: { passwordId: Number(id) }, orderBy: { createdAt: 'asc' } });
      if (history.length > 10) {
        const toDelete = history.slice(0, history.length - 10).map(h => h.id);
        await prisma.passwordHistory.deleteMany({ where: { id: { in: toDelete } } });
      }
    }
    const entry = await prisma.password.update({
      where: { id: Number(id), userId: req.userId },
      data: {
        site, username: username || '', password: newPw,
        url: url || null, notes: notes || null,
        type: type || 'password',
        customFields: customFields !== undefined ? customFields : existing.customFields,
      },
    });
    res.json({ ...entry, password: password || '' });
  } catch {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get password history for an entry
app.get('/api/vault/:id/history', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await prisma.password.findUnique({ where: { id: Number(id), userId: req.userId } });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    const history = await prisma.passwordHistory.findMany({
      where: { passwordId: Number(id) },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(history.map(h => ({ id: h.id, password: decrypt(h.password), createdAt: h.createdAt })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Delete a password
app.delete('/api/vault/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.password.delete({ where: { id: Number(id), userId: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete password' });
  }
});

// Get current user info
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled, createdAt: user.createdAt, plan: user.plan || 'free' } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Resend 2FA code (30-second cooldown enforced client-side; backend just regenerates)
app.post('/api/auth/resend-otp', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const code = generate2FACode();
    const hash = hashCode(code);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({ where: { id: Number(userId) }, data: { twoFactorTempCode: hash, twoFactorTempExpires: expires } });
    await send2FACode(user.email, code);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// Generate recovery codes (wipes existing unused ones)
app.post('/api/auth/recovery-codes', requireAuth, async (req, res) => {
  try {
    // Delete all existing codes for this user
    await prisma.recoveryCode.deleteMany({ where: { userId: req.userId } });
    const codes = [];
    for (let i = 0; i < 8; i++) {
      const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10-char hex e.g. A1B2C3D4E5
      codes.push(raw);
      await prisma.recoveryCode.create({ data: { codeHash: hashCode(raw), userId: req.userId } });
    }
    res.json({ codes });
  } catch {
    res.status(500).json({ error: 'Failed to generate recovery codes' });
  }
});

// Recovery code status (how many unused remain)
app.get('/api/auth/recovery-codes', requireAuth, async (req, res) => {
  try {
    const total  = await prisma.recoveryCode.count({ where: { userId: req.userId } });
    const unused = await prisma.recoveryCode.count({ where: { userId: req.userId, usedAt: null } });
    res.json({ total, unused, generated: total > 0 });
  } catch {
    res.status(500).json({ error: 'Failed to fetch recovery code status' });
  }
});

// Trusted devices — list
app.get('/api/auth/devices', requireAuth, async (req, res) => {
  try {
    const devices = await prisma.trustedDevice.findMany({
      where: { userId: req.userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, deviceName: true, createdAt: true, expiresAt: true },
    });
    res.json(devices);
  } catch {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Trusted devices — revoke one
app.delete('/api/auth/devices/:id', requireAuth, async (req, res) => {
  try {
    await prisma.trustedDevice.delete({ where: { id: Number(req.params.id), userId: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to revoke device' });
  }
});

// Change master password
app.put('/api/auth/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.passwordHash) return res.status(400).json({ error: 'Cannot change password for OAuth accounts' });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete account (cascades all vault entries)
app.delete('/api/auth/account', requireAuth, async (req, res) => {
  try {
    await prisma.password.deleteMany({ where: { userId: req.userId } });
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ── Billing ───────────────────────────────────────────────────────────────────

// GET /api/billing/status — current plan
app.get('/api/billing/status', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true, stripeCustomerId: true, stripeSubscriptionId: true, planExpiresAt: true },
    });
    res.json({
      plan: user.plan || 'free',
      hasSubscription: !!user.stripeSubscriptionId,
      expiresAt: user.planExpiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get billing status.' });
  }
});

// POST /api/billing/checkout — create Stripe Checkout session
app.post('/api/billing/checkout', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: String(user.id) } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account?billing=success`,
      cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
      allow_promotion_codes: true,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// POST /api/billing/portal — Stripe Customer Portal
app.post('/api/billing/portal', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.stripeCustomerId) return res.status(400).json({ error: 'No billing account found.' });
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to open billing portal.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 