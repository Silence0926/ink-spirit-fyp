'use strict';

const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MUSIC_DIR = path.join(PUBLIC_DIR, 'music');
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  sessions: path.join(DATA_DIR, 'sessions.json'),
  products: path.join(DATA_DIR, 'products.json'),
  carts: path.join(DATA_DIR, 'carts.json'),
  orders: path.join(DATA_DIR, 'orders.json')
};
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'inkspirit_session';
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
}
function id(prefix = '') { return prefix + crypto.randomUUID(); }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { algorithm: 'scrypt', salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function verifyPassword(password, stored) {
  if (stored && typeof stored === 'object' && stored.algorithm === 'scrypt') {
    try {
      const actual = crypto.scryptSync(password, stored.salt, 64);
      const expected = Buffer.from(stored.hash, 'hex');
      return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    } catch { return false; }
  }
  return typeof stored === 'string' && stored === password;
}
function safeUser(user) {
  return { id: user.id, username: user.username, email: user.email || '', role: user.role || 'user' };
}
function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const item of raw.split(';')) {
    const index = item.indexOf('=');
    if (index > -1 && item.slice(0, index).trim() === name) return decodeURIComponent(item.slice(index + 1).trim());
  }
  return '';
}
function sessionToken(req) {
  const token = getCookie(req, COOKIE_NAME);
  return /^[a-f0-9]{64}$/.test(token) ? token : '';
}
function findSession(req) {
  const token = sessionToken(req);
  if (!token) return null;
  const digest = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = readJson(FILES.sessions, []);
  const session = sessions.find(item => item.tokenHash === digest && item.expiresAt > Date.now());
  if (!session) return null;
  const users = readJson(FILES.users, []);
  const user = users.find(item => item.id === session.userId);
  return user ? { user, session, token } : null;
}
function requireAuth(req, res, next) {
  const auth = findSession(req);
  if (!auth) return res.status(401).json({ error: 'Please log in to continue.' });
  req.user = auth.user;
  req.session = auth.session;
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    const auth = findSession(req);
    if (!auth) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(auth.user.role)) return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    req.user = auth.user;
    req.session = auth.session;
    next();
  };
}
function createSession(user, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readJson(FILES.sessions, []).filter(item => item.expiresAt > Date.now());
  sessions.push({
    id: id('ses_'),
    userId: user.id,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL
  });
  writeJson(FILES.sessions, sessions);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL
  });
}
function clearSession(req, res) {
  const token = sessionToken(req);
  if (token) {
    const digest = crypto.createHash('sha256').update(token).digest('hex');
    writeJson(FILES.sessions, readJson(FILES.sessions, []).filter(item => item.tokenHash !== digest));
  }
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
}
function ensureAdminBootstrap() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;
  const users = readJson(FILES.users, []);
  if (!Array.isArray(users)) throw new Error('User data must be an array.');
  const existing = users.find(user => user.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      writeJson(FILES.users, users);
    }
    return;
  }
  users.push({
    id: id('usr_'), username, email: process.env.ADMIN_EMAIL || '',
    password: hashPassword(password), role: 'admin', createdAt: new Date().toISOString()
  });
  writeJson(FILES.users, users);
}
function seedProducts() {
  const current = readJson(FILES.products, null);
  if (Array.isArray(current) && current.length) return;
  writeJson(FILES.products, [
    { id:'koi-001', name:'Japanese Koi', category:'Ornamental Fish', description:'A graceful ornamental carp for a properly designed pond.', price:180, currency:'MYR', stock:12, image:'/images/products/koi-card.svg', active:true },
    { id:'betta-001', name:'Siamese Fighting Fish', category:'Ornamental Fish', description:'A freshwater betta. Keep individually or with carefully selected compatible tank mates.', price:35, currency:'MYR', stock:18, image:'/images/products/betta-card.svg', active:true },
    { id:'tank-001', name:'Glass Aquarium 60L', category:'Aquarium', description:'A 60-litre glass aquarium for a suitable freshwater setup.', price:229, currency:'MYR', stock:8, image:'/images/products/aquarium-card.svg', active:true },
    { id:'filter-001', name:'QuietFlow Filter', category:'Equipment', description:'A compact filtration unit for a correctly sized aquarium.', price:89, currency:'MYR', stock:20, image:'/images/products/filter-card.svg', active:true },
    { id:'food-001', name:'Premium Fish Food', category:'Food', description:'Daily fish food. Select a feed suitable for the species kept.', price:25, currency:'MYR', stock:40, image:'/images/products/food-card.svg', active:true },
    { id:'plant-001', name:'Aquatic Plant Bundle', category:'Aquatic Plants', description:'A starter bundle of aquatic plants for planted aquariums.', price:42, currency:'MYR', stock:25, image:'/images/products/plants-card.svg', active:true }
  ]);
}
function validateProduct(input, partial = false) {
  const result = {};
  const fields = ['name', 'category', 'description', 'image'];
  for (const field of fields) {
    if (partial && input[field] === undefined) continue;
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > (field === 'description' ? 1200 : 160)) {
      throw new Error('Invalid product field: ' + field);
    }
    result[field] = input[field].trim();
  }
  if (!partial || input.price !== undefined) {
    if (!Number.isFinite(input.price) || input.price < 0 || input.price > 1000000) throw new Error('Price must be a valid non-negative number.');
    result.price = Math.round(input.price * 100) / 100;
  }
  if (!partial || input.stock !== undefined) {
    if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > 1000000) throw new Error('Stock must be a non-negative integer.');
    result.stock = input.stock;
  }
  if (input.active !== undefined) {
    if (typeof input.active !== 'boolean') throw new Error('Active must be true or false.');
    result.active = input.active;
  }
  return result;
}
function getCart(userId) {
  const carts = readJson(FILES.carts, {});
  return Array.isArray(carts[userId]) ? carts[userId] : [];
}
function saveCart(userId, items) {
  const carts = readJson(FILES.carts, {});
  carts[userId] = items;
  writeJson(FILES.carts, carts);
}
function getActiveProduct(productId) {
  return readJson(FILES.products, []).find(product => product.id === productId && product.active !== false);
}
function cartSummary(items) {
  const products = readJson(FILES.products, []);
  let totalCents = 0;
  const lines = items.map(item => {
    const product = products.find(p => p.id === item.productId && p.active !== false);
    if (!product) throw new Error('A product in your cart is no longer available.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('Invalid cart quantity.');
    if (product.stock < item.quantity) throw new Error('Insufficient stock for ' + product.name + '.');
    const unitCents = Math.round(product.price * 100);
    totalCents += unitCents * item.quantity;
    return { productId: product.id, name: product.name, image: product.image, unitPrice: product.price, quantity: item.quantity, lineTotal: unitCents * item.quantity / 100 };
  });
  return { lines, totalCents, total: totalCents / 100 };
}
function billplzConfigured() {
  return Boolean(process.env.BILLPLZ_API_KEY && process.env.BILLPLZ_COLLECTION_ID && process.env.PUBLIC_BASE_URL);
}
async function billplzRequest(url, options = {}) {
  const key = process.env.BILLPLZ_API_KEY;
  const auth = Buffer.from(key + ':').toString('base64');
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: 'Basic ' + auth, ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message?.join?.(', ') || data.error || 'Payment provider request failed.');
  return data;
}

ensureAdminBootstrap();
seedProducts();

app.get('/api/health', (_req, res) => res.json({ status:'ok', service:'ink-spirit', version:'2.0.0', timestamp:new Date().toISOString() }));

app.post('/api/register', (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({ error:'Please provide a valid email address.' });
  if (username.length < 3 || username.length > 40 || password.length < 8 || password.length > 200) return res.status(400).json({ error:'Username must be 3–40 characters and password 8–200 characters.' });
  const users = readJson(FILES.users, []);
  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error:'Username already exists.' });
  const user = { id:id('usr_'), username, email, password:hashPassword(password), role:'user', createdAt:new Date().toISOString() };
  users.push(user);
  writeJson(FILES.users, users);
  createSession(user, res);
  res.status(201).json({ message:'Registration successful.', user:safeUser(user) });
});

const loginAttempts = new Map();
app.post('/api/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const attempt = loginAttempts.get(ip) || { count:0, resetAt:Date.now() + 15 * 60 * 1000 };
  if (attempt.resetAt < Date.now()) { attempt.count = 0; attempt.resetAt = Date.now() + 15 * 60 * 1000; }
  if (attempt.count >= 20) return res.status(429).json({ error:'Too many login attempts. Try again later.' });
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const users = readJson(FILES.users, []);
  const user = users.find(item => item.username.toLowerCase() === username.toLowerCase());
  if (!user || !verifyPassword(password, user.password)) {
    attempt.count += 1; loginAttempts.set(ip, attempt);
    return res.status(401).json({ error:'Invalid username or password.' });
  }
  loginAttempts.delete(ip);
  if (typeof user.password === 'string') { user.password = hashPassword(password); writeJson(FILES.users, users); }
  createSession(user, res);
  res.json({ message:'Login successful.', user:safeUser(user) });
});

app.get('/api/me', requireAuth, (req, res) => res.json({ user:safeUser(req.user) }));
app.post('/api/logout', (req, res) => { clearSession(req, res); res.json({ message:'Logged out.' }); });

app.get('/api/products', (_req, res) => {
  const products = readJson(FILES.products, []);
  res.json(products.filter(product => product.active !== false));
});
app.get('/api/admin/products', requireRole('admin', 'manager'), (_req, res) => res.json(readJson(FILES.products, [])));
app.post('/api/admin/products', requireRole('admin', 'manager'), (req, res) => {
  try {
    const product = { id:id('prd_'), ...validateProduct(req.body), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
    const products = readJson(FILES.products, []);
    products.push(product); writeJson(FILES.products, products);
    res.status(201).json({ product });
  } catch (error) { res.status(400).json({ error:error.message }); }
});
app.patch('/api/admin/products/:id', requireRole('admin', 'manager'), (req, res) => {
  try {
    const products = readJson(FILES.products, []);
    const index = products.findIndex(product => product.id === req.params.id);
    if (index < 0) return res.status(404).json({ error:'Product not found.' });
    products[index] = { ...products[index], ...validateProduct(req.body, true), updatedAt:new Date().toISOString() };
    writeJson(FILES.products, products); res.json({ product:products[index] });
  } catch (error) { res.status(400).json({ error:error.message }); }
});
app.delete('/api/admin/products/:id', requireRole('admin'), (req, res) => {
  const products = readJson(FILES.products, []);
  const product = products.find(item => item.id === req.params.id);
  if (!product) return res.status(404).json({ error:'Product not found.' });
  product.active = false; product.updatedAt = new Date().toISOString();
  writeJson(FILES.products, products);
  res.json({ message:'Product archived.' });
});
app.get('/api/admin/orders', requireRole('admin', 'manager'), (_req, res) => {
  const orders = readJson(FILES.orders, []);
  res.json(orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
});
app.get('/api/admin/users', requireRole('admin'), (_req, res) => {
  res.json(readJson(FILES.users, []).map(safeUser));
});
app.patch('/api/admin/users/:id/role', requireRole('admin'), (req, res) => {
  const allowed = ['user', 'manager', 'admin'];
  if (!allowed.includes(req.body.role)) return res.status(400).json({ error:'Invalid role.' });
  const users = readJson(FILES.users, []);
  const user = users.find(item => item.id === req.params.id);
  if (!user) return res.status(404).json({ error:'User not found.' });
  if (user.id === req.user.id && req.body.role !== 'admin') return res.status(400).json({ error:'You cannot remove your own administrator role.' });
  user.role = req.body.role; writeJson(FILES.users, users);
  res.json({ user:safeUser(user) });
});

app.get('/api/cart', requireAuth, (req, res) => {
  const items = getCart(req.user.id);
  try { res.json(cartSummary(items)); } catch (error) { res.status(409).json({ error:error.message }); }
});
app.post('/api/cart/items', requireAuth, (req, res) => {
  const productId = typeof req.body.productId === 'string' ? req.body.productId : '';
  const quantity = Number(req.body.quantity || 1);
  const product = getActiveProduct(productId);
  if (!product) return res.status(404).json({ error:'Product not found.' });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ error:'Quantity must be between 1 and 99.' });
  const items = getCart(req.user.id);
  const existing = items.find(item => item.productId === productId);
  if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
  else items.push({ productId, quantity });
  saveCart(req.user.id, items);
  res.json(cartSummary(items));
});
app.patch('/api/cart/items/:productId', requireAuth, (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ error:'Quantity must be between 1 and 99.' });
  const items = getCart(req.user.id);
  const item = items.find(entry => entry.productId === req.params.productId);
  if (!item) return res.status(404).json({ error:'Cart item not found.' });
  item.quantity = quantity; saveCart(req.user.id, items);
  try { res.json(cartSummary(items)); } catch (error) { res.status(409).json({ error:error.message }); }
});
app.delete('/api/cart/items/:productId', requireAuth, (req, res) => {
  const items = getCart(req.user.id).filter(item => item.productId !== req.params.productId);
  saveCart(req.user.id, items); res.json(cartSummary(items));
});
app.delete('/api/cart', requireAuth, (req, res) => { saveCart(req.user.id, []); res.json({ lines:[], total:0, totalCents:0 }); });

app.get('/api/orders', requireAuth, (req, res) => {
  res.json(readJson(FILES.orders, []).filter(order => order.userId === req.user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
});
app.post('/api/checkout', requireAuth, async (req, res) => {
  if (!billplzConfigured()) return res.status(503).json({ error:'Online payment is not configured. Add Billplz sandbox credentials and PUBLIC_BASE_URL.' });
  try {
    const items = getCart(req.user.id);
    if (!items.length) return res.status(400).json({ error:'Your cart is empty.' });
    const summary = cartSummary(items);
    const users = readJson(FILES.users, []);
    const customer = users.find(user => user.id === req.user.id);
    if (!customer.email) return res.status(400).json({ error:'Add an email address to your account before checkout.' });
    const order = {
      id:id('ord_'), userId:req.user.id, items:summary.lines, total:summary.total,
      currency:'MYR', status:'pending_payment', paymentProvider:'billplz',
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
    };
    const orders = readJson(FILES.orders, []);
    orders.push(order); writeJson(FILES.orders, orders);
    const base = process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
    const form = new URLSearchParams({
      collection_id:process.env.BILLPLZ_COLLECTION_ID,
      email:customer.email,
      name:req.user.username,
      amount:String(summary.totalCents),
      description:'Sea Garden order ' + order.id.slice(-12),
      callback_url:base + '/api/payments/billplz/callback',
      redirect_url:base + '/payment-result.html?order=' + encodeURIComponent(order.id),
      reference_1_label:'Order ID',
      reference_1:order.id,
      deliver:'false'
    });
    const endpoint = process.env.BILLPLZ_MODE === 'live' ? 'https://www.billplz.com/api/v3/bills' : 'https://www.billplz-sandbox.com/api/v3/bills';
    const bill = await billplzRequest(endpoint, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body:form });
    order.paymentId = bill.id;
    order.paymentUrl = bill.url;
    order.updatedAt = new Date().toISOString();
    writeJson(FILES.orders, orders);
    res.status(201).json({ orderId:order.id, paymentUrl:bill.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(502).json({ error:'Unable to create payment request. Please try again.' });
  }
});
app.post('/api/payments/billplz/callback', async (req, res) => {
  try {
    const billId = String(req.body.id || '');
    if (!billId) return res.status(400).send('Missing bill ID.');
    const orders = readJson(FILES.orders, []);
    const order = orders.find(item => item.paymentId === billId);
    if (!order) return res.status(404).send('Order not found.');
    const base = process.env.BILLPLZ_MODE === 'live' ? 'https://www.billplz.com/api/v3/bills/' : 'https://www.billplz-sandbox.com/api/v3/bills/';
    const verifiedBill = await billplzRequest(base + encodeURIComponent(billId));
    const verifiedPaid = verifiedBill.paid === true || verifiedBill.paid === 'true';
    if (verifiedPaid && Number(verifiedBill.paid_amount || verifiedBill.amount) === Math.round(order.total * 100)) {
      if (order.status !== 'paid') {
        order.status = 'paid'; order.paidAt = new Date().toISOString(); order.updatedAt = order.paidAt;
        writeJson(FILES.orders, orders);
        const products = readJson(FILES.products, []);
        for (const line of order.items) {
          const product = products.find(item => item.id === line.productId);
          if (product) product.stock = Math.max(0, product.stock - line.quantity);
        }
        writeJson(FILES.products, products);
        const carts = readJson(FILES.carts, {});
        carts[order.userId] = [];
        writeJson(FILES.carts, carts);
      }
    } else if (order.status !== 'paid') {
      order.status = 'payment_failed'; order.updatedAt = new Date().toISOString(); writeJson(FILES.orders, orders);
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Billplz callback verification failed:', error);
    res.status(500).send('Callback verification failed.');
  }
});
app.get('/api/payment-status/:orderId', requireAuth, (req, res) => {
  const order = readJson(FILES.orders, []).find(item => item.id === req.params.orderId && item.userId === req.user.id);
  if (!order) return res.status(404).json({ error:'Order not found.' });
  res.json({ orderId:order.id, status:order.status, total:order.total, currency:order.currency });
});

app.get('/api/music', (_req, res) => {
  if (!fs.existsSync(MUSIC_DIR)) return res.json([]);
  const files = fs.readdirSync(MUSIC_DIR, { withFileTypes:true }).filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')).map(entry => '/music/' + encodeURIComponent(entry.name));
  res.json(files);
});
app.use(express.static(PUBLIC_DIR, { extensions:['html'], dotfiles:'deny', index:'index.html' }));
app.use((req, res) => req.path.startsWith('/api/') ? res.status(404).json({ error:'API route not found.' }) : res.status(404).send('Not found.'));
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error:'Internal server error.' }); });

if (require.main === module) app.listen(PORT, () => console.log('Ink Spirit / Sea Garden running at http://localhost:' + PORT));
module.exports = app;
