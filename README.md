# 墨灵 · Ink Spirit / Sea Garden FYP

Ink Spirit is an interactive Chinese ink-wash ecosystem with companion creatures, ecological exploration, creature growth, original procedural music and a connected Sea Garden aquarium storefront.

## Current features

- Ink Spirit creature selection: koi, dragon, snake and turtle.
- Browser-local prototype creature progression.
- Original procedural soundtrack generated with Web Audio: plucked-string motifs, bamboo-flute-like tones and soft water/ocean ambience. Start it with the floating music control.
- Original SVG product illustrations for koi, betta, aquarium, filter, fish food and aquatic plants.
- Sea Garden storefront reads products from the server API.
- New Snake game: keyboard, WASD, touch controls, pause/restart and local best score.
- Ecological Atlas with regional distribution summaries for Betta splendens, Amphiprion ocellaris, Carassius auratus and ornamental koi history.
- Virtual aquarium simulator: authenticated, user-isolated tanks; freshwater/marine selection; fish cohorts, guppy breeding prototype, decorative aquascaping, plant growth and auxiliary organism collections. Simulation values are game mechanics, not real husbandry or compatibility advice.
- Server-side account sessions using HttpOnly cookies; password hashes use scrypt.
- Admin/manager product catalogue endpoints, admin-only role management, and stock fields.
- Server-persisted carts and order records using atomic JSON file writes.
- Billplz checkout integration code with server-side bill verification. Payment remains disabled until merchant credentials and a public HTTPS callback URL are configured.
- GitHub Actions frontend syntax and API tests.

## Run locally

Requires Node.js 18+.

```bash
cd server
npm install
npm start
```

Open `http://localhost:3000`.

Run checks:

```bash
npm run check:frontend
npm test
```

## Virtual aquarium testing

1. Start the server using the local setup above and open `http://localhost:3000`.
2. Register a normal account from the site, then sign in.
3. Open **模拟水族箱 / Virtual Aquarium** from the homepage navigation, or visit `http://localhost:3000/virtual-aquarium.html`.
4. Create a freshwater tank (for example, 60 L), add a fish, then try the plant, auxiliary-organism and aquascape controls.
5. Create a marine tank separately to see the marine catalogue. The server rejects freshwater catalogue entries in marine tanks and vice versa.
6. Refresh the page to confirm tank data persists. Register a second account to verify that it cannot access the first account's tank.

Automated checks: run `npm run check:frontend` and `npm test` from the `server` directory. The CI workflow runs both checks on every push to `main`.

## Administrator setup

Set these environment variables before starting the server:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` (use a long unique password)
- Optional: `ADMIN_EMAIL`

On startup, the server creates the bootstrap administrator if it does not already exist. Public registration always creates a normal `user` account. Administrators can promote accounts to `manager` or `admin` through the Admin Studio. Managers can manage products and view orders; only admins can change roles and archive products.

See `server/.env.example` for the environment template. Never commit real credentials.

## Billplz payment setup

The integration targets Billplz because it supports Malaysian FPX and offers additional card/e-wallet methods subject to account activation. FPX is enabled by default for eligible Collection accounts; cards and e-wallets require separate activation. See the official [Billplz overview](https://support.billplz.com/guide/overview) and [API documentation](https://support.billplz.com/api).

Configure:

- `BILLPLZ_MODE=sandbox` for initial testing.
- `BILLPLZ_API_KEY`
- `BILLPLZ_COLLECTION_ID`
- `PUBLIC_BASE_URL` as a publicly reachable HTTPS origin.

Create a Billplz Sandbox account and collection first. The application creates bills server-side, redirects the customer to Billplz, receives the callback, and verifies the bill by retrieving it from Billplz before marking an order paid. Do not switch to live mode until merchant verification, payment-method activation, webhook reachability, and end-to-end sandbox tests are complete.

The current deployment is not yet configured with merchant credentials, so real checkout cannot be activated from the repository alone.

## Data and deployment notes

- Accounts, sessions, products, carts and orders are stored in `server/data/` at runtime.
- JSON writes are atomic for a single Node process, but this file-based store is a prototype. For concurrent production traffic, migrate to PostgreSQL/MySQL with transactions, database backups and migrations.
- Set a persistent `DATA_DIR` on the deployment platform. Ephemeral hosting filesystems will lose JSON data after redeploy/restart.
- Use HTTPS in production. The session cookie is marked Secure when `NODE_ENV=production`.
- Set `PUBLIC_BASE_URL` to the exact HTTPS deployment origin so Billplz can reach the callback.
- The payment integration has not been activated against a merchant account and is not a claim of live payment acceptance.

## Project documentation

- [Product roadmap](docs/ROADMAP.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Migration status](docs/MIGRATION_STATUS.md)
- [Payment integration guide](docs/PAYMENTS.md)
