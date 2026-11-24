# Migration Status

| Area | Status | Notes |
|---|---|---|
| Ink Spirit homepage | Expanded prototype | Ink-wash scene, four creature selector, guest-local progression and authenticated server-synced creature growth. |
| Aquatic visual assets | Expanded | Original SVG artwork for koi, betta, goldfish, guppy, clownfish, blue tang, seahorse, Asian arowana, freshwater and reef habitat scenes, plants and aquarium equipment. |
| Product catalogue seed | Improved | New starter products are appended by ID without overwriting existing product records. Storefront includes ink-wash collection layout, category filters, search, price sorting and cart actions. |
| Original soundtrack | Implemented | Original 48-second instrumental master and MP3 are bundled; homepage player supports play/pause, volume and looping, with no autoplay. |
| Snake | Rebuilt | Keyboard, WASD, touch controls, pause/restart, speed progression and local best score. |
| 2048 | Rebuilt | Keyboard, WASD, swipe and touch direction controls, score, best score and win/continue state. |\n| Sudoku | Rebuilt prototype | Generated unique-solution puzzles, three difficulty settings, notes mode, keyboard/numpad input, mistake feedback, timer and completion detection. |\n| Tetris | Rebuilt prototype | Seven tetrominoes, rotation with wall kicks, collision/locking, line clears, level-based speed, pause, hard drop, touch controls and local best score. |
| Mini-game hub | Expanded | Snake, 2048, Sudoku and Tetris are linked as playable front-end prototypes. |
| Ecological Atlas | Expanded | Bilingual Leaflet atlas with eight species, freshwater/marine filters, native-range notes, habitat descriptions and responsible-release guidance. Species guide filters link to matching map markers through URL query parameters. Regional markers are illustrative, not exact occurrence records. |
| Server sessions | Implemented prototype | HttpOnly cookie, hashed session token store, scrypt password hashes. |\n| Creature activity journal | Implemented prototype | Per-account history of interactions, feeding and first-time habitat discoveries; latest 30 returned, latest 100 retained; guest events stored locally. |\n| Creature personalities and behaviors | Implemented presentation prototype | Four distinct temperament descriptions, idle-behavior text, interaction responses and per-creature 2D motion; no autonomous AI or 3D simulation. |\n| Creature evolution | Implemented progression prototype | Three server-calculated forms: starting form, level 5 + bond 20, and level 10 + bond 50; homepage shows stage and restrained 2D aura. Separate 3D models and rigging remain pending. |\n| Creature care and bonding | Implemented prototype | Per-creature satiety, mood, bond points, three fictional foods, three daily feeds per creature, interaction-based bond gain, four relationship stages, guest-local fallback and server validation; JSON persistence. |\n| Creature progression | Implemented prototype | Authenticated per-user creature XP, levels, visits, selected companion, server-calculated rewards and a 50-interaction daily cap; JSON persistence. |
| Habitat exploration | Implemented prototype | Four realms, authenticated discovery records, one-time server-calculated 25 XP reward to selected companion, guest-local fallback; JSON persistence. |
| Admin/manager permissions | Implemented prototype | Server-side role checks; role-aware Admin Studio navigation; bootstrap via environment variables. |
| Product CRUD | Implemented prototype | Admin/manager create/update; admin archive. Admin Studio includes catalogue search, active/archive/low-stock filters, configurable stock thresholds, audited manual stock adjustments and per-product movement history. Built-in image asset selection and live image preview; custom binary upload is not implemented. |
| Inventory controls | Implemented prototype | Admin/Manager stock adjustment and absolute set endpoint; mandatory reason, actor/time/previous/new stock audit; non-negative stock guard; configurable low-stock threshold and Admin Studio alert/filter. JSON persistence; manual movements retained up to 10,000. Order allocations/restorations remain a separate ledger. |
| Server cart/orders | Expanded prototype | JSON file persistence; Admin/Manager can advance verified, inventory-allocated orders through processing, shipped and completed states; cancellation restores allocated stock once; staff cannot forge paid status. Payment callback verifies provider state and flags paid orders with insufficient stock for manual inventory review. Persistent single-instance disk required. |
| Payment gateway | Deferred | No live provider enabled. TNG eWallet is the first Malaysia provider to evaluate if payment becomes necessary. Billplz remains legacy prototype code only. |
| Original video assets | Pending | Visual direction uses original ink-wash SVG/CSS artwork; animation/video production remains a separate task. |

## Important limitations
- Species locations are broad educational reference points, not field-verified boundaries or collection coordinates.
- Live-animal availability, local regulations, health certificates and shipping requirements must be verified before listing animals for sale.
- JSON persistence is not a substitute for transactional SQL storage in a production multi-instance shop.
- No payment should be represented as successful until a trusted provider callback or server-side verification confirms it. Staff order-status controls cannot mark an order as paid.
- Order inventory uses JSON-file updates and is not transaction-safe under concurrent multi-instance traffic. A production shop needs database transactions, stock reservation/locking, idempotency keys and a refund workflow.

See [Deployment and Payments](DEPLOYMENT_AND_PAYMENTS.md) before configuring production services.

| Companion signature abilities | Implemented prototype | Four creature-specific non-combat visual techniques; level 5 + bond 50 unlock, server-validated IDs, five daily authenticated activations per creature, journal events and guest-local fallback. Effects remain 2D presentation. |

| Original Ink Spirit soundtrack | Implemented prototype | Committed standalone 48-second original WAV master and 128 kbps MP3 export; guzheng-inspired plucks, flute-like melody, synthesized sea ambience, looping playback and volume control on homepage. |
