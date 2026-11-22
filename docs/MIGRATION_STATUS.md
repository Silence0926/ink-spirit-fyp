# Migration Status / 迁移状态

This table tracks the migration from the uploaded FYP archive into `ink-spirit-fyp`.

| Area | Status | Notes |
|---|---|---|
| Ink Spirit homepage and creature selector | Implemented prototype | Existing new homepage retained. |
| Sea Garden legacy homepage | Restored | Available as `index-seagarden-legacy.html`. |
| Fish shop and catalogue cards | Rebuilt prototype | Product cards currently use graphic placeholders. |
| Fish list | Rebuilt prototype | Three species descriptions; no original images yet. |
| Map | Restored reference | Original Aquaria KLCC embed; no fish birthplace data. |
| Search | Rebuilt | Keyword routing and small static dataset. |
| Cart | Rebuilt browser-local flow | Not server-persistent. |
| Checkout/payment | Demo only | Explicitly does not process real payment. |
| Order history | Browser-local demo | No server-side orders. |
| Registration/login | Connected to Express API | Scrypt password hashing; no server session/token yet. |
| Profile and role dashboards | Rebuilt prototype | Browser display state is not a security boundary. |
| Music playlist API/player | Implemented | Original archive had no MP3 tracks. |
| Original image/video assets | Pending | Not yet uploaded to repository. |
| Original mini-games | Pending | 2048, snake, sudoku, tetris, and game hub not migrated yet. |
| Product CRUD/admin authorization | Pending | Read-only product endpoint exists. |
| Production auth and payment | Pending | Must not be treated as production-ready. |

## Migration rule

Keep `index.html` as the Ink Spirit entry point. Preserve the Sea Garden experience at a separate page and route; do not overwrite the Ink Spirit homepage with the old aquarium homepage.
