'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function startServer(t, seedUsers = [], seedProducts = null) {
  const port = await freePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-spirit-test-'));
  if (seedUsers.length) fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(seedUsers));
  if (seedProducts) fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(seedProducts));
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir },
    stdio: 'ignore'
  });
  t.after(() => {
    child.kill('SIGTERM');
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error('Server exited before becoming ready');
    try {
      const response = await fetch(base + '/api/health');
      if (response.ok) return { base, dataDir };
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server did not become ready');
}

test('register and login use hashed passwords and reject duplicate usernames', async t => {
  const { base, dataDir } = await startServer(t);
  const registration = await fetch(base + '/api/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'ink-user', password: 'correct-horse-42', role: 'admin' })
  });
  assert.equal(registration.status, 201);

  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
  assert.equal(users[0].role, 'user', 'public registration must not grant admin privileges');
  assert.notEqual(users[0].password, 'correct-horse-42');
  assert.equal(users[0].password.algorithm, 'scrypt');

  const duplicate = await fetch(base + '/api/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'INK-USER', password: 'correct-horse-42' })
  });
  assert.equal(duplicate.status, 409);

  const login = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'ink-user', password: 'correct-horse-42' })
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.role, 'user');
});

test('legacy plaintext password is upgraded after successful login', async t => {
  const { base, dataDir } = await startServer(t, [
    { username: 'legacy-user', password: 'legacy-pass-123', role: 'manager' }
  ]);
  const response = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'legacy-user', password: 'legacy-pass-123' })
  });
  assert.equal(response.status, 200);
  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
  assert.equal(users[0].password.algorithm, 'scrypt');
});

test('products endpoint seeds the starter catalogue when no catalogue file exists', async t => {
  const { base } = await startServer(t);
  const response = await fetch(base + '/api/products');
  assert.equal(response.status, 200);
  const products = await response.json();
  assert.ok(products.length >= 6);
  assert.ok(products.some(product => product.id === 'koi-001'));
  assert.ok(products.some(product => product.id === 'tank-001'));
});

test('admin and manager API permissions are enforced server-side', async t => {
  const { base } = await startServer(t, [
    { id:'manager-id', username:'manager-test', password:'manager-pass-123', role:'manager' },
    { id:'admin-id', username:'admin-test', password:'admin-pass-123', role:'admin' }
  ], [
    { id:'permission-product', name:'Test Koi', category:'Fish', description:'Permission test product.', price:10, currency:'MYR', stock:5, image:'/images/products/koi-card.svg', active:true }
  ]);

  const signIn = async (username, password) => {
    const response = await fetch(base + '/api/login', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body:JSON.stringify({ username, password })
    });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie');
    assert.ok(cookie, 'login should issue a session cookie');
    return cookie.split(';')[0];
  };

  const managerCookie = await signIn('manager-test', 'manager-pass-123');
  const managerHeaders = { cookie:managerCookie };
  assert.equal((await fetch(base + '/api/admin/products', { headers:managerHeaders })).status, 200);
  assert.equal((await fetch(base + '/api/admin/orders', { headers:managerHeaders })).status, 200);
  assert.equal((await fetch(base + '/api/admin/users', { headers:managerHeaders })).status, 403);
  assert.equal((await fetch(base + '/api/admin/products/permission-product', {
    method:'DELETE', headers:managerHeaders
  })).status, 403);

  const adminCookie = await signIn('admin-test', 'admin-pass-123');
  const adminHeaders = { cookie:adminCookie };
  assert.equal((await fetch(base + '/api/admin/users', { headers:adminHeaders })).status, 200);
  const selfDemotion = await fetch(base + '/api/admin/users/admin-id/role', {
    method:'PATCH',
    headers:{ ...adminHeaders, 'content-type':'application/json' },
    body:JSON.stringify({ role:'manager' })
  });
  assert.equal(selfDemotion.status, 400, 'an administrator cannot demote their own account');
  assert.equal((await fetch(base + '/api/admin/products/permission-product', {
    method:'DELETE', headers:adminHeaders
  })).status, 200);
});

test('authenticated creature progression persists server-side and validates rewards', async t => {
  const { base, dataDir } = await startServer(t);
  const registration = await fetch(base + '/api/register', {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ username:'creature-user', password:'creature-pass-123' })
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, 'content-type':'application/json' };

  const initial = await fetch(base + '/api/creatures/progress', { headers });
  assert.equal(initial.status, 200);
  const initialData = await initial.json();
  assert.equal(initialData.selectedCreature, 'koi');
  assert.equal(initialData.creatures.koi.level, 1);
  assert.equal(initialData.dailyInteractions.count, 0);

  const unauthorized = await fetch(base + '/api/creatures/progress');
  assert.equal(unauthorized.status, 401);

  const invalid = await fetch(base + '/api/creatures/interact', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'phoenix', reward:999999 })
  });
  assert.equal(invalid.status, 400);

  const select = await fetch(base + '/api/creatures/selected', {
    method:'PATCH', headers, body:JSON.stringify({ creatureId:'dragon' })
  });
  assert.equal(select.status, 200);
  assert.equal((await select.json()).selectedCreature, 'dragon');

  let latest;
  for (let index = 0; index < 10; index += 1) {
    const interaction = await fetch(base + '/api/creatures/interact', {
      method:'POST', headers, body:JSON.stringify({ creatureId:'dragon', reward:999999 })
    });
    assert.equal(interaction.status, 200);
    latest = await interaction.json();
    assert.equal(latest.reward, 10, 'server controls the interaction reward');
  }
  assert.equal(latest.progress.creatures.dragon.level, 2);
  assert.equal(latest.progress.creatures.dragon.experience, 0);
  assert.equal(latest.progress.creatures.dragon.visits, 10);
  assert.equal(latest.progress.dailyInteractions.count, 10);
  assert.equal(latest.care.creatures.dragon.bond, 10, 'each companionship interaction adds one bond point');
  assert.equal(latest.care.creatures.dragon.bondStage, '初识');

  const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'creature-progress.json'), 'utf8'));
  const user = (await registration.json()).user;
  assert.equal(stored[user.id].creatures.dragon.totalExperience, 100);

  for (let index = 0; index < 40; index += 1) {
    const interaction = await fetch(base + '/api/creatures/interact', {
      method:'POST', headers, body:JSON.stringify({ creatureId:'koi' })
    });
    assert.equal(interaction.status, 200);
  }
  const capped = await fetch(base + '/api/creatures/interact', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi' })
  });
  assert.equal(capped.status, 429, 'daily interaction rewards must be capped server-side');

  const invalidAfterLimit = await fetch(base + '/api/creatures/interact', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'unknown' })
  });
  assert.equal(invalidAfterLimit.status, 400);
});


test('habitat discoveries are authenticated, persistent, one-time and reward the selected creature', async t => {
  const { base, dataDir } = await startServer(t);
  const anonymous = await fetch(base + '/api/exploration/progress');
  assert.equal(anonymous.status, 401);

  const registration = await fetch(base + '/api/register', {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ username:'explorer-user', password:'explorer-pass-123' })
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, 'content-type':'application/json' };

  const invalid = await fetch(base + '/api/exploration/discover', {
    method:'POST', headers, body:JSON.stringify({ habitatId:'unknown-realm' })
  });
  assert.equal(invalid.status, 400);

  const first = await fetch(base + '/api/exploration/discover', {
    method:'POST', headers, body:JSON.stringify({ habitatId:'lotus-pond', reward:999999 })
  });
  assert.equal(first.status, 201);
  const firstData = await first.json();
  assert.equal(firstData.reward, 25, 'server fixes the discovery reward');
  assert.equal(firstData.rewardedCreature, 'koi');
  assert.equal(firstData.creatureProgress.creatures.koi.experience, 25);
  assert.deepEqual(firstData.exploration.discovered, ['lotus-pond']);

  const repeated = await fetch(base + '/api/exploration/discover', {
    method:'POST', headers, body:JSON.stringify({ habitatId:'lotus-pond' })
  });
  assert.equal(repeated.status, 200);
  const repeatedData = await repeated.json();
  assert.equal(repeatedData.alreadyDiscovered, true);
  assert.equal(repeatedData.reward, 0);

  const persisted = JSON.parse(fs.readFileSync(path.join(dataDir, 'exploration-progress.json'), 'utf8'));
  const user = (await registration.json()).user;
  assert.deepEqual(persisted[user.id].discovered, ['lotus-pond']);
  const progress = await fetch(base + '/api/exploration/progress', { headers });
  assert.deepEqual((await progress.json()).discovered, ['lotus-pond']);
});


test('creature care is authenticated, validates food, persists bonds and prevents feeding a full creature', async t => {
  const { base, dataDir } = await startServer(t);
  const anonymous = await fetch(base + '/api/creatures/care');
  assert.equal(anonymous.status, 401);
  const registration = await fetch(base + '/api/register', {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ username:'care-user', password:'care-pass-123' })
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, 'content-type':'application/json' };
  const initial = await fetch(base + '/api/creatures/care', { headers });
  assert.equal(initial.status, 200);
  assert.equal((await initial.json()).creatures.koi.satiety, 60);

  const invalid = await fetch(base + '/api/creatures/care/feed', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi', foodId:'poison' })
  });
  assert.equal(invalid.status, 400);

  let result;
  for (let index = 0; index < 2; index += 1) {
    const response = await fetch(base + '/api/creatures/care/feed', {
      method:'POST', headers, body:JSON.stringify({ creatureId:'koi', foodId:'moon-dew' })
    });
    assert.equal(response.status, 200);
    result = await response.json();
  }
  assert.equal(result.care.creatures.koi.satiety, 100);
  assert.equal(result.care.creatures.koi.bond, 10);
  assert.equal(result.care.creatures.koi.mood, '安然');
  const full = await fetch(base + '/api/creatures/care/feed', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi', foodId:'lotus-seed' })
  });
  assert.equal(full.status, 409, 'feeding a full creature should not consume a care action');

  const user = (await registration.json()).user;
  const carePath = path.join(dataDir, 'creature-care.json');
  const stored = JSON.parse(fs.readFileSync(carePath, 'utf8'));
  stored[user.id].creatures.koi.lastFedAt = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
  fs.writeFileSync(carePath, JSON.stringify(stored));
  const recovered = await fetch(base + '/api/creatures/care', { headers });
  assert.equal((await recovered.json()).creatures.koi.satiety, 90, 'satiety slowly decreases after six hours');

  const thirdFeed = await fetch(base + '/api/creatures/care/feed', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi', foodId:'cloud-fruit' })
  });
  assert.equal(thirdFeed.status, 200);
  const thirdData = await thirdFeed.json();
  assert.equal(thirdData.care.creatures.koi.bond, 15);
  assert.equal(thirdData.care.creatures.koi.dailyFeeds.count, 3);

  const afterThird = JSON.parse(fs.readFileSync(carePath, 'utf8'));
  afterThird[user.id].creatures.koi.satiety = 0;
  fs.writeFileSync(carePath, JSON.stringify(afterThird));
  const dailyLimit = await fetch(base + '/api/creatures/care/feed', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi', foodId:'lotus-seed' })
  });
  assert.equal(dailyLimit.status, 429, 'server enforces three feeds per creature per UTC day');
  const persisted = JSON.parse(fs.readFileSync(carePath, 'utf8'));
  assert.equal(persisted[user.id].creatures.koi.bond, 15);
  assert.equal(persisted[user.id].creatures.koi.daily.count, 3);
});



test('creature evolution requires both level and bond thresholds', async t => {
  const { base, dataDir } = await startServer(t);
  const registration = await fetch(base + '/api/register', {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ username:'evolution-user', password:'evolution-pass-123' })
  });
  assert.equal(registration.status, 201);
  const user = (await registration.json()).user;
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, 'content-type':'application/json' };

  const initial = await fetch(base + '/api/creatures/care', { headers });
  assert.equal((await initial.json()).creatures.koi.evolution.id, 'young');

  await fetch(base + '/api/creatures/interact', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi' })
  });
  const progressPath = path.join(dataDir, 'creature-progress.json');
  const carePath = path.join(dataDir, 'creature-care.json');
  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  const care = JSON.parse(fs.readFileSync(carePath, 'utf8'));

  progress[user.id].creatures.koi.level = 5;
  care[user.id].creatures.koi.bond = 19;
  fs.writeFileSync(progressPath, JSON.stringify(progress));
  fs.writeFileSync(carePath, JSON.stringify(care));
  let response = await fetch(base + '/api/creatures/care', { headers });
  assert.equal((await response.json()).creatures.koi.evolution.id, 'young', 'level alone must not unlock evolution');

  care[user.id].creatures.koi.bond = 20;
  fs.writeFileSync(carePath, JSON.stringify(care));
  response = await fetch(base + '/api/creatures/care', { headers });
  assert.equal((await response.json()).creatures.koi.evolution.id, 'awakened');

  progress[user.id].creatures.koi.level = 10;
  care[user.id].creatures.koi.bond = 50;
  fs.writeFileSync(progressPath, JSON.stringify(progress));
  fs.writeFileSync(carePath, JSON.stringify(care));
  response = await fetch(base + '/api/creatures/care', { headers });
  assert.equal((await response.json()).creatures.koi.evolution.id, 'transcendent');
});

test('creature journal records interactions, feeding and first-time habitat discoveries', async t => {
  const { base, dataDir } = await startServer(t);
  const anonymous = await fetch(base + '/api/creatures/journal');
  assert.equal(anonymous.status, 401);
  const registration = await fetch(base + '/api/register', {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ username:'journal-user', password:'journal-pass-123' })
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, 'content-type':'application/json' };

  const interact = await fetch(base + '/api/creatures/interact', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi' })
  });
  assert.equal(interact.status, 200);
  const feed = await fetch(base + '/api/creatures/care/feed', {
    method:'POST', headers, body:JSON.stringify({ creatureId:'koi', foodId:'moon-dew' })
  });
  assert.equal(feed.status, 200);
  const explore = await fetch(base + '/api/exploration/discover', {
    method:'POST', headers, body:JSON.stringify({ habitatId:'lotus-pond' })
  });
  assert.equal(explore.status, 201);

  const response = await fetch(base + '/api/creatures/journal', { headers });
  assert.equal(response.status, 200);
  const events = (await response.json()).events;
  assert.deepEqual(events.map(event => event.type), ['exploration', 'feeding', 'interaction']);
  assert.equal(events[0].title, '初访烟雨荷塘');
  assert.ok(events.every(event => event.createdAt && event.creatureId === 'koi'));

  const user = (await registration.json()).user;
  const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'creature-journal.json'), 'utf8'));
  assert.equal(stored[user.id].length, 3);
});


test('companion signature abilities are unique, bond-gated, rate-limited and server-validated', async t => {
  const { base, dataDir } = await startServer(t);
  const anonymous = await fetch(base + '/api/creatures/ability', {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({creatureId:'koi',abilityId:'ripple-leap'})
  });
  assert.equal(anonymous.status, 401);
  const registration = await fetch(base + '/api/register', {
    method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify({username:'ability-user',password:'ability-pass-123'})
  });
  assert.equal(registration.status, 201);
  const user = (await registration.json()).user;
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const headers = {cookie,'content-type':'application/json'};
  const initial = await fetch(base + '/api/creatures/care', {headers});
  const initialCare = (await initial.json()).creatures.koi;
  assert.equal(initialCare.ability.id, 'ripple-leap');
  assert.equal(initialCare.ability.unlocked, false);
  const locked = await fetch(base + '/api/creatures/ability', {
    method:'POST', headers, body:JSON.stringify({creatureId:'koi',abilityId:'ripple-leap'})
  });
  assert.equal(locked.status, 403);
  const wrongAbility = await fetch(base + '/api/creatures/ability', {
    method:'POST', headers, body:JSON.stringify({creatureId:'koi',abilityId:'cloudborne-presence'})
  });
  assert.equal(wrongAbility.status, 400);
  const seedState = await fetch(base + '/api/creatures/interact', {
    method:'POST', headers, body:JSON.stringify({creatureId:'koi'})
  });
  assert.equal(seedState.status,200);
  const progressPath = path.join(dataDir,'creature-progress.json');
  const carePath = path.join(dataDir,'creature-care.json');
  const progress = JSON.parse(fs.readFileSync(progressPath,'utf8'));
  const care = JSON.parse(fs.readFileSync(carePath,'utf8'));
  progress[user.id].creatures.koi.level = 5;
  care[user.id].creatures.koi.bond = 50;
  fs.writeFileSync(progressPath,JSON.stringify(progress));
  fs.writeFileSync(carePath,JSON.stringify(care));
  const unlocked = await fetch(base + '/api/creatures/care',{headers});
  const ability = (await unlocked.json()).creatures.koi.ability;
  assert.equal(ability.unlocked,true);
  assert.equal(ability.name,'锦鲤跃波');
  for(let index=0;index<5;index+=1){
    const activated = await fetch(base + '/api/creatures/ability',{
      method:'POST',headers,body:JSON.stringify({creatureId:'koi',abilityId:'ripple-leap'})
    });
    assert.equal(activated.status,200);
    assert.equal((await activated.json()).activated,true);
  }
  const exhausted = await fetch(base + '/api/creatures/ability',{
    method:'POST',headers,body:JSON.stringify({creatureId:'koi',abilityId:'ripple-leap'})
  });
  assert.equal(exhausted.status,429);
  const journal = await fetch(base + '/api/creatures/journal',{headers});
  const events = (await journal.json()).events;
  assert.equal(events.filter(event=>event.type==='ability').length,5);
  const stored = JSON.parse(fs.readFileSync(carePath,'utf8'));
  assert.equal(stored[user.id].creatures.koi.abilityDaily.count,5);
});


test('order fulfilment transitions are role-protected and restore allocated stock once', async t => {
  const order = {
    id:'order-test-001', userId:'customer-id', total:20, currency:'MYR',
    status:'paid', inventoryDeducted:true, inventoryRestored:false,
    items:[{ productId:'order-product', name:'Koi', quantity:2, unitPrice:10 }],
    createdAt:new Date().toISOString()
  };
  const { base, dataDir } = await startServer(t, [
    { id:'manager-id', username:'manager-orders', password:'manager-pass-123', role:'manager' },
    { id:'admin-id', username:'admin-orders', password:'admin-pass-123', role:'admin' },
    { id:'customer-id', username:'customer-orders', password:'customer-pass-123', role:'user' }
  ], [
    { id:'order-product', name:'Koi', category:'Fish', description:'Test stock item.', price:10, currency:'MYR', stock:3, image:'/images/products/koi-card.svg', active:true }
  ]);
  fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify([order]));
  const signIn = async username => {
    const response = await fetch(base + '/api/login', {
      method:'POST', headers:{ 'content-type':'application/json' },
      body:JSON.stringify({ username, password:username.startsWith('manager') ? 'manager-pass-123' : username.startsWith('admin') ? 'admin-pass-123' : 'customer-pass-123' })
    });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  const managerCookie = await signIn('manager-orders');
  const managerHeaders = { cookie:managerCookie, 'content-type':'application/json' };
  const userCookie = await signIn('customer-orders');
  assert.equal((await fetch(base + '/api/admin/orders/order-test-001/status', {
    method:'PATCH', headers:{ cookie:userCookie, 'content-type':'application/json' },
    body:JSON.stringify({ status:'processing' })
  })).status, 403);

  const processing = await fetch(base + '/api/admin/orders/order-test-001/status', {
    method:'PATCH', headers:managerHeaders, body:JSON.stringify({ status:'processing' })
  });
  assert.equal(processing.status, 200);
  assert.equal((await processing.json()).order.status, 'processing');

  const shipped = await fetch(base + '/api/admin/orders/order-test-001/status', {
    method:'PATCH', headers:managerHeaders, body:JSON.stringify({ status:'shipped' })
  });
  assert.equal(shipped.status, 200);

  const invalid = await fetch(base + '/api/admin/orders/order-test-001/status', {
    method:'PATCH', headers:managerHeaders, body:JSON.stringify({ status:'paid' })
  });
  assert.equal(invalid.status, 409, 'staff cannot forge a provider-confirmed paid status');

  const completed = await fetch(base + '/api/admin/orders/order-test-001/status', {
    method:'PATCH', headers:managerHeaders, body:JSON.stringify({ status:'completed' })
  });
  assert.equal(completed.status, 200);
  const cancelCompleted = await fetch(base + '/api/admin/orders/order-test-001/status', {
    method:'PATCH', headers:managerHeaders, body:JSON.stringify({ status:'cancelled' })
  });
  assert.equal(cancelCompleted.status, 409, 'completed orders are terminal');

  const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
  assert.equal(products[0].stock, 3, 'completed orders retain their allocated inventory');
});

test('cancelled allocated orders restore stock exactly once', async t => {
  const { base, dataDir } = await startServer(t, [
    { id:'manager-id', username:'manager-cancel', password:'manager-pass-123', role:'manager' }
  ], [
    { id:'order-product', name:'Koi', category:'Fish', description:'Test stock item.', price:10, currency:'MYR', stock:3, image:'/images/products/koi-card.svg', active:true }
  ]);
  fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify([{
    id:'order-cancel-001', userId:'customer-id', total:20, status:'paid',
    inventoryDeducted:true, inventoryRestored:false,
    items:[{ productId:'order-product', quantity:2 }], createdAt:new Date().toISOString()
  }]));
  const login = await fetch(base + '/api/login', {
    method:'POST', headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ username:'manager-cancel', password:'manager-pass-123' })
  });
  const headers = { cookie:login.headers.get('set-cookie').split(';')[0], 'content-type':'application/json' };
  const cancelled = await fetch(base + '/api/admin/orders/order-cancel-001/status', {
    method:'PATCH', headers, body:JSON.stringify({ status:'cancelled' })
  });
  assert.equal(cancelled.status, 200);
  const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
  assert.equal(products[0].stock, 5);
  const duplicate = await fetch(base + '/api/admin/orders/order-cancel-001/status', {
    method:'PATCH', headers, body:JSON.stringify({ status:'cancelled' })
  });
  assert.equal(duplicate.status, 409);
  const after = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
  assert.equal(after[0].stock, 5, 'stock must not be restored twice');
});
