# Migration Status

| Area | Status | Notes |
|---|---|---|
| Ink Spirit homepage | Expanded prototype | Ink-wash scene, four creature selector, guest-local progression and authenticated server-synced creature growth. |
| Aquatic visual assets | Expanded | Original SVG artwork for koi, betta, goldfish, guppy, clownfish, Asian arowana reference, freshwater and reef habitat scenes, plus aquarium equipment. |
| Product catalogue seed | Improved | New starter products are appended by ID without overwriting existing product records. |
| Original soundtrack | Procedural soundtrack implemented | Web Audio composition: plucked-string, flute-like tones and filtered water ambience. It is generated in-browser; no standalone MP3 is bundled yet. |
| Snake | Rebuilt | Keyboard, WASD, touch controls, pause/restart, speed progression and local best score. |
| 2048 | Rebuilt | Keyboard, WASD, swipe and touch direction controls, score, best score and win/continue state. |\n| Sudoku | Rebuilt prototype | Generated unique-solution puzzles, three difficulty settings, notes mode, keyboard/numpad input, mistake feedback, timer and completion detection. |\n| Tetris | Rebuilt prototype | Seven tetrominoes, rotation with wall kicks, collision/locking, line clears, level-based speed, pause, hard drop, touch controls and local best score. |
| Mini-game hub | Expanded | Snake, 2048, Sudoku and Tetris are linked as playable front-end prototypes. |
| Ecological Atlas | Expanded | Bilingual Leaflet atlas with eight species, freshwater/marine filters, native-range notes, habitat descriptions and responsible-release guidance. Regional markers are illustrative, not exact occurrence records. |
| Server sessions | Implemented prototype | HttpOnly cookie, hashed session token store, scrypt password hashes. |\n| Creature activity journal | Implemented prototype | Per-account history of interactions, feeding and first-time habitat discoveries; latest 30 returned, latest 100 retained; guest events stored locally. |\n| Creature personalities and behaviors | Implemented presentation prototype | Four distinct temperament descriptions, idle-behavior text, interaction responses and per-creature 2D motion; no autonomous AI or 3D simulation. |\n| Creature care and bonding | Implemented prototype | Per-creature satiety, mood, bond points, three fictional foods, three daily feeds per creature, guest-local fallback and server validation; JSON persistence. |\n| Creature progression | Implemented prototype | Authenticated per-user creature XP, levels, visits, selected companion, server-calculated rewards and a 50-interaction daily cap; JSON persistence. |
| Habitat exploration | Implemented prototype | Four realms, authenticated discovery records, one-time server-calculated 25 XP reward to selected companion, guest-local fallback; JSON persistence. |
| Admin/manager permissions | Implemented prototype | Server-side role checks; role-aware Admin Studio navigation; bootstrap via environment variables. |
| Product CRUD | Implemented prototype | Admin/manager create/update; admin archive. |
| Server cart/orders | Implemented prototype | JSON file persistence; persistent single-instance disk required. |
| Payment gateway | Deferred | No live provider enabled. TNG eWallet is the first Malaysia provider to evaluate if payment becomes necessary. Billplz remains legacy prototype code only. |
| Original video assets | Pending | Visual direction uses original ink-wash SVG/CSS artwork; animation/video production remains a separate task. |

## Important limitations
- Species locations are broad educational reference points, not field-verified boundaries or collection coordinates.
- Live-animal availability, local regulations, health certificates and shipping requirements must be verified before listing animals for sale.
- JSON persistence is not a substitute for transactional SQL storage in a production multi-instance shop.
- No payment should be represented as successful until a trusted provider callback or server-side verification confirms it.

See [Deployment and Payments](DEPLOYMENT_AND_PAYMENTS.md) before configuring production services.
