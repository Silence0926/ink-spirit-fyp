# 墨灵 · Ink Spirit / Sea Garden FYP

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Silence0926/ink-spirit-fyp)

Ink Spirit is an interactive Chinese ink-wash ecosystem with companion creatures, ecological exploration, creature growth, original procedural music and a connected Sea Garden aquarium storefront.

## Current features

- Ink Spirit creature selection: koi, dragon, snake and turtle.
- Browser-local prototype creature progression.
- Provisional procedural soundtrack study generated with Web Audio. It is a technical playback prototype, not the approved final musical direction; the final soundtrack remains subject to composition and listening review.
- Original SVG product illustrations for koi, betta, aquarium, filter, fish food and aquatic plants.
- Sea Garden storefront reads products from the server API.
- New Snake game: keyboard, WASD, touch controls, pause/restart and local best score.
- Aquatic life atlas with 8 ornamental fish and 4 auxiliary invertebrates, including native-range notes, care summaries, source references, shop filters and simulator links.
- Virtual aquarium simulator: authenticated, user-isolated tanks; freshwater/marine selection; fish cohorts, guppy breeding prototype, decorative aquascaping, plant growth and auxiliary organism collections drawn from the shared species catalogue. Simulation values are game mechanics, not real husbandry or compatibility advice.
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

For an auxiliary organism to appear as a purchasable item, an administrator should create a product in Admin Studio, select its matching linked species (for example, Cherry Shrimp), choose the `Aquatic Invertebrates` category, and enter the actual selling price and available stock. The encyclopedia's **查看相关藏品** link then filters the storefront to that organism. No stock or price is fabricated by the species catalogue.


## Billplz payment setup

The integration targets Billplz because it supports Malaysian FPX and offers additional card/e-wallet methods subject to account activation. FPX is enabled by default for eligible Collection accounts; cards and e-wallets require separate activation. See the official [Billplz overview](https://support.billplz.com/guide/overview) and [API documentation](https://support.billplz.com/api).

Configure:

- `BILLPLZ_MODE=sandbox` for initial testing.
- `BILLPLZ_API_KEY`
- `BILLPLZ_COLLECTION_ID`
- `PUBLIC_BASE_URL` as a publicly reachable HTTPS origin.

Create a Billplz Sandbox account and collection first. The application creates bills server-side, redirects the customer to Billplz, receives the callback, and verifies the bill by retrieving it from Billplz before marking an order paid. Do not switch to live mode until merchant verification, payment-method activation, webhook reachability, and end-to-end sandbox tests are complete.

The current deployment is not yet configured with merchant credentials, so real checkout cannot be activated from the repository alone.

## Public online demo deployment

This repository includes a Render Blueprint at the repository root. To create a public online demo, use the **Deploy to Render** button above, sign in to Render, review the service configuration, and approve deployment.

The Blueprint deploys the Express application from the `server/` directory to a Singapore-region free web service. During setup, provide private values for `ADMIN_USERNAME` and `ADMIN_PASSWORD` (use a long, unique password). Never put these values in GitHub files. Render then builds and starts the app and exposes it at its generated `onrender.com` address. Connect the Render service to the repository's `main` branch to enable automatic deployment on future pushes.

**Demo limitations:** Render Free services sleep after 15 minutes without traffic, may take about a minute to wake, and use an ephemeral filesystem. Accounts, aquarium progress, orders, uploaded product images and other JSON-backed data can be lost after a restart, sleep or redeploy. This free configuration is for online acceptance testing only, not production or real customer data. Durable public operation requires persistent storage or a database migration; do not enable live payments on this demo.

GitHub Pages alone is not suitable for this repository because the application requires an Express server for authentication, API routes, shopping carts, orders and simulator persistence. Render hosts the server; GitHub remains the source repository and CI/CD trigger.

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
