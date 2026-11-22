# Architecture / 系统架构

## Current architecture

```text
Browser
  ├── Ink Spirit world
  │     ├── Creature selector and SVG artwork
  │     ├── Habitat scene presentation
  │     └── Local prototype progression (localStorage)
  └── Sea Garden pages
        ├── Fish catalogue and shop
        ├── Cart and demo checkout
        ├── Demo order history
        └── Login / registration / profile UI

Node.js 18+ + Express
  ├── Static frontend hosting
  ├── GET  /api/health
  ├── POST /api/register
  ├── POST /api/login
  ├── GET  /api/products
  └── GET  /api/music

Runtime storage
  ├── server/data/users.json
  ├── server/data/products.json
  └── server/public/music/*.mp3
```

## API account storage

The API stores account records in `server/data/users.json`. New passwords are hashed with Node.js `crypto.scryptSync` and a per-password random salt. For compatibility with an older JSON format, a successful login against a legacy plaintext password upgrades that record to a scrypt hash.

Public registration accepts a username, optional email, and password. It always assigns the `user` role; a role supplied by the client is ignored. Admin/manager provisioning is intentionally not exposed as a public endpoint.

The current login endpoint returns a user summary for the browser prototype. It does **not** establish a server-side session or issue a signed access token. The browser's localStorage values are not proof of identity. Any privileged API or dashboard must be protected server-side before production use.

## Product storage

`GET /api/products` reads an array from `server/data/products.json`. If no file exists, it returns an empty array. Product mutation endpoints are not implemented yet.

## Music storage

`GET /api/music` scans `server/public/music/` and returns relative URLs for MP3 files. The static Express middleware serves the actual files. The supplied FYP archive contained no MP3 tracks, so the directory starts empty.

## Ink Spirit browser data

Current local prototype keys:
- `inkSpirit.progress.v1` — per-creature experience, level, and visit count.
- `inkSpirit.selected` — selected creature id.

These values are browser-local and can be edited by the user. Server-authoritative progression is a later milestone.

## Sea Garden demo data

- `cart` — browser-local shopping cart.
- `orders` — browser-local demonstration order history.
- `loggedInUser`, `isLoggedIn`, `role` — browser display state only.

No real payment provider is connected. A demo order is not a paid or fulfilled order.

## Security boundaries

- Never trust a role or identity value supplied by localStorage.
- Never accept a client-supplied role as proof of authorization.
- Use server-side sessions or signed tokens before protecting real user data.
- Keep password hashes and runtime JSON data out of the public repository.
- Validate request bodies and enforce size limits.
- Add rate limiting to registration/login before public deployment.
- Do not expose filesystem paths or allow user-controlled file paths.
- Use HTTPS and deployment secrets for production hosting.
