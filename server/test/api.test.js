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
