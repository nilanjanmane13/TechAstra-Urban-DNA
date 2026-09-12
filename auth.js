// auth.js
// -----------------------------------------------------------------------------
// Session-based email/password auth backed by SQLite (see db.js).
// Mounted at /api/auth by server.js.
// -----------------------------------------------------------------------------
import express from 'express';
import bcrypt from 'bcryptjs';
import { Users } from './db.js';

export const authRouter = express.Router();

function publicUser(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email };
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (Users.findByEmail(email)) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = Users.create({ name: String(name).trim(), email, passwordHash });
    req.session.userId = user.id;
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = Users.findByEmail(email || '');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const ok = await bcrypt.compare(String(password || ''), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    req.session.userId = user.id;
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Could not log in. Please try again.' });
  }
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('urbandna.sid');
    res.json({ ok: true });
  });
});

authRouter.get('/me', (req, res) => {
  const user = req.session.userId ? Users.findById(req.session.userId) : null;
  res.json({ user: publicUser(user) });
});

// Middleware: protect any route/API that requires a logged-in user.
export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  return res.redirect('/login.html');
}
