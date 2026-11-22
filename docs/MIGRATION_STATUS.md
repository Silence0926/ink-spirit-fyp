# Migration Status

| Area | Status | Notes |
|---|---|---|
| Ink Spirit homepage | Implemented prototype | Ink-wash scene, four creature selector and local progression. |
| Aquatic visual assets | Expanded | Original SVG artwork for koi, betta, goldfish, guppy, clownfish, Asian arowana reference, freshwater and reef habitat scenes, plus aquarium equipment. |
| Product catalogue seed | Improved | New starter products are appended by ID without overwriting existing product records. |
| Original soundtrack | Procedural soundtrack implemented | Web Audio composition: plucked-string, flute-like tones and filtered water ambience. It is generated in-browser; no standalone MP3 is bundled yet. |
| Snake | Rebuilt | Keyboard, WASD, touch controls, pause/restart, speed progression and local best score. |
| Mini-game hub | Added | Snake is playable; 2048, Sudoku and Tetris remain pending migration/testing. |
| Ecological Atlas | Expanded | Bilingual Leaflet atlas with eight species, freshwater/marine filters, native-range notes, habitat descriptions and responsible-release guidance. Regional markers are illustrative, not exact occurrence records. |
| Server sessions | Implemented prototype | HttpOnly cookie, hashed session token store, scrypt password hashes. |
| Admin/manager permissions | Implemented prototype | Server-side role checks; role-aware Admin Studio navigation; bootstrap via environment variables. |
| Product CRUD | Implemented prototype | Admin/manager create/update; admin archive. |
| Server cart/orders | Implemented prototype | JSON file persistence; persistent single-instance disk required. |
| Payment gateway | Deferred | No live payment provider enabled. If required for Malaysia, evaluate TNG eWallet merchant integration first, subject to eligibility and official integration access. |
| Original video assets | Pending | Visual direction uses original ink-wash SVG/CSS artwork; animation/video production remains a separate task. |

## Important limitations
- Species locations are broad educational reference points, not field-verified boundaries or collection coordinates.
- Live-animal availability, local regulations, health certificates and shipping requirements must be verified before listing animals for sale.
- JSON persistence is not a substitute for transactional SQL storage in a production multi-instance shop.
- No payment should be represented as successful until a trusted provider callback or server-side verification confirms it.

See [Deployment and Payments](DEPLOYMENT_AND_PAYMENTS.md) before configuring production services.
