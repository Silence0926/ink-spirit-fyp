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
