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

## Billplz payment setup (Malaysia)
The project contains a Billplz API integration. It does **not** collect real money until the merchant account, collection, API key, callback URL and deployment have been configured and tested.

Required environment variables:
- `BILLPLZ_MODE=sandbox` (switch to `live` only after testing and merchant approval)
- `BILLPLZ_API_KEY`
- `BILLPLZ_COLLECTION_ID`
- `PUBLIC_BASE_URL` (public HTTPS origin)

Steps:
1. Create/verify a Billplz merchant account and a collection.
2. Use sandbox credentials first.
3. Set the variables above in the hosting provider's secret/environment settings.
4. Ensure the provider can reach `POST /api/payments/billplz/callback`.
5. Test successful, cancelled, failed, duplicate-callback and wrong-amount cases in sandbox.
6. Review order status and stock changes before switching to live credentials.

Never put the API key in browser JavaScript. Do not mark an order paid based only on the customer's redirect page; confirmation must be verified server-to-server.

## Persistence and deployment
The application currently stores users, sessions, products, carts and orders in JSON files. This is suitable only for a single-instance prototype on a persistent disk. It is not safe for multiple server instances or high-concurrency sales because file writes are not database transactions. Production should migrate records to PostgreSQL/MySQL with transactions and unique constraints, add backups, monitoring, HTTPS, CSRF protection and a managed session store.

If hosting storage is ephemeral, set `DATA_DIR` to a mounted persistent volume. Otherwise accounts, carts and orders can be lost on redeployment.

## Production readiness checklist
- [ ] Transaction-safe database and stock reservation
- [ ] CSRF protection and secure cookie configuration behind HTTPS
- [ ] Rate limiting shared across instances
- [ ] Email verification and password reset
- [ ] Admin MFA and audit log
- [ ] Billplz merchant approval and sandbox test evidence
- [ ] Refund, cancellation and reconciliation procedures
- [ ] Privacy notice, terms, shipping and refund policy
- [ ] Backup/restore test and operational monitoring

This integration is a development-stage payment adapter, not a claim of production payment readiness.
