# 墨灵 · Ink Spirit / Sea Garden FYP

**Ink Spirit** is the new experience and visual identity for this project: an interactive Chinese ink-wash ecosystem built around companion creatures, habitat exploration, and creature development. The existing **Sea Garden** aquarium catalogue and shopping pages remain part of the same application.

## Product pillars

1. **Companion creatures** — select and interact with koi, dragon, snake, and turtle.
2. **Ecological exploration** — distinct ink-wash habitats, with the habitat system being expanded.
3. **Collection and growth** — experience, levels, and persistent local progress are the first prototype of the creature-development system.
4. **Sea Garden commerce** — legacy aquarium pages are retained as a separate shopping area.

## Current implementation

- Ink Spirit homepage at `server/public/index.html`.
- Creature selection, scene labels, interaction feedback, and browser-local progression.
- Sea Garden legacy homepage at `server/public/index-seagarden-legacy.html`.
- Express API routes:
  - `GET /api/health`
  - `POST /api/register`
  - `POST /api/login`
  - `GET /api/products`
  - `GET /api/music`
- JSON-file persistence for accounts and products under `server/data/` (created at runtime and excluded from Git).
- Passwords created through the API are stored using Node.js scrypt hashes. Legacy plaintext accounts are upgraded after a successful login.
- Public API registration always creates the `user` role; privileged roles must be provisioned through a trusted administrative process.
- Existing Sea Garden frontend pages still use their original browser-localStorage demonstration account/cart flow. This is not yet a production authentication or order system.
- Node.js automated tests and GitHub Actions CI.

## Run locally

Requires Node.js 18 or newer.

```bash
cd server
npm install
npm start
```

Open `http://localhost:3000`.

Run tests with:

```bash
npm test
```

## Important integration notes

- The original archive did not contain music tracks in `server/public/music/`; add licensed MP3 files there to populate the music playlist.
- Runtime JSON data is not committed. Back up `server/data/` separately if you use the local API.
- Checkout/payment pages are legacy demonstration pages. No live payment gateway or verified order-processing backend is configured.
- Do not deploy real customer accounts, privileged roles, or payment workflows until authentication/session management, authorization, CSRF protection, input validation, order persistence, and payment-provider integration have been completed and reviewed.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
