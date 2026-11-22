# Deployment, Admin Bootstrap and Payment Gateway

## Local setup
1. Install Node.js 18 or later.
2. Open a terminal in `server/` and run `npm install`.
3. Set the environment variables listed below in your local environment (do not commit secrets).
4. Run `npm start` and open `http://localhost:3000`.

## Administrator access
The first administrator is bootstrapped only when both `ADMIN_USERNAME` and `ADMIN_PASSWORD` are present at server startup. If that username already exists, its role is promoted to `admin`; its password is not reset. Remove bootstrap credentials from the deployment environment after verifying access.

- `user`: own profile, cart and orders.
- `manager`: product create/update and order read access.
- `admin`: manager capabilities plus product archival, user listing and role changes.

The server enforces permissions on API routes. Hiding a frontend link is not an authorization boundary.

## Payment status and future TNG eWallet evaluation

**Payment is intentionally deferred. No live payment provider is enabled.** TNG eWallet is the first provider to evaluate if online payment becomes necessary for the Malaysia deployment. This is a planning preference, not confirmation of merchant approval, API access, or a working integration.

The repository contains an earlier Billplz development adapter under `/api/checkout` and `/api/payments/billplz/callback`. Treat it as legacy prototype code only:
- Do not configure production Billplz credentials or present Billplz as the selected provider.
- Do not enable checkout in a live environment until the adapter is reviewed, tested and explicitly selected.
- Do not claim an order is paid based on a browser redirect; only trusted server-side provider verification may confirm payment.

Before implementing TNG eWallet, verify current merchant eligibility, onboarding requirements, official API/SDK availability, supported payment flow, signing/authentication method, callback/webhook verification, refund handling, sandbox access and settlement terms directly with TNG's official merchant documentation. Do not reverse-engineer private endpoints or collect wallet credentials in this application.

When approved for implementation, the payment design must include:
1. Server-created payment intents linked to immutable order totals.
2. Server-side signature/authentication and callback verification.
3. Idempotent payment event handling and duplicate callback protection.
4. Amount, currency, merchant and order-reference validation.
5. Explicit pending, paid, failed, cancelled and refunded states.
6. Stock reservation/release rules, reconciliation and audit logs.
7. Sandbox evidence for success, cancellation, failure, duplicate callbacks and amount mismatch.

Until those prerequisites are met, checkout should remain unavailable rather than simulate a successful payment.

## Persistence and deployment
The application currently stores users, sessions, products, carts and orders in JSON files. This is suitable only for a single-instance prototype on a persistent disk. It is not safe for multiple server instances or high-concurrency sales because file writes are not database transactions. Production should migrate records to PostgreSQL/MySQL with transactions and unique constraints, add backups, monitoring, HTTPS, CSRF protection and a managed session store.

If hosting storage is ephemeral, set `DATA_DIR` to a mounted persistent volume. Otherwise accounts, carts and orders can be lost on redeployment.

## Production readiness checklist
- [ ] Transaction-safe database and stock reservation
- [ ] CSRF protection and secure cookie configuration behind HTTPS
- [ ] Rate limiting shared across instances
- [ ] Email verification and password reset
- [ ] Admin MFA and audit log
- [ ] TNG merchant eligibility and official integration access verified (only if payment is required)
- [ ] Sandbox payment and callback test evidence (before any live payment)
- [ ] Refund, cancellation and reconciliation procedures
- [ ] Privacy notice, terms, shipping and refund policy
- [ ] Backup/restore test and operational monitoring

This application is a development-stage prototype, not a claim of production payment readiness.
