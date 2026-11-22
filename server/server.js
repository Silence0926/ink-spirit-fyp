'use strict';

const express = require('express');
const path = require('node:path');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(PUBLIC_DIR, {
  extensions: ['html'],
  dotfiles: 'deny',
  index: 'index.html'
}));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ink-spirit',
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  next();
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Ink Spirit server running at http://localhost:${PORT}`);
});
