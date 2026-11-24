'use strict';

const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SPECIES_FILE = path.join(__dirname, 'species-catalogue.json');
const SPECIES_CATALOGUE = JSON.parse(fs.readFileSync(SPECIES_FILE, 'utf8'));
const SPECIES_BY_ID = new Map(SPECIES_CATALOGUE.map(species => [species.id, species]));
const MUSIC_DIR = path.join(PUBLIC_DIR, 'music');
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  sessions: path.join(DATA_DIR, 'sessions.json'),
  products: path.join(DATA_DIR, 'products.json'),
  carts: path.join(DATA_DIR, 'carts.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  inventoryMovements: path.join(DATA_DIR, 'inventory-movements.json'),
  creatureProgress: path.join(DATA_DIR, 'creature-progress.json'),
  explorationProgress: path.join(DATA_DIR, 'exploration-progress.json'),
  creatureCare: path.join(DATA_DIR, 'creature-care.json'),
  creatureJournal: path.join(DATA_DIR, 'creature-journal.json'),
  aquariums: path.join(DATA_DIR, 'aquariums.json')
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

function recordCreatureEvent(userId, event) {
  const all = readJson(FILES.creatureJournal, {});
  const history = Array.isArray(all[userId]) ? all[userId] : [];
  history.push({
    id:id('evt_'),
    type:event.type,
    creatureId:event.creatureId,
    title:event.title,
    detail:event.detail,
    createdAt:new Date().toISOString()
  });
  all[userId] = history.slice(-100);
  writeJson(FILES.creatureJournal, all);
}

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
  const cookie = COOKIE_NAME + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + Math.floor(SESSION_TTL / 1000) + (isProduction ? '; Secure' : '');
  res.setHeader('Set-Cookie', cookie);
}
function clearSession(req, res) {
  const token = sessionToken(req);
  if (token) {
    const digest = crypto.createHash('sha256').update(token).digest('hex');
    writeJson(FILES.sessions, readJson(FILES.sessions, []).filter(item => item.tokenHash !== digest));
  }
  res.setHeader('Set-Cookie', COOKIE_NAME + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + (isProduction ? '; Secure' : ''));
}
function ensureUserIds() {
  const users = readJson(FILES.users, []);
  let changed = false;
  for (const user of users) {
    if (!user.id) { user.id = id('usr_'); changed = true; }
    if (!user.role) { user.role = 'user'; changed = true; }
  }
  if (changed) writeJson(FILES.users, users);
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
  const current = readJson(FILES.products, []);
  if (!Array.isArray(current)) throw new Error('Product data must be an array.');
  const starter = [
    { id:'koi-001', name:'Japanese Koi', category:'Ornamental Fish', description:'A graceful ornamental carp for a properly designed pond.', price:180, currency:'MYR', stock:12, image:'/images/products/koi-card.svg', active:true },
    { id:'betta-001', name:'Siamese Fighting Fish', category:'Ornamental Fish', description:'A freshwater betta. Keep individually or with carefully selected compatible tank mates.', price:35, currency:'MYR', stock:18, image:'/images/products/betta-card.svg', active:true },
    { id:'tank-001', name:'Glass Aquarium 60L', category:'Aquarium', description:'A 60-litre glass aquarium for a suitable freshwater setup.', price:229, currency:'MYR', stock:8, image:'/images/products/aquarium-card.svg', active:true },
    { id:'filter-001', name:'QuietFlow Filter', category:'Equipment', description:'A compact filtration unit for a correctly sized aquarium.', price:89, currency:'MYR', stock:20, image:'/images/products/filter-card.svg', active:true },
    { id:'food-001', name:'Premium Fish Food', category:'Food', description:'Daily fish food. Select a feed suitable for the species kept.', price:25, currency:'MYR', stock:40, image:'/images/products/food-card.svg', active:true },
    { id:'plant-001', name:'Aquatic Plant Bundle', category:'Aquatic Plants', description:'A starter bundle of aquatic plants for planted aquariums.', price:42, currency:'MYR', stock:25, image:'/images/products/plants-card.svg', active:true },
    { id:'goldfish-001', name:'Goldfish Pair', category:'Ornamental Fish', description:'Captive-bred goldfish. Provide adequate tank volume, strong filtration and compatible tank mates.', price:48, currency:'MYR', stock:10, image:'/images/products/goldfish-card.svg', active:true },
    { id:'guppy-001', name:'Guppy Trio', category:'Ornamental Fish', description:'Captive-bred guppies for a cycled freshwater aquarium. Plan for livebearer reproduction.', price:28, currency:'MYR', stock:16, image:'/images/products/guppy-card.svg', active:true },
    { id:'clownfish-001', name:'Ocellaris Clownfish', category:'Marine Fish', description:'Captive-bred marine fish. Requires a mature saltwater aquarium and stable salinity.', price:95, currency:'MYR', stock:6, image:'/images/products/clownfish-card.svg', active:true },
    { id:'testkit-001', name:'Water Test Kit', category:'Equipment', description:'Test aquarium water parameters regularly; follow the kit instructions for each test.', price:55, currency:'MYR', stock:14, image:'/images/products/filter-card.svg', active:true }
  ];
  const existingIds = new Set(current.map(product => product.id));
  const missing = starter.filter(product => !existingIds.has(product.id));
  if (missing.length) writeJson(FILES.products, [...current, ...missing]);
}
function validateProduct(input, partial = false) {
  const result = {};
  if (input.speciesId !== undefined) {
    if (input.speciesId !== null && input.speciesId !== '' && (typeof input.speciesId !== 'string' || !SPECIES_BY_ID.has(input.speciesId))) throw new Error('Unknown species reference.');
    result.speciesId = input.speciesId || null;
  }
  const fields = ['name', 'category', 'description', 'image'];
  for (const field of fields) {
    if (partial && input[field] === undefined) continue;
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > (field === 'description' ? 1200 : (field === 'image' ? 500 : 160))) {
      throw new Error('Invalid product field: ' + field);
    }
    if (field === 'image') {
      const image = input[field].trim();
      const isLocalImage = image.startsWith('/') && !image.startsWith('//') && !image.includes('..') && !image.includes('\\') && /^\/(?:images|uploads)\/[a-zA-Z0-9_./-]+\.(?:svg|png|jpe?g|webp)$/i.test(image);
      let isHttpsImage = false;
      try { const parsed = new URL(image); isHttpsImage = parsed.protocol === 'https:' && Boolean(parsed.hostname); } catch {}
      if (!isLocalImage && !isHttpsImage) throw new Error('Image must be a site image path or HTTPS URL.');
      result[field] = image;
    } else {
      result[field] = input[field].trim();
    }
  }
  if (!partial || input.price !== undefined) {
    if (!Number.isFinite(input.price) || input.price < 0 || input.price > 1000000) throw new Error('Price must be a valid non-negative number.');
    result.price = Math.round(input.price * 100) / 100;
  }
  if (!partial || input.stock !== undefined) {
    if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > 1000000) throw new Error('Stock must be a non-negative integer.');
    result.stock = input.stock;
  }
  if (input.images !== undefined) {
    if (!Array.isArray(input.images) || input.images.length > 8) throw new Error('Product gallery must contain no more than 8 images.');
    const images = [];
    for (const value of input.images) {
      if (typeof value !== 'string' || !value.trim() || value.length > 500) throw new Error('Invalid product gallery image.');
      const image = value.trim();
      const isLocalImage = image.startsWith('/') && !image.startsWith('//') && !image.includes('..') && !image.includes('\\') && /^\/(?:images|uploads)\/[a-zA-Z0-9_./-]+\.(?:svg|png|jpe?g|webp)$/i.test(image);
      let isHttpsImage = false;
      try { const parsed = new URL(image); isHttpsImage = parsed.protocol === 'https:' && Boolean(parsed.hostname); } catch {}
      if (!isLocalImage && !isHttpsImage) throw new Error('Gallery images must be site image paths or HTTPS URLs.');
      if (!images.includes(image)) images.push(image);
    }
    result.images = images;
  }
  if (input.specifications !== undefined) {
    const source = input.specifications;
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Product specifications must be an object.');
    const allowedWater = ['', 'freshwater', 'marine', 'brackish', 'any'];
    const allowedDifficulty = ['', 'beginner', 'intermediate', 'advanced'];
    const waterType = source.waterType === undefined ? '' : source.waterType;
    const difficulty = source.difficulty === undefined ? '' : source.difficulty;
    if (!allowedWater.includes(waterType)) throw new Error('Invalid water type.');
    if (!allowedDifficulty.includes(difficulty)) throw new Error('Invalid care difficulty.');
    const numberField = (key, min, max) => {
      const value = source[key];
      if (value === undefined || value === null || value === '') return null;
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('Invalid product specification: ' + key);
      return Math.round(value * 10) / 10;
    };
    const minTankLitres = numberField('minTankLitres', 1, 100000);
    const temperatureMinC = numberField('temperatureMinC', 0, 45);
    const temperatureMaxC = numberField('temperatureMaxC', 0, 45);
    const adultSizeCm = numberField('adultSizeCm', 0.1, 500);
    if (temperatureMinC !== null && temperatureMaxC !== null && temperatureMinC > temperatureMaxC) throw new Error('Minimum temperature cannot exceed maximum temperature.');
    const careNotes = source.careNotes === undefined ? '' : source.careNotes;
    if (typeof careNotes !== 'string' || careNotes.length > 500) throw new Error('Care notes must be 500 characters or fewer.');
    result.specifications = { waterType, difficulty, minTankLitres, temperatureMinC, temperatureMaxC, adultSizeCm, careNotes:careNotes.trim() };
  }
  if (input.stockThreshold !== undefined) {
    if (!Number.isInteger(input.stockThreshold) || input.stockThreshold < 0 || input.stockThreshold > 1000000) throw new Error('Stock threshold must be a non-negative integer.');
    result.stockThreshold = input.stockThreshold;
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
    return { productId: product.id, name: product.name, image: product.image, images: Array.isArray(product.images) ? product.images : [product.image], unitPrice: product.price, quantity: item.quantity, lineTotal: unitCents * item.quantity / 100 };
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

ensureUserIds();
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

const CREATURE_IDS = ['koi', 'dragon', 'snake', 'turtle'];
const DAILY_INTERACTION_LIMIT = 50;
function defaultCreatureProgress() {
  return Object.fromEntries(CREATURE_IDS.map(creatureId => [creatureId, {
    experience:0, level:1, visits:0, totalExperience:0
  }]));
}
function getCreatureProgress(userId) {
  const all = readJson(FILES.creatureProgress, {});
  const record = all[userId] || {};
  const creatures = defaultCreatureProgress();
  for (const creatureId of CREATURE_IDS) {
    const saved = record.creatures?.[creatureId];
    if (saved && Number.isInteger(saved.experience) && saved.experience >= 0 &&
        Number.isInteger(saved.level) && saved.level >= 1) {
      creatures[creatureId] = {
        experience:saved.experience,
        level:saved.level,
        visits:Number.isInteger(saved.visits) && saved.visits >= 0 ? saved.visits : 0,
        totalExperience:Number.isInteger(saved.totalExperience) && saved.totalExperience >= 0 ? saved.totalExperience : 0
      };
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const daily = record.daily?.date === today && Number.isInteger(record.daily.count)
    ? { date:today, count:Math.max(0, record.daily.count) }
    : { date:today, count:0 };
  return {
    selectedCreature:CREATURE_IDS.includes(record.selectedCreature) ? record.selectedCreature : 'koi',
    creatures,
    daily
  };
}
function saveCreatureProgress(userId, progress) {
  const all = readJson(FILES.creatureProgress, {});
  all[userId] = progress;
  writeJson(FILES.creatureProgress, all);
}
function publicCreatureProgress(progress) {
  return {
    selectedCreature:progress.selectedCreature,
    creatures:progress.creatures,
    dailyInteractions:{ count:progress.daily.count, limit:DAILY_INTERACTION_LIMIT, date:progress.daily.date }
  };
}
app.get('/api/creatures/progress', requireAuth, (req, res) => {
  res.json(publicCreatureProgress(getCreatureProgress(req.user.id)));
});
app.patch('/api/creatures/selected', requireAuth, (req, res) => {
  const creatureId = req.body.creatureId;
  if (!CREATURE_IDS.includes(creatureId)) return res.status(400).json({ error:'Unknown creature.' });
  const progress = getCreatureProgress(req.user.id);
  progress.selectedCreature = creatureId;
  saveCreatureProgress(req.user.id, progress);
  res.json(publicCreatureProgress(progress));
});
app.post('/api/creatures/interact', requireAuth, (req, res) => {
  const creatureId = req.body.creatureId;
  if (!CREATURE_IDS.includes(creatureId)) return res.status(400).json({ error:'Unknown creature.' });
  const progress = getCreatureProgress(req.user.id);
  if (progress.daily.count >= DAILY_INTERACTION_LIMIT) {
    return res.status(429).json({ error:'今日的互动次数已达上限，请明天再来。' });
  }
  const creature = progress.creatures[creatureId];
  const reward = 10;
  creature.experience += reward;
  creature.totalExperience += reward;
  creature.visits += 1;
  while (creature.experience >= creature.level * 100) {
    creature.experience -= creature.level * 100;
    creature.level += 1;
  }
  progress.daily.count += 1;
  progress.selectedCreature = creatureId;
  saveCreatureProgress(req.user.id, progress);

  const care = getCreatureCare(req.user.id);
  care.creatures[creatureId].bond += 1;
  saveCreatureCare(req.user.id, care);
  recordCreatureEvent(req.user.id, { type:'interaction', creatureId, title:'相伴互动', detail:'与伙伴相伴片刻，获得 ' + reward + ' 点灵息，亲密度增加 1。' });
  res.json({ reward, progress:publicCreatureProgress(progress), care:publicCreatureCare(care, req.user.id) });
});




const CARE_FOODS = {
  'moon-dew': { name:'月露', satiety:20 },
  'lotus-seed': { name:'莲心', satiety:20 },
  'cloud-fruit': { name:'云果', satiety:20 }
};
const DAILY_FEED_LIMIT = 3;
const DAILY_ABILITY_LIMIT = 5;
const CREATURE_ABILITIES = {
  koi:{ id:'ripple-leap', name:'锦鲤跃波', seal:'跃', description:'跃出水面，唤起层层水纹。', effect:'ripples' },
  dragon:{ id:'cloudborne-presence', name:'云龙现世', seal:'云', description:'云气舒展，龙影穿过山岚。', effect:'cloud' },
  snake:{ id:'veil-of-ink', name:'幽影潜行', seal:'影', description:'墨影隐现，于竹影间悄然穿行。', effect:'veil' },
  turtle:{ id:'tortoise-ward', name:'玄甲守心', seal:'甲', description:'玄甲凝光，水泽泛起守护涟漪。', effect:'ward' }
};
function getCreatureCare(userId) {
  const all = readJson(FILES.creatureCare, {});
  const record = all[userId] || {};
  const today = new Date().toISOString().slice(0, 10);
  const creatures = {};
  for (const creatureId of CREATURE_IDS) {
    const saved = record.creatures?.[creatureId] || {};
    const daily = saved.daily?.date === today && Number.isInteger(saved.daily.count)
      ? { date:today, count:Math.max(0, saved.daily.count) }
      : { date:today, count:0 };
    const storedSatiety = Number.isInteger(saved.satiety) ? Math.min(100, Math.max(0, saved.satiety)) : 60;
    const lastFedAt = saved.lastFedAt || null;
    const elapsed = lastFedAt ? Math.max(0, Date.now() - Date.parse(lastFedAt)) : 0;
    const decay = Number.isFinite(elapsed) ? Math.floor(elapsed / (6 * 60 * 60 * 1000)) * 10 : 0;
    const satiety = Math.max(0, storedSatiety - decay);
    const bond = Number.isInteger(saved.bond) ? Math.max(0, saved.bond) : 0;
    const abilityDaily = saved.abilityDaily?.date === today && Number.isInteger(saved.abilityDaily.count)
      ? { date:today, count:Math.max(0, saved.abilityDaily.count) }
      : { date:today, count:0 };
    creatures[creatureId] = { satiety, bond, daily, abilityDaily, lastFedAt };
  }
  return { creatures };
}
function saveCreatureCare(userId, care) {
  const all = readJson(FILES.creatureCare, {});
  all[userId] = care;
  writeJson(FILES.creatureCare, all);
}
function getCreatureEvolution(level, bond) {
  if (level >= 10 && bond >= 50) {
    return { id:'transcendent', stage:3, name:'灵韵化境', description:'灵息充盈，灵契相通。', nextLevel:null, nextBond:null };
  }
  if (level >= 5 && bond >= 20) {
    return { id:'awakened', stage:2, name:'灵脉初醒', description:'灵脉苏醒，形态显现。', nextLevel:10, nextBond:50 };
  }
  return {
    id:'young', stage:1, name:'初生灵形', description:'灵性尚在积蓄，等待下一次蜕变。',
    nextLevel:5, nextBond:20
  };
}
function publicCreatureCare(care, userId) {
  const progression = userId ? getCreatureProgress(userId) : null;
  return {
    creatures:Object.fromEntries(CREATURE_IDS.map(creatureId => {
      const item = care.creatures[creatureId];
      return [creatureId, {
        satiety:item.satiety,
        bond:item.bond,
        mood:item.satiety >= 70 ? '安然' : item.satiety >= 35 ? '平静' : '需要照料',
        bondStage:item.bond >= 100 ? '心契' : item.bond >= 50 ? '亲近' : item.bond >= 20 ? '熟悉' : '初识',
        evolution:getCreatureEvolution(progression?.creatures?.[creatureId]?.level || 1, item.bond),
        ability:{
          ...CREATURE_ABILITIES[creatureId],
          unlocked:item.bond >= 50 && (progression?.creatures?.[creatureId]?.level || 1) >= 5,
          unlockBond:50,
          unlockLevel:5,
          dailyUses:{ count:item.abilityDaily.count, limit:DAILY_ABILITY_LIMIT, date:item.abilityDaily.date }
        },
        dailyFeeds:{ count:item.daily.count, limit:DAILY_FEED_LIMIT, date:item.daily.date },
        lastFedAt:item.lastFedAt
      }];
    }))
  };
}
app.post('/api/creatures/ability', requireAuth, (req, res) => {
  const creatureId = req.body.creatureId;
  if (!CREATURE_IDS.includes(creatureId)) return res.status(400).json({ error:'Unknown creature.' });
  const ability = CREATURE_ABILITIES[creatureId];
  if (req.body.abilityId !== ability.id) return res.status(400).json({ error:'Ability does not match this companion.' });
  const care = getCreatureCare(req.user.id);
  const creature = care.creatures[creatureId];
  const level = getCreatureProgress(req.user.id).creatures[creatureId].level;
  if (creature.bond < 50 || level < 5) {
    return res.status(403).json({ error:'此灵技尚未觉醒：需要等级 LV. 5 与亲密度 50。' });
  }
  if (creature.abilityDaily.count >= DAILY_ABILITY_LIMIT) {
    return res.status(429).json({ error:'今日灵技施展次数已达上限，请明天再来。' });
  }
  creature.abilityDaily.count += 1;
  saveCreatureCare(req.user.id, care);
  recordCreatureEvent(req.user.id, {
    type:'ability', creatureId, title:ability.name,
    detail:ability.description + ' 今日施展 ' + creature.abilityDaily.count + ' / ' + DAILY_ABILITY_LIMIT + ' 次。'
  });
  res.json({ activated:true, ability, care:publicCreatureCare(care, req.user.id) });
});

app.get('/api/creatures/journal', requireAuth, (req, res) => {
  const all = readJson(FILES.creatureJournal, {});
  const events = Array.isArray(all[req.user.id]) ? all[req.user.id] : [];
  res.json({ events:events.slice(-30).reverse() });
});

app.get('/api/creatures/care', requireAuth, (req, res) => {
  res.json(publicCreatureCare(getCreatureCare(req.user.id), req.user.id));
});
app.post('/api/creatures/care/feed', requireAuth, (req, res) => {
  const creatureId = req.body.creatureId;
  const foodId = req.body.foodId;
  if (!CREATURE_IDS.includes(creatureId)) return res.status(400).json({ error:'Unknown creature.' });
  if (!Object.hasOwn(CARE_FOODS, foodId)) return res.status(400).json({ error:'Unknown spirit food.' });
  const care = getCreatureCare(req.user.id);
  const creature = care.creatures[creatureId];
  if (creature.daily.count >= DAILY_FEED_LIMIT) {
    return res.status(429).json({ error:'今日的喂养次数已达上限，请明天再来。' });
  }
  if (creature.satiety >= 100) {
    return res.status(409).json({ error:'伙伴现在已经吃饱了。' });
  }
  const food = CARE_FOODS[foodId];
  creature.satiety = Math.min(100, creature.satiety + food.satiety);
  creature.bond += 5;
  creature.daily.count += 1;
  creature.lastFedAt = new Date().toISOString();
  saveCreatureCare(req.user.id, care);
  recordCreatureEvent(req.user.id, { type:'feeding', creatureId, title:'灵食照料', detail:'奉上' + food.name + '，饱足恢复 ' + food.satiety + ' 点，亲密度增加 5。' });
  res.json({ fed:true, food:food.name, satietyRestored:food.satiety, care:publicCreatureCare(care, req.user.id) });
});

const HABITAT_IDS = ['lotus-pond', 'cloud-mountain', 'bamboo-forest', 'quiet-marsh'];
const HABITAT_REWARD_XP = 25;
function getExplorationProgress(userId) {
  const all = readJson(FILES.explorationProgress, {});
  const record = all[userId] || {};
  return {
    discovered: HABITAT_IDS.filter(habitatId => Array.isArray(record.discovered) && record.discovered.includes(habitatId)),
    discoveries: record.discoveries && typeof record.discoveries === 'object' ? record.discoveries : {}
  };
}
function publicExplorationProgress(progress) {
  return {
    discovered:progress.discovered,
    total:HABITAT_IDS.length,
    habitats:HABITAT_IDS.map(habitatId => ({
      id:habitatId,
      discovered:progress.discovered.includes(habitatId),
      discoveredAt:progress.discoveries[habitatId] || null
    }))
  };
}
app.get('/api/exploration/progress', requireAuth, (req, res) => {
  res.json(publicExplorationProgress(getExplorationProgress(req.user.id)));
});
app.post('/api/exploration/discover', requireAuth, (req, res) => {
  const habitatId = req.body.habitatId;
  if (!HABITAT_IDS.includes(habitatId)) return res.status(400).json({ error:'Unknown habitat.' });
  const exploration = getExplorationProgress(req.user.id);
  if (exploration.discovered.includes(habitatId)) {
    return res.json({ alreadyDiscovered:true, reward:0, exploration:publicExplorationProgress(exploration) });
  }
  exploration.discovered.push(habitatId);
  exploration.discoveries[habitatId] = new Date().toISOString();
  const all = readJson(FILES.explorationProgress, {});
  all[req.user.id] = exploration;
  writeJson(FILES.explorationProgress, all);

  const creatureProgress = getCreatureProgress(req.user.id);
  const companion = creatureProgress.creatures[creatureProgress.selectedCreature];
  companion.experience += HABITAT_REWARD_XP;
  companion.totalExperience += HABITAT_REWARD_XP;
  while (companion.experience >= companion.level * 100) {
    companion.experience -= companion.level * 100;
    companion.level += 1;
  }
  saveCreatureProgress(req.user.id, creatureProgress);
  const realmTitle = { 'lotus-pond':'烟雨荷塘', 'cloud-mountain':'云海山巅', 'bamboo-forest':'幽篁竹林', 'quiet-marsh':'静水泽地' }[habitatId];
  recordCreatureEvent(req.user.id, { type:'exploration', creatureId:creatureProgress.selectedCreature, title:'初访' + realmTitle, detail:'发现新的灵境，当前伙伴获得 ' + HABITAT_REWARD_XP + ' 点灵息。' });
  res.status(201).json({
    alreadyDiscovered:false,
    reward:HABITAT_REWARD_XP,
    rewardedCreature:creatureProgress.selectedCreature,
    creatureProgress:publicCreatureProgress(creatureProgress),
    exploration:publicExplorationProgress(exploration)
  });
});


const ENCYCLOPEDIA_FILE = path.join(__dirname, 'aquarium-encyclopedia.json');
const ENCYCLOPEDIA = JSON.parse(fs.readFileSync(ENCYCLOPEDIA_FILE, 'utf8'));
const ENCYCLOPEDIA_BY_SLUG = new Map(ENCYCLOPEDIA.articles.map(article => [article.slug, article]));
app.get('/api/encyclopedia', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const query = typeof req.query.q === 'string' ? req.query.q.trim().toLocaleLowerCase() : '';
  const articles = ENCYCLOPEDIA.articles.filter(article =>
    (!category || article.category === category) &&
    (!query || [article.title, article.subtitle, article.summary, ...article.tags].join(' ').toLocaleLowerCase().includes(query))
  );
  res.json({ version:ENCYCLOPEDIA.version, updatedAt:ENCYCLOPEDIA.updatedAt, categories:ENCYCLOPEDIA.categories, articles });
});
app.get('/api/encyclopedia/:slug', (req, res) => {
  const article = ENCYCLOPEDIA_BY_SLUG.get(req.params.slug);
  if (!article) return res.status(404).json({ error:'Article not found.' });
  res.json(article);
});
app.post('/api/aquarium/compatibility', (req, res) => {
  const entries = req.body && req.body.species;
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 8) return res.status(400).json({ error:'Select between 1 and 8 species.' });
  const selected = [];
  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || !SPECIES_BY_ID.has(entry.id) || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 30) {
      return res.status(400).json({ error:'Each species must use a catalogue ID and a quantity from 1 to 30.' });
    }
    selected.push({ ...SPECIES_BY_ID.get(entry.id), quantity:entry.quantity });
  }
  const waterTypes = [...new Set(selected.map(item => item.waterType))];
  const issues = [];
  if (waterTypes.length > 1) issues.push({ severity:'incompatible', code:'water-type-mismatch', message:'所选物种需要不同水体类型，不能放入同一个普通水族系统。', species:selected.filter(item => item.waterType !== waterTypes[0]).map(item => item.id) });
  const bettaCount = selected.filter(item => item.id === 'betta').reduce((sum,item)=>sum+item.quantity,0);
  if (bettaCount > 1) issues.push({ severity:'caution', code:'betta-social-risk', message:'暹罗斗鱼具有明显个体与性别相关的攻击风险；仅凭物种名称和数量无法判断能否同缸，请先核实性别、品系、缸体结构与专业饲养条件。', species:['betta'] });
  const hasUnknownPairRules = selected.length > 1 && !issues.some(issue=>issue.severity==='incompatible');
  res.json({
    status:issues.some(issue=>issue.severity==='incompatible')?'incompatible':issues.some(issue=>issue.severity==='caution')?'caution':selected.length===1?'single_species':'insufficient_information',
    selected:selected.map(item=>({id:item.id,commonName:item.commonName,scientificName:item.scientificName,waterType:item.waterType,quantity:item.quantity,care:item.care})),
    issues,
    notes:[
      '相同水体类型不代表物种彼此兼容；本工具不会仅凭淡水/海水标签判定可以混养。',
      '当前物种资料尚未覆盖所有成年体型、温度、行为、食性和空间需求；未知条件不会被视为安全。',
      '新增物种、数量或环境后，应重新评估，并在实际混养前咨询可靠的专业资料或鱼类兽医。'
    ],
    pairAssessment:hasUnknownPairRules?'unknown':selected.length===1?'single_species':'not_applicable'
  });
});

const AQUARIUM_ACTION_LIMIT = 5;
function getUserAquariums(userId) {
  const all = readJson(FILES.aquariums, {});
  return Array.isArray(all[userId]) ? all[userId] : [];
}
function saveUserAquariums(userId, aquariums) {
  const all = readJson(FILES.aquariums, {});
  all[userId] = aquariums;
  writeJson(FILES.aquariums, all);
}
function aquariumSnapshot(aquarium) {
  const now = Date.now();
  const lastAction = Date.parse(aquarium.lastActionAt || aquarium.createdAt);
  const elapsedHours = Number.isFinite(lastAction) ? Math.max(0, (now - lastAction) / 3600000) : 0;
  const waterQuality = Math.max(0, Math.min(100, aquarium.waterQuality - Math.floor(elapsedHours / 24)));
  const cleanliness = Math.max(0, Math.min(100, aquarium.cleanliness - Math.floor(elapsedHours / 36)));
  const fish = aquarium.fish.map(item => ({
    ...item,
    ageDays:Math.max(0, Math.floor((now - Date.parse(item.addedAt)) / 86400000)),
    growthStage:item.growthPoints >= 20 ? '成体' : item.growthPoints >= 7 ? '亚成体' : '幼鱼'
  }));
  return {
    ...aquarium,
    waterQuality,
    cleanliness,
    fish,
    fishCount:fish.reduce((sum,item)=>sum+item.quantity,0),
    speciesCount:fish.length,
    simulationNotice:'虚拟数值仅用于游戏体验，不代表真实水质检测或实际物种生长参数。'
  };
}
app.get('/api/aquariums', requireAuth, (req, res) => {
  res.json({ aquariums:getUserAquariums(req.user.id).map(aquariumSnapshot) });
});
app.post('/api/aquariums', requireAuth, (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const waterType = req.body.waterType;
  const volumeLitres = req.body.volumeLitres;
  if (!name || name.length > 40) return res.status(400).json({ error:'鱼缸名称必须为 1 至 40 个字符。' });
  if (!['freshwater','marine'].includes(waterType)) return res.status(400).json({ error:'请选择淡水或海水系统。' });
  if (typeof volumeLitres !== 'number' || !Number.isFinite(volumeLitres) || volumeLitres < 10 || volumeLitres > 100000) {
    return res.status(400).json({ error:'模拟鱼缸水量必须为 10 至 100000 L。' });
  }
  const aquariums = getUserAquariums(req.user.id);
  if (aquariums.length >= 10) return res.status(409).json({ error:'每位用户最多建立 10 个模拟鱼缸。' });
  const aquarium = {
    id:id('aq_'), name, waterType, volumeLitres:Math.round(volumeLitres*10)/10,
    temperatureC:waterType==='marine'?25:25,
    waterQuality:85, cleanliness:90, fish:[],
    daily:{date:new Date().toISOString().slice(0,10),feeds:0},
    lastActionAt:new Date().toISOString(), createdAt:new Date().toISOString(),
    events:[{id:id('aqevt_'),type:'created',message:'建立了新的模拟水族箱。',createdAt:new Date().toISOString()}]
  };
  aquariums.push(aquarium);
  saveUserAquariums(req.user.id,aquariums);
  res.status(201).json({ aquarium:aquariumSnapshot(aquarium) });
});
app.get('/api/aquariums/:id', requireAuth, (req, res) => {
  const aquarium = getUserAquariums(req.user.id).find(item=>item.id===req.params.id);
  if (!aquarium) return res.status(404).json({ error:'模拟鱼缸不存在。' });
  res.json({ aquarium:aquariumSnapshot(aquarium) });
});
app.post('/api/aquariums/:id/actions', requireAuth, (req, res) => {
  const aquariums = getUserAquariums(req.user.id);
  const aquarium = aquariums.find(item=>item.id===req.params.id);
  if (!aquarium) return res.status(404).json({ error:'模拟鱼缸不存在。' });
  const action = req.body.action;
  const previousActionAt = Date.parse(aquarium.lastActionAt || aquarium.createdAt);
  const elapsedHours = Number.isFinite(previousActionAt) ? Math.max(0,(Date.now()-previousActionAt)/3600000) : 0;
  aquarium.waterQuality = Math.max(0,aquarium.waterQuality-Math.floor(elapsedHours/24));
  aquarium.cleanliness = Math.max(0,aquarium.cleanliness-Math.floor(elapsedHours/36));
  const now = new Date();
  const today = now.toISOString().slice(0,10);
  const addEvent = message => {
    aquarium.events.push({id:id('aqevt_'),type:action,message,createdAt:now.toISOString()});
    aquarium.events = aquarium.events.slice(-50);
    aquarium.lastActionAt = now.toISOString();
  };
  if (action==='add_fish') {
    const speciesId=req.body.speciesId, quantity=req.body.quantity;
    const species=typeof speciesId==='string'?SPECIES_BY_ID.get(speciesId):null;
    if (!species || !Number.isInteger(quantity) || quantity<1 || quantity>10) return res.status(400).json({error:'请选择目录物种，并输入 1 至 10 的数量。'});
    if (species.waterType!==aquarium.waterType) return res.status(409).json({error:'该物种的水体类型与鱼缸不一致。'});
    const currentCount=aquarium.fish.reduce((sum,item)=>sum+item.quantity,0);
    if (currentCount+quantity>30) return res.status(409).json({error:'模拟鱼缸最多容纳 30 条模拟个体；这只是游戏上限，不是现实放养建议。'});
    let existing=aquarium.fish.find(item=>item.speciesId===speciesId);
    if (existing) existing.quantity+=quantity;
    else aquarium.fish.push({speciesId,commonName:species.commonName,scientificName:species.scientificName,quantity,satiety:70,growthPoints:0,addedAt:now.toISOString()});
    addEvent('加入 '+species.commonName+' × '+quantity+'。同为淡水或海水不代表物种一定可以混养。');
  } else if (action==='feed') {
    aquarium.daily=aquarium.daily?.date===today?aquarium.daily:{date:today,feeds:0};
    if (aquarium.fish.length===0) return res.status(409).json({error:'鱼缸里还没有鱼。'});
    if (aquarium.daily.feeds>=AQUARIUM_ACTION_LIMIT) return res.status(429).json({error:'今日模拟喂食次数已达上限。'});
    aquarium.fish.forEach(item=>{item.satiety=Math.min(100,item.satiety+20);item.growthPoints=Math.min(30,item.growthPoints+1);});
    aquarium.daily.feeds+=1;
    addEvent('投喂了鱼群，饱食度与成长进度有所提升。');
  } else if (action==='water_change') {
    aquarium.waterQuality=Math.min(100,aquarium.waterQuality+20);
    aquarium.cleanliness=Math.min(100,aquarium.cleanliness+10);
    addEvent('完成一次模拟换水，水质与清洁度恢复。');
  } else if (action==='filter_clean') {
    aquarium.cleanliness=Math.min(100,aquarium.cleanliness+25);
    aquarium.waterQuality=Math.min(100,aquarium.waterQuality+10);
    addEvent('完成模拟过滤系统维护。');
  } else {
    return res.status(400).json({error:'不支持的模拟养护操作。'});
  }
  saveUserAquariums(req.user.id,aquariums);
  res.json({aquarium:aquariumSnapshot(aquarium)});
});
app.delete('/api/aquariums/:id', requireAuth, (req, res) => {
  const aquariums=getUserAquariums(req.user.id);
  const remaining=aquariums.filter(item=>item.id!==req.params.id);
  if (remaining.length===aquariums.length) return res.status(404).json({error:'模拟鱼缸不存在。'});
  saveUserAquariums(req.user.id,remaining);
  res.json({deleted:true});
});

app.get('/api/species', (_req, res) => res.json(SPECIES_CATALOGUE));
app.get('/api/products', (_req, res) => {
  const products = readJson(FILES.products, []);
  res.json(products.filter(product => product.active !== false));
});
app.get('/api/admin/products', requireRole('admin', 'manager'), (_req, res) => res.json(readJson(FILES.products, []).map(product => ({ ...product, stockThreshold:Number.isInteger(product.stockThreshold) ? product.stockThreshold : 5 }))));
app.post('/api/admin/products', requireRole('admin', 'manager'), (req, res) => {
  try {
    const product = { id:id('prd_'), ...validateProduct(req.body), stockThreshold:Number.isInteger(req.body.stockThreshold) && req.body.stockThreshold >= 0 ? req.body.stockThreshold : 5, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
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
app.post('/api/admin/products/:id/stock', requireRole('admin', 'manager'), (req, res) => {
  const products = readJson(FILES.products, []);
  const product = products.find(item => item.id === req.params.id);
  if (!product) return res.status(404).json({ error:'Product not found.' });
  const mode = req.body.mode;
  const quantity = req.body.quantity;
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (!['adjust', 'set'].includes(mode) || !Number.isInteger(quantity) || (mode === 'set' && quantity < 0) || Math.abs(quantity) > 1000000) {
    return res.status(400).json({ error:'Choose adjust or set and provide a valid integer quantity.' });
  }
  if (!reason || reason.length > 240) return res.status(400).json({ error:'A stock movement reason (1–240 characters) is required.' });
  const previousStock = Number.isInteger(product.stock) ? product.stock : 0;
  const nextStock = mode === 'adjust' ? previousStock + quantity : quantity;
  if (nextStock < 0) return res.status(409).json({ error:'Stock cannot become negative.' });
  if (nextStock > 1000000) return res.status(400).json({ error:'Stock cannot exceed 1,000,000 units.' });
  const movement = {
    id:id('mov_'), productId:product.id, productName:product.name,
    mode, quantity:mode === 'adjust' ? Math.abs(quantity) : nextStock - previousStock,
    delta:nextStock - previousStock, previousStock, newStock:nextStock,
    reason, actorId:req.user.id, actorRole:req.user.role, createdAt:new Date().toISOString()
  };
  product.stock = nextStock;
  product.updatedAt = movement.createdAt;
  writeJson(FILES.products, products);
  const movements = readJson(FILES.inventoryMovements, []);
  movements.push(movement);
  writeJson(FILES.inventoryMovements, movements.slice(-10000));
  res.json({ product, movement });
});
app.patch('/api/admin/products/:id/stock-threshold', requireRole('admin', 'manager'), (req, res) => {
  const threshold = req.body.threshold;
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 1000000) {
    return res.status(400).json({ error:'Low-stock threshold must be an integer from 0 to 1,000,000.' });
  }
  const products = readJson(FILES.products, []);
  const product = products.find(item => item.id === req.params.id);
  if (!product) return res.status(404).json({ error:'Product not found.' });
  product.stockThreshold = threshold;
  product.updatedAt = new Date().toISOString();
  writeJson(FILES.products, products);
  res.json({ product });
});
app.get('/api/admin/products/:id/stock-movements', requireRole('admin', 'manager'), (req, res) => {
  const product = readJson(FILES.products, []).find(item => item.id === req.params.id);
  if (!product) return res.status(404).json({ error:'Product not found.' });
  const movements = readJson(FILES.inventoryMovements, [])
    .filter(item => item.productId === req.params.id)
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
  res.json({ movements });
});
app.delete('/api/admin/products/:id', requireRole('admin'), (req, res) => {
  const products = readJson(FILES.products, []);
  const product = products.find(item => item.id === req.params.id);
  if (!product) return res.status(404).json({ error:'Product not found.' });
  product.active = false; product.updatedAt = new Date().toISOString();
  writeJson(FILES.products, products);
  res.json({ message:'Product archived.' });
});
app.get('/api/admin/analytics', requireRole('admin', 'manager'), (req, res) => {
  const range = req.query.range === '30d' ? 30 : 7;
  const now = Date.now();
  const windowStart = now - range * 24 * 60 * 60 * 1000;
  const orders = readJson(FILES.orders, []);
  const products = readJson(FILES.products, []);
  const paidOrders = orders.filter(order => order.paymentVerified === true);
  const verifiedInRange = paidOrders.filter(order => {
    const timestamp = Date.parse(order.paidAt || order.updatedAt || order.createdAt);
    return Number.isFinite(timestamp) && timestamp >= windowStart && timestamp <= now;
  });
  const grossVerifiedPayments = paidOrders.reduce((sum, order) => sum + Math.round(Number(order.total || 0) * 100), 0) / 100;
  const periodGross = verifiedInRange.reduce((sum, order) => sum + Math.round(Number(order.total || 0) * 100), 0) / 100;
  const daily = Array.from({length:range}, (_, index) => {
    const date = new Date(windowStart + index * 24 * 60 * 60 * 1000);
    return { date:date.toISOString().slice(0,10), gross:0, paidOrders:0 };
  });
  const dailyIndex = new Map(daily.map((item,index)=>[item.date,index]));
  verifiedInRange.forEach(order => {
    const date = new Date(Date.parse(order.paidAt || order.updatedAt || order.createdAt)).toISOString().slice(0,10);
    const index = dailyIndex.get(date);
    if (index === undefined) return;
    daily[index].gross += Math.round(Number(order.total || 0) * 100) / 100;
    daily[index].paidOrders += 1;
  });
  const statusCounts = {};
  orders.forEach(order => { statusCounts[order.status || 'unknown'] = (statusCounts[order.status || 'unknown'] || 0) + 1; });
  const lowStock = products.filter(product => product.active !== false && Number(product.stock) <= (Number.isInteger(product.stockThreshold) ? product.stockThreshold : 5));
  const outOfStock = products.filter(product => product.active !== false && Number(product.stock) <= 0);
  const categoryCounts = {};
  products.filter(product=>product.active!==false).forEach(product => {
    const category = product.category || 'Uncategorised';
    if (!categoryCounts[category]) categoryCounts[category] = { category, products:0, stockUnits:0 };
    categoryCounts[category].products += 1;
    categoryCounts[category].stockUnits += Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0;
  });
  const bestSellers = new Map();
  verifiedInRange.forEach(order => (order.items || []).forEach(item => {
    const entry = bestSellers.get(item.productId) || { productId:item.productId, name:item.name, units:0, gross:0 };
    entry.units += Number(item.quantity) || 0;
    entry.gross += Math.round(Number(item.lineTotal ?? (Number(item.unitPrice || 0) * Number(item.quantity || 0))) * 100) / 100;
    bestSellers.set(item.productId, entry);
  }));
  res.json({
    rangeDays:range,
    generatedAt:new Date(now).toISOString(),
    revenueDefinition:'Gross verified payments; excludes pending/unverified orders. Refunds are not integrated, so this is not net revenue.',
    summary:{
      grossVerifiedPayments,
      periodGross,
      verifiedOrders:verifiedInRange.length,
      allOrders:orders.length,
      pendingPayment:orders.filter(order=>order.status==='pending_payment').length,
      activeProducts:products.filter(product=>product.active!==false).length,
      lowStock:lowStock.length,
      outOfStock:outOfStock.length
    },
    daily,
    statusCounts,
    categories:Object.values(categoryCounts).sort((a,b)=>b.products-a.products),
    bestSellers:[...bestSellers.values()].sort((a,b)=>b.units-a.units).slice(0,8),
    lowStockProducts:lowStock.sort((a,b)=>Number(a.stock)-Number(b.stock)).slice(0,12).map(product=>({id:product.id,name:product.name,category:product.category,stock:product.stock,threshold:Number.isInteger(product.stockThreshold)?product.stockThreshold:5}))
  });
});
app.get('/api/admin/orders', requireRole('admin', 'manager'), (_req, res) => {
  const orders = readJson(FILES.orders, []);
  res.json(orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
});
app.patch('/api/admin/orders/:id/status', requireRole('admin', 'manager'), (req, res) => {
  const transitions = {
    paid:['processing', 'cancelled'],
    processing:['shipped', 'cancelled'],
    shipped:['completed'],
    completed:[],
    cancelled:[]
  };
  const nextStatus = req.body.status;
  const orders = readJson(FILES.orders, []);
  const order = orders.find(item => item.id === req.params.id);
  if (!order) return res.status(404).json({ error:'Order not found.' });
  if (!Array.isArray(transitions[order.status]) || !transitions[order.status].includes(nextStatus)) {
    return res.status(409).json({ error:'This order cannot move from ' + order.status + ' to ' + String(nextStatus) + '.' });
  }
  if (['processing', 'shipped', 'completed'].includes(nextStatus) && order.inventoryDeducted !== true) {
    return res.status(409).json({ error:'Inventory has not been safely allocated to this order.' });
  }
  if (nextStatus === 'cancelled' && order.inventoryDeducted === true && order.inventoryRestored !== true) {
    const products = readJson(FILES.products, []);
    for (const line of order.items || []) {
      const product = products.find(item => item.id === line.productId);
      if (product) product.stock = Math.min(1000000, product.stock + line.quantity);
    }
    writeJson(FILES.products, products);
    order.inventoryRestored = true;
  }
  order.status = nextStatus;
  order.statusUpdatedAt = new Date().toISOString();
  order.statusHistory = [...(Array.isArray(order.statusHistory) ? order.statusHistory : []), {
    status:nextStatus, at:order.statusUpdatedAt,
    note:nextStatus === 'cancelled' ? 'Order cancelled; allocated stock restored when applicable.' : 'Order status updated by staff.'
  }];
  order.statusUpdatedBy = req.user.id;
  order.updatedAt = order.statusUpdatedAt;
  writeJson(FILES.orders, orders);
  res.json({ order });
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
  const nextQuantity = (existing ? existing.quantity : 0) + quantity;
  if (nextQuantity > 99) return res.status(400).json({ error:'A maximum of 99 units per product can be added to the cart.' });
  if (nextQuantity > product.stock) return res.status(409).json({ error:'Insufficient stock for ' + product.name + '. Available quantity: ' + product.stock + '.' });
  if (existing) existing.quantity = nextQuantity;
  else items.push({ productId, quantity });
  let summary;
  try { summary = cartSummary(items); } catch (error) { return res.status(409).json({ error:error.message }); }
  saveCart(req.user.id, items);
  res.json(summary);
});
app.patch('/api/cart/items/:productId', requireAuth, (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ error:'Quantity must be between 1 and 99.' });
  const items = getCart(req.user.id);
  const item = items.find(entry => entry.productId === req.params.productId);
  if (!item) return res.status(404).json({ error:'Cart item not found.' });
  const previousQuantity = item.quantity;
  item.quantity = quantity;
  let summary;
  try { summary = cartSummary(items); }
  catch (error) { item.quantity = previousQuantity; return res.status(409).json({ error:error.message }); }
  saveCart(req.user.id, items);
  res.json(summary);
});
app.delete('/api/cart/items/:productId', requireAuth, (req, res) => {
  const items = getCart(req.user.id).filter(item => item.productId !== req.params.productId);
  saveCart(req.user.id, items); res.json(cartSummary(items));
});
app.delete('/api/cart', requireAuth, (req, res) => { saveCart(req.user.id, []); res.json({ lines:[], total:0, totalCents:0 }); });

app.get('/api/orders', requireAuth, (req, res) => {
  res.json(readJson(FILES.orders, []).filter(order => order.userId === req.user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
});
app.get('/api/orders/:id', requireAuth, (req, res) => {
  const order = readJson(FILES.orders, []).find(item => item.id === req.params.id && item.userId === req.user.id);
  if (!order) return res.status(404).json({ error:'Order not found.' });
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [{
    status:order.status,
    at:order.updatedAt || order.createdAt,
    note:order.status === 'paid' ? 'Payment verified by provider.' : 'Order created.'
  }];
  res.json({
    order:{
      id:order.id, items:order.items || [], total:order.total, currency:order.currency || 'MYR',
      status:order.status, createdAt:order.createdAt, updatedAt:order.updatedAt,
      paidAt:order.paidAt || null, paymentVerified:order.paymentVerified === true,
      paymentUrl:order.status === 'pending_payment' ? order.paymentUrl || null : null,
      statusHistory:history
    }
  });
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
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
      statusHistory:[{ status:'pending_payment', at:new Date().toISOString(), note:'Order created; awaiting payment.' }]
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
      if (order.paymentVerified !== true) {
        const products = readJson(FILES.products, []);
        const canAllocate = (order.items || []).every(line => {
          const product = products.find(item => item.id === line.productId);
          return product && Number.isInteger(product.stock) && product.stock >= line.quantity;
        });
        order.paymentVerified = true;
        order.paidAt = new Date().toISOString();
        order.updatedAt = order.paidAt;
        if (canAllocate) {
          for (const line of order.items) {
            const product = products.find(item => item.id === line.productId);
            product.stock -= line.quantity;
          }
          order.inventoryDeducted = true;
          order.status = 'paid';
          order.statusHistory = [...(order.statusHistory || []), { status:'paid', at:order.paidAt, note:'Payment verified by payment provider; inventory allocated.' }];
          writeJson(FILES.products, products);
          const carts = readJson(FILES.carts, {});
          carts[order.userId] = [];
          writeJson(FILES.carts, carts);
        } else {
          order.inventoryDeducted = false;
          order.status = 'paid_inventory_review';
          order.statusHistory = [...(order.statusHistory || []), { status:'paid_inventory_review', at:order.paidAt, note:'Payment verified; inventory requires staff review.' }];
        }
        writeJson(FILES.orders, orders);
      }
    } else if (order.paymentVerified !== true) {
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
app.post('/api/admin/media/products', requireRole('admin', 'manager'), express.raw({ type:['image/jpeg','image/png','image/webp'], limit:'5mb' }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length < 16) return res.status(400).json({ error:'Upload a JPEG, PNG or WebP image.' });
  const type = req.headers['content-type'];
  const bytes = req.body;
  let extension = '';
  if (type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) extension = 'jpg';
  if (type === 'image/png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension = 'png';
  if (type === 'image/webp' && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') extension = 'webp';
  if (!extension) return res.status(400).json({ error:'Image content does not match its declared JPEG, PNG or WebP type.' });
  const directory = path.join(PUBLIC_DIR, 'uploads', 'products');
  fs.mkdirSync(directory, { recursive:true });
  const filename = crypto.randomUUID() + '.' + extension;
  fs.writeFileSync(path.join(directory, filename), bytes, { flag:'wx', mode:0o644 });
  res.status(201).json({ image:'/uploads/products/' + filename, contentType:type, size:bytes.length });
});
app.use(express.static(PUBLIC_DIR, { extensions:['html'], dotfiles:'deny', index:'index.html' }));
app.use((req, res) => req.path.startsWith('/api/') ? res.status(404).json({ error:'API route not found.' }) : res.status(404).send('Not found.'));
app.use((error, _req, res, _next) => { console.error(error); const status = error.type === 'entity.too.large' ? 413 : 500; res.status(status).json({ error:status === 413 ? 'Image upload exceeds the 5 MB limit.' : 'Internal server error.' }); });

if (require.main === module) app.listen(PORT, () => console.log('Ink Spirit / Sea Garden running at http://localhost:' + PORT));
module.exports = app;
