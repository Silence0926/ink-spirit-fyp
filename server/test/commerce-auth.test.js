'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

test('server sessions, product catalog and user cart are server-side', async () => {
  const port = await reservePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-spirit-test-'));
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, ADMIN_USERNAME: 'root-test', ADMIN_PASSWORD: 'a-very-long-test-password' },
    stdio: 'ignore'
  });
  const base = 'http://127.0.0.1:' + port;
  const request = async (url, options = {}) => fetch(base + url, options);
  let cookie = '';
  try {
    let ready = false;
    for (let i = 0; i < 50; i += 1) {
      if (child.exitCode !== null) throw new Error('Server exited before becoming ready');
      try { const r = await request('/api/health'); if (r.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, 'server should become ready');

    const registration = await request('/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test-user', email: 'test@example.com', password: 'password-12345', role: 'admin' })
    });
    assert.equal(registration.status, 201);
    cookie = registration.headers.get('set-cookie').split(';')[0];
    const me = await request('/api/me', { headers: { Cookie: cookie } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.role, 'user', 'public registration must not grant admin');

    const productsResponse = await request('/api/products');
    const products = await productsResponse.json();
    assert.ok(products.length >= 1);
    const add = await request('/api/cart/items', {
      method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: products[0].id, quantity: 2 })
    });
    assert.equal(add.status, 200);
    const cart = await (await request('/api/cart', { headers: { Cookie: cookie } })).json();
    assert.equal(cart.lines[0].quantity, 2);
    assert.ok(cart.total > 0);

    const denied = await request('/api/admin/products', { headers: { Cookie: cookie } });
    assert.equal(denied.status, 403);

    const adminLogin = await request('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'root-test', password: 'a-very-long-test-password' })
    });
    assert.equal(adminLogin.status, 200);
    const adminCookie = adminLogin.headers.get('set-cookie').split(';')[0];
    const adminProducts = await request('/api/admin/products', { headers: { Cookie: adminCookie } });
    assert.equal(adminProducts.status, 200);
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
