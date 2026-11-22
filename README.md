# 墨灵 · Ink Spirit / Sea Garden FYP

**Ink Spirit** is the new main experience: an interactive Chinese ink-wash ecosystem built around companion creatures, habitat exploration, and creature development. **Sea Garden** remains a connected aquarium catalogue and shopping area.

## Product pillars

1. **Companion creatures** — select and interact with koi, dragon, snake, and turtle.
2. **Ecological exploration** — initial lotus pond, cloud mountain, bamboo grove, and quiet marsh identities; the full explorable habitat system is still in development.
3. **Collection and growth** — experience, levels, and browser-local progression form the first prototype.
4. **Sea Garden commerce** — aquarium pages remain a separate area and are being migrated incrementally.

## Current implementation

- Ink Spirit homepage at `server/public/index.html`.
- Creature selection, habitat labels, interaction feedback, and browser-local progression.
- Sea Garden pages currently present: legacy homepage, fish shop, fish list, map, search, cart, checkout demonstration, payment demonstration, order history, login, registration, profile, and role dashboards.
- Shared navigation/footer components and a generated music control.
- Express API routes:
  - `GET /api/health`
  - `POST /api/register`
  - `POST /api/login`
  - `GET /api/products`
  - `GET /api/music`
- JSON-file persistence for API accounts and product data under `server/data/` (created at runtime and excluded from Git).
- API-created passwords use Node.js scrypt hashes. Legacy plaintext account records are upgraded after a successful API login.
- Public API registration always creates the `user` role. Admin and manager accounts are not created through public registration.
- The browser stores the signed-in user summary, cart, demo orders, and Ink Spirit progression in localStorage. The current login flow is a prototype: it does not yet issue a server session/token or protect privileged server-side operations.
- GitHub Actions validates frontend JavaScript syntax and runs Node.js API tests.

## Run locally

Requires Node.js 18 or newer.

```bash
cd server
npm install
npm start
```

Open `http://localhost:3000`.

Run validation with:

```bash
npm run check:frontend
npm test
```

## Migration limitations

- The original FYP archive did not contain MP3 tracks in `server/public/music/`; add licensed MP3 files there to populate the playlist.
- Original image/video assets and the remaining mini-game pages have not yet been migrated into this repository. Some restored catalogue cards currently use text/graphic placeholders.
- Product data can be read from `server/data/products.json`, but a product-management API and admin authorization flow are not implemented.
- Cart, checkout, payment simulation, and order history are browser-local demonstrations. No real payment is processed, and no server-side order is created.
- The original Google Maps embed is retained as a location reference. Fish birthplace/habitat mapping is not implemented yet.
- Runtime JSON data is not committed. Back up `server/data/` separately if you use the local API.

Do not use this prototype for real customer accounts, privileged administration, or payments until server-side sessions, role-based authorization, order persistence, validation, CSRF protection, and payment-provider integration have been implemented and reviewed.

## Project documentation

- [Product roadmap](docs/ROADMAP.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Migration status](docs/MIGRATION_STATUS.md)
