# Migration Status

| Area | Status | Notes |
|---|---|---|
| Ink Spirit homepage | Implemented prototype | Four creature selector and local progression. |
| Product visual assets | First set implemented | Original SVG artwork for six product categories; additional species and aquarium scenes remain planned. |
| Original soundtrack | Procedural soundtrack implemented | Web Audio composition with plucked-string, flute-like tones and filtered water ambience. Generated in-browser; no standalone MP3 is bundled. |
| Snake | Rebuilt | Keyboard, WASD, touch controls, pause/restart, speed progression and local best score. |
| Mini-game hub | Added | Snake is playable; 2048, Sudoku and Tetris are explicitly marked pending migration/testing. |
| 2048 | Pending | Original game source must be migrated and validated. |
| Sudoku | Pending | Original game source must be migrated and validated. |
| Tetris | Pending | Original game source must be migrated and validated. |
| Ecological Atlas | First version implemented | Educational regional summaries; markers represent broad ranges, not exact collection sites. |
| Server sessions | Implemented prototype | HttpOnly cookie, hashed session token store, scrypt password hashes. |
| Admin/manager permissions | Implemented prototype | Server-side role checks; administrator bootstrap via environment variables. |
| Product CRUD | Implemented prototype | Admin/manager create/update; admin archive. |
| Server cart/orders | Implemented prototype | JSON file persistence; persistent single-instance disk required. |
| Billplz checkout | Integration code implemented | Sandbox/live mode switch; merchant credentials and public HTTPS callback still required. |
| Real payment collection | Not activated | Requires merchant credentials, public deployment URL and successful sandbox verification. |
| Original video assets | Pending | New art direction uses original ink-wash SVG/CSS artwork; video production is separate. |

See [Deployment and Payments](DEPLOYMENT_AND_PAYMENTS.md) before configuring administrator access or payment credentials.
