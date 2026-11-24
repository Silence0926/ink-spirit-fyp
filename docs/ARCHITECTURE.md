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
- Admin Studio supports catalogue search, active/archive filtering, fixed product categories, built-in SVG asset selection and live preview. It stores an asset path, not uploaded image bytes.
- APIs enforce roles on the server; localStorage is no longer an authorization source.

## Commerce data

Runtime files:
- `users.json`
- `sessions.json`
- `products.json`
- `carts.json`
- `orders.json`\n- `creature-progress.json`
- `exploration-progress.json`

Carts are stored per authenticated user. Checkout snapshots product names, unit prices and quantities into an order. The order starts as `pending_payment`. The server creates a Billplz bill in the configured environment and redirects the customer to the provider-hosted payment page.

The Billplz callback is not trusted by itself. The server retrieves the Bill from Billplz using the server-side API key, checks the paid state and exact amount, and only then marks the order `paid`, decrements stock and clears the user's cart. Duplicate callbacks are idempotent at the order-status level.

## Creature progression\n\n- Authenticated players have per-account progression for koi, dragon, snake and turtle.\n- The server owns the fixed interaction reward, XP-to-level calculation, visit count and selected companion. Client-submitted reward values are ignored.\n- A daily UTC-based cap of 50 rewarded interactions per account limits trivial reward farming.\n- Guest progress remains browser-local; signing in loads the server record for cross-device continuity.\n- Progress is stored in `creature-progress.json` and inherits the single-instance JSON-storage limitation described below.\n\n## Payment boundary

- Billplz API key is server-side only.
- Use the sandbox endpoint unless `BILLPLZ_MODE=live` is explicitly configured.
- A public HTTPS `PUBLIC_BASE_URL` is required for provider callbacks.
- FPX is enabled by default on eligible Billplz Collection accounts; cards and e-wallets need separate activation.
- Never mark an order paid from browser redirect parameters.
- Production launch still requires merchant approval, callback tests, refunds/cancellation handling, reconciliation, database transactions and operational monitoring.

## Storage limitation

The current JSON persistence is durable on a persistent filesystem and uses atomic file replacement, but it is not a transactional multi-process database. It is suitable for the current single-instance prototype, not a high-concurrency production shop. A PostgreSQL/MySQL migration is the next infrastructure hardening milestone.

## Music and games

The original 48-second instrumental soundtrack is bundled as MP3 with WAV master fallback. Playback is user-initiated, loops, and supports volume control. The Snake game stores its best score locally; game progress is not server-synced.

## Ecological Atlas

- The species guide and Leaflet atlas share stable species IDs (`koi`, `betta`, `goldfish`, `guppy`, `arowana`, `clown`, `blue-tang`, `seahorse`).
- The guide supports text search and freshwater/marine filters; each entry opens the matching atlas marker with `?species=<id>`.
- Map markers are regional educational references, not precise occurrence records or verified collection coordinates.

Species data distinguishes:
- wild/native range,
- habitat ecology,
- ornamental domestication or selective-breeding history.

Map markers represent broad regional reference points, not precise collection locations or surveyed range polygons.


## Habitat exploration

- Four authored realms are tracked per authenticated account: lotus pond, cloud mountain, bamboo forest and quiet marsh.
- The first discovery of each realm grants 25 XP to the currently selected companion. The server validates habitat IDs and enforces one-time rewards; repeat requests return zero XP.
- Discovery timestamps and IDs are stored in `exploration-progress.json`. Guest discoveries are browser-local and do not grant server-backed XP.


## Creature care and bonding

- Authenticated care records are stored per account and creature in `creature-care.json`.
- A per-account activity journal in `creature-journal.json` records companion interactions, feedings and first-time realm discoveries. The API returns the latest 30 events; storage retains the latest 100.
- Three fictional care foods are available: moon dew, lotus seed and cloud fruit. They are narrative items, not real animal diet recommendations.
- Each feeding restores 20 satiety (capped at 100) and adds 5 bond points; each successful companionship interaction adds 1 bond point. Relationship stage is derived at 0–19 (初识), 20–49 (熟悉), 50–99 (亲近), and 100+ (心契). Each creature has a server-enforced daily limit of three feedings; a full creature cannot be fed.
- Satiety decreases by 10 points per six elapsed hours after feeding; mood is derived from satiety: 70–100 calm/comfortable, 35–69 peaceful, 0–34 needs care. Guest care state is browser-local.
- Daily counters use UTC dates. The current prototype does not simulate passive hunger decay or real-time biological needs.


## Creature personality presentation

- Each companion has authored temperament, idle-behavior copy and a distinct interaction response: koi is lively and friendly, dragon is dignified and protective, snake is alert and quiet, and turtle is steady and gentle.
- The homepage renders the selected companion's temperament and behavior description and plays a creature-specific Web Animations API motion on interaction. This is a 2D presentation layer; it does not yet simulate autonomous AI behavior, pathfinding, or real-time 3D animation.


## Creature evolution

- Evolution is calculated by the server from both creature level and bond; clients cannot submit an evolution stage.
- Stage 1 (初生灵形) is the starting form. Stage 2 (灵脉初醒) requires level 5 and bond 20. Stage 3 (灵韵化境) requires level 10 and bond 50.
- The care API returns the calculated evolution for each creature. The homepage renders the stage, next-stage requirements and a restrained 2D ink-aura treatment. Guest mode calculates the same thresholds from browser-local progress.
- These are presentation-stage unlocks, not separate 3D models. Unique stage-specific creature meshes, rigging, skeletal animation and special ability systems remain future work.


## Companion signature abilities

- Each companion has one authored, non-combat visual technique: koi (锦鲤跃波 / ripple leap), dragon (云龙现世 / cloudborne presence), snake (幽影潜行 / veil of ink), and turtle (玄甲守心 / tortoise ward).
- Abilities unlock only when the companion reaches level 5 and bond 50. The server derives this from stored progression and care records; clients cannot submit an unlock state or another creature's ability ID.
- Authenticated activation is limited to five uses per creature per UTC day and is recorded in the companion journal. No XP, damage, combat advantage or paid item is granted.
- Guest activations are stored locally in the browser. Effects are 2D Web Animations and CSS presentation, not physics, autonomous AI or 3D skills.


## Original soundtrack

- The homepage now plays the repository-owned original track in MP3 format (`server/public/audio/ink-spirit-original.mp3`, 128 kbps, 22.05 kHz) with the WAV master (`server/public/audio/ink-spirit-original.wav`) as a browser fallback. The composition is 48 seconds long.
- The composition is procedurally synthesized for this project: guzheng-like plucked tones, airy bamboo-flute-like melody and a softly filtered, tide-like ambient bed. The water texture is synthesized ambience, not a field recording.
- Playback is user-initiated, loops continuously, and includes a volume control. No third-party song or external streaming service is required.
- The earlier Web Audio real-time sketch has been replaced on the homepage by the standalone audio asset. Other pages are unchanged.


## Inventory control

- Admin and Manager roles can adjust stock with a signed integer delta or set an absolute quantity through the staff API. Every manual movement requires a reason and records previous/new stock, delta, product, actor ID/role and timestamp.
- The server rejects adjustments that would make stock negative or exceed 1,000,000 units. Each product has a configurable low-stock threshold (default 5); Admin Studio highlights active products at or below that threshold and offers a low-stock filter.
- The latest 10,000 manual movements are retained in `inventory-movements.json`; the per-product history endpoint returns the latest 50. Existing checkout/payment stock allocation and order cancellation restoration remain separate from manual movements.
- This audit file and product file are still JSON documents. Updates are not transactional across processes, so the feature is suitable for the current single-instance prototype only; production requires database transactions and a unified inventory ledger that also records order allocations, cancellations, returns and supplier receipts.


## Product media handling

- Admin and Manager roles can upload product images through `POST /api/admin/media/products`. The endpoint accepts raw JPEG, PNG or WebP bodies up to 5 MB, verifies the declared MIME type against file signatures, generates a UUID filename, and stores the asset under `server/public/uploads/products/` for static delivery.
- Product image fields accept site-local `/images/...` or `/uploads/...` paths with supported image extensions, or HTTPS URLs. Protocol-relative paths, traversal segments and non-HTTPS external URLs are rejected.
- Uploads are not automatically resized or optimized. Replacing an image does not yet garbage-collect the previous asset; production should add image processing, malware scanning, storage quotas, orphan cleanup and object storage/CDN integration.


## Structured aquatic product specifications

- Products may carry an optional `specifications` object: water type (freshwater, marine, brackish or any), care difficulty, minimum tank volume, temperature range, adult size and short care notes.
- The API validates enumerations and numeric bounds and rejects inverted temperature ranges. Generic equipment, food and aquarium products can leave aquatic-life fields empty.
- Admin/Manager edit forms expose the same fields. The public catalogue can filter by water type, care difficulty and stock availability; product detail pages display only supplied values.
- Values are seller-entered catalogue metadata, not independently verified husbandry guarantees. Staff should use reliable species references and distinguish adult size, minimum tank volume and temperature ranges from universal standards.


## Admin business analytics

- `GET /api/admin/analytics?range=7d|30d` is restricted to Admin and Manager roles. It returns aggregate verified-payment totals, period gross, order status counts, active catalogue and low-stock counts, daily gross, category counts and best-selling lines. It does not expose customer identifiers or order-level PII.
- Gross payment metrics include only orders with `paymentVerified === true`, set after provider verification. Pending and unverified orders are excluded. The project does not currently integrate refunds, so gross verified payments are not net revenue.
- Dashboard data is calculated from JSON files at request time. This is suitable for the current single-instance prototype, not a high-volume analytics warehouse. The underlying JSON persistence is not transactional across multiple server processes.


## Shared species catalogue

- `server/species-catalogue.json` is the canonical eight-species reference dataset. The public `GET /api/species` endpoint serves the shared records used by the ecology atlas, species guide, product detail page, and Admin product editor.
- Product records may carry an optional `speciesId`; the server validates it against the canonical catalogue. Generic aquarium equipment, food, and plants may leave the field empty.
- Species records distinguish native-range summaries, habitat descriptions, domestication/origin notes, care notes, conservation/legal cautions, broad map reference coordinates, and further-reading source URLs. Map coordinates are regional educational markers, not precise occurrence or collection records. The dataset is introductory and should be reviewed against current taxonomic, conservation, and local regulatory references before operational use.
- Existing legacy product IDs retain a temporary front-end association fallback. New and edited products should use the explicit species reference.


## Aquarium encyclopedia

- `server/aquarium-encyclopedia.json` stores reviewed educational articles, categories, warnings, structured sections, tags, and external references. Public APIs: `GET /api/encyclopedia` (optional `category` and `q` filters) and `GET /api/encyclopedia/:slug`.
- The public `encyclopedia.html` page renders article content using text nodes, supports category filtering, search, and expandable reading. It is an educational reference, not a veterinary diagnostic or treatment system.
- Articles distinguish general principles from species/system-specific requirements. Water targets and maintenance schedules must not be universalized; users should validate against the actual species, system, test method, and local professional guidance.
- Current content covers nitrogen cycling, testing, water changes, filtration, temperature, lighting, stocking, quarantine, feeding, warning signs, freshwater/marine differences, and emergencies. It links to UF/IFAS, RSPCA Australia, and Merck Veterinary Manual references. Content should be reviewed periodically as references and regulations change.
