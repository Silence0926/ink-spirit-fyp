# Product Roadmap / 产品路线图

## Product definition

Ink Spirit is a browser-based interactive ecosystem, not a combat game. It combines a living Chinese ink-wash world with companion creatures, habitat exploration, collection, and growth. Sea Garden aquarium browsing and commerce remain a connected but separate area.

## Milestone status

### M1 — Ink Spirit visual foundation
**Status: Implemented prototype**
- Rice-paper, ink, mist, mountain, water and vermilion-seal design language.
- Responsive landing page and accessible creature selector.
- Four initial creature choices: koi, dragon, snake, and turtle.
- Browser-local selection and experience/level prototype.

### M2 — Sea Garden restoration and API foundation
**Status: In progress**
- Restored the legacy homepage, shop, fish list, map, search, cart, checkout/payment demonstration, order history, login, registration, profile, and role pages.
- Reconnected registration/login pages to Express APIs.
- Added JSON-file account/product storage and music playlist discovery.
- Added scrypt password hashing and legacy plaintext password upgrade.
- Remaining: original image/video assets, MP3 tracks, mini-game pages, complete original page styling, product CRUD, and persistent orders.

### M3 — Living companions and habitat engine
- Standardize creature metadata: id, display name, species, habitat, motion profile and unlock state.
- Add idle, hover, selected, interaction, and growth states.
- Build a reusable scene registry with scene-specific palette, environmental layers and ambient motion.
- Implement scene transitions for lotus pond, cloud mountain, bamboo grove and quiet marsh.

### M4 — Creature collection and development
- Define persistent creature identity, level, experience, growth stage and attributes.
- Move progression from localStorage to authenticated server-side storage.
- Add collection, creature detail, feeding/interaction, and unlock interfaces.
- Add deterministic progression tests and anti-tampering validation.

### M5 — Sea Garden commerce completion
- Audit original catalogue and product data.
- Implement product create/update/delete with server-side role checks.
- Move cart, checkout and order history to server-side persistence.
- Integrate a payment provider only after business and security requirements are confirmed.

### M6 — Security and release
- Implement server-side sessions or signed tokens, logout/revocation, and role-based authorization.
- Validate all request bodies and rate-limit authentication endpoints.
- Add CSRF protections where cookie-based sessions are used.
- Add accessibility, responsive, browser, and end-to-end tests.
- Deploy only after secrets, persistence, backups, and payment boundaries are reviewed.

## Acceptance criteria

- A visitor can select each available creature without a page reload.
- Scene, creature description and accessible labels update together.
- Selection persists after refresh on the same browser.
- Experience cannot become negative; level progression is deterministic.
- Account passwords are never stored in plaintext by the API.
- Public registration cannot self-assign admin or manager roles.
- The checkout clearly states that no real payment is processed.
- The interface remains usable on mobile and with reduced-motion preferences.
