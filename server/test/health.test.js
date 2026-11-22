'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

function reservePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port;
      socket.close(error => error ? reject(error) : resolve(port));
    });
  });
}

test('health endpoint returns service status', async () => {
  const port = await reservePort();
  const serverPath = path.join(__dirname, '..', 'server.js');
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore'
  });

  try {
    let response;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (child.exitCode !== null) throw new Error('Server exited before becoming ready');
      try {
        response = await fetch(`http://127.0.0.1:${port}/api/health`);
        break;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    assert.ok(response, 'server should become ready');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'ink-spirit');
    assert.equal(typeof body.timestamp, 'string');
  } finally {
    child.kill('SIGTERM');
  }
});
