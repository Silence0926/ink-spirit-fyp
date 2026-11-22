'use strict';

const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const MUSIC_DIR = path.join(PUBLIC_DIR, 'music');

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tempFile = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(tempFile, file);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { algorithm: 'scrypt', salt, hash: derived };
}

function verifyPassword(password, stored) {
  if (stored && typeof stored === 'object' && stored.algorithm === 'scrypt') {
    const actual = crypto.scryptSync(password, stored.salt, 64);
    const expected = Buffer.from(stored.hash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }
  // Compatibility for accounts created by the original JSON server.
  return typeof stored === 'string' && stored === password;
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ink-spirit',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/register', (req, res, next) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (username.length < 3 || username.length > 40 || password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: 'Username must be 3–40 characters and password 8–200 characters.' });
    }

    const users = readJson(USERS_FILE, []);
    if (!Array.isArray(users)) return res.status(500).json({ error: 'User data is invalid.' });
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    // Public registration cannot grant privileged roles.
    users.push({ username, email, password: hashPassword(password), role: 'user', createdAt: new Date().toISOString() });
    writeJson(USERS_FILE, users);
    return res.status(201).json({ message: 'Registration successful.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/login', (req, res, next) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const users = readJson(USERS_FILE, []);
    const user = Array.isArray(users) ? users.find(item => item.username.toLowerCase() === username.toLowerCase()) : null;
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Upgrade legacy plaintext JSON passwords after a successful login.
    if (typeof user.password === 'string') {
      user.password = hashPassword(password);
      writeJson(USERS_FILE, users);
    }
    return res.json({ message: 'Login successful.', user: { username: user.username, role: user.role || 'user' } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', (_req, res, next) => {
  try {
    const products = readJson(PRODUCTS_FILE, []);
    if (!Array.isArray(products)) return res.status(500).json({ error: 'Product data is invalid.' });
    return res.json(products);
  } catch (error) {
    next(error);
  }
});

app.get('/api/music', (_req, res, next) => {
  try {
    if (!fs.existsSync(MUSIC_DIR)) return res.json([]);
    const files = fs.readdirSync(MUSIC_DIR, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.mp3'))
      .map(entry => '/music/' + encodeURIComponent(entry.name))
      .sort((a, b) => a.localeCompare(b));
    return res.json(files);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(PUBLIC_DIR, {
  extensions: ['html'],
  dotfiles: 'deny',
  index: 'index.html'
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found.' });
  return next();
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Ink Spirit / Sea Garden server running at http://localhost:${PORT}`));
}

module.exports = app;
