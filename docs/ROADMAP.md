# Product Roadmap / 产品路线图

## M1 — Ink Spirit visual foundation
**Prototype implemented**
- Rice-paper, ink, mist, mountain and vermilion seal visual language.
- Four selectable companion creatures and browser-local progression.
- Procedural original soundtrack.

## M2 — Sea Garden visual and game restoration
**In progress**
- New SVG illustrations for fish and aquarium products.
- Rebuilt Snake game with keyboard and mobile controls.
- 2048, Sudoku and Tetris still need restoration and validation from the original FYP source.
- Full-resolution animated ecosystem scenes and video-style environmental motion remain in design.

## M3 — Ecology Atlas
**First version implemented**
- Regional habitat map for betta, clownfish, goldfish and koi history.
- Source-linked species summaries and distinction between native range and ornamental breeding history.
- Next: more species, range polygons, habitat layers and conservation status.

## M4 — Commerce and account system
**Backend prototype implemented**
- HttpOnly server sessions and scrypt password hashes.
- Admin bootstrap from environment variables.
- Product create/update/archive APIs and admin UI.
- Manager access for product and order management.
- Server-persisted carts and orders.
- Billplz hosted-checkout integration code with authoritative server-side bill lookup.
- Next: migrate JSON storage to relational database, add transaction-safe stock reservation, refund/cancellation, audit log, CSRF defence-in-depth and stronger rate limiting.

## M5 — Production payments and release
**Not activated**
- Create and verify a Billplz merchant account and sandbox collection.
- Complete sandbox payment, callback, duplicate callback, failure and reconciliation tests.
- Activate FPX/card/e-wallet methods on the merchant account as required.
- Add public HTTPS deployment, persistent database, backups, monitoring and refund workflows.
- Switch to production credentials only after merchant approval and end-to-end acceptance.

## Acceptance criteria
- No public registration can grant privileged roles.
- Admin APIs reject unauthenticated and unauthorized requests.
- A user's cart and orders remain available across browser sessions.
- Orders are marked paid only after provider-side verification.
- Stock is not reduced by an unverified browser redirect.
- Ecological map distinguishes native distribution from ornamental breeding history.
- Music is original and user-initiated.


## M6 — Virtual aquarium playable prototype
**V1–V4 prototype implemented; automated CI passed**
- Create and manage per-user freshwater/marine virtual tanks.
- Add fish cohorts, simulate feeding, water changes, filter maintenance and a limited guppy breeding loop.
- Customize tanks with water-type-filtered decorative elements.
- Add plant cohorts with deterministic growth stages and care actions.
- Add auxiliary organism cohorts, with water-type category validation and per-tank quantity limits.
- Next validation: manual browser acceptance on desktop and mobile; improve scene rendering and refine ecosystem rules only after user testing.
