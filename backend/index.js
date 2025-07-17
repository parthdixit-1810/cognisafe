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
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Cognisafe backend is running!' });
});

// TODO: Add auth and vault routes here

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Email transporter (configure for your email provider)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function send2FACode(email, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Cognisafe 2FA Code',
    text: `Your Cognisafe 2FA code is: ${code}`,
  });
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
    res.status(500).json({ error: 'Signup failed.' });
  }
});

// Modified login route for 2FA
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    if (user.twoFactorEnabled) {
      const code = generate2FACode();
      const hash = hashCode(code);
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorTempCode: hash, twoFactorTempExpires: expires },
      });
      await send2FACode(user.email, code);
      return res.json({ twoFactorRequired: true, userId: user.id });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
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
    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
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
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ error: 'Missing userId or code' });
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorTempCode || !user.twoFactorTempExpires) return res.status(400).json({ error: '2FA not requested' });
    if (user.twoFactorTempExpires < new Date()) return res.status(400).json({ error: '2FA code expired' });
    if (hashCode(code) !== user.twoFactorTempCode) return res.status(401).json({ error: 'Invalid 2FA code' });
    // Clear temp code after successful verification
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorTempCode: null, twoFactorTempExpires: null } });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
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

// Get all passwords for user
app.get('/api/vault', requireAuth, async (req, res) => {
  try {
    const passwords = await prisma.password.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, site: true, username: true, password: true, createdAt: true }
    });
    // Decrypt passwords before sending
    const result = passwords.map(p => ({ ...p, password: decrypt(p.password) }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch passwords' });
  }
});

// Add a new password
app.post('/api/vault', requireAuth, async (req, res) => {
  const { site, username, password } = req.body;
  const validationError = validateFields(site, username, password);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!site || !username || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const encrypted = encrypt(password);
    const entry = await prisma.password.create({
      data: { site, username, password: encrypted, userId: req.userId }
    });
    // Decrypt before sending back
    res.status(201).json({ ...entry, password });
  } catch (err) {
    console.error('Error adding password:', err);
    res.status(500).json({ error: 'Failed to add password', details: err.message });
  }
});

// Update a password
app.put('/api/vault/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { site, username, password } = req.body;
  const validationError = validateFields(site, username, password);
  if (validationError) return res.status(400).json({ error: validationError });
  try {
    const encrypted = encrypt(password);
    const entry = await prisma.password.update({
      where: { id: Number(id), userId: req.userId },
      data: { site, username, password: encrypted }
    });
    res.json({ ...entry, password });
  } catch {
    res.status(500).json({ error: 'Failed to update password' });
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
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 