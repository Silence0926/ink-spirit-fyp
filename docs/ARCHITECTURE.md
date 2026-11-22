# Architecture / 系统架构

## Runtime

- Browser frontend: Ink Spirit world and Sea Garden storefront.
- Node.js 18+ / Express backend.
- Runtime JSON files under `server/data/`.
- Billplz API for hosted checkout (sandbox-first; merchant credentials required).

## Authentication and authorization

- Passwords use Node.js scrypt with a random per-password salt.
- Sessions use random 256-bit opaque tokens; only SHA-256 token digests are stored server-side.
- Session token is issued in an HttpOnly, SameSite=Lax cookie; Secure is enabled in production.
- Public registration always creates role `user`.
- Bootstrap admin is created from `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables.
- Product management is available to admin/manager roles. User role changes and product archiving require admin.
- APIs enforce roles on the server; localStorage is no longer an authorization source.

## Commerce data

Runtime files:
- `users.json`
- `sessions.json`
- `products.json`
- `carts.json`
- `orders.json`

Carts are stored per authenticated user. Checkout snapshots product names, unit prices and quantities into an order. The order starts as `pending_payment`. The server creates a Billplz bill in the configured environment and redirects the customer to the provider-hosted payment page.

The Billplz callback is not trusted by itself. The server retrieves the Bill from Billplz using the server-side API key, checks the paid state and exact amount, and only then marks the order `paid`, decrements stock and clears the user's cart. Duplicate callbacks are idempotent at the order-status level.

## Payment boundary

- Billplz API key is server-side only.
- Use the sandbox endpoint unless `BILLPLZ_MODE=live` is explicitly configured.
- A public HTTPS `PUBLIC_BASE_URL` is required for provider callbacks.
- FPX is enabled by default on eligible Billplz Collection accounts; cards and e-wallets need separate activation.
- Never mark an order paid from browser redirect parameters.
- Production launch still requires merchant approval, callback tests, refunds/cancellation handling, reconciliation, database transactions and operational monitoring.

## Storage limitation

The current JSON persistence is durable on a persistent filesystem and uses atomic file replacement, but it is not a transactional multi-process database. It is suitable for the current single-instance prototype, not a high-concurrency production shop. A PostgreSQL/MySQL migration is the next infrastructure hardening milestone.

## Music and games

The original soundtrack is synthesized in the browser using Web Audio. It does not download or redistribute third-party music. The Snake game stores its best score locally. Other legacy mini-games are tracked separately in the migration checklist.

## Ecological Atlas

Species data distinguishes:
- wild/native range,
- habitat ecology,
- ornamental domestication or selective-breeding history.

Map markers represent broad regional reference points, not precise collection locations or surveyed range polygons.
