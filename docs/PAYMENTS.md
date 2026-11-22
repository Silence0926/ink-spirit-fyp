# Billplz Integration Guide

## Why Billplz

Billplz is a Malaysian payment gateway. Its Collection product supports FPX, with cards and e-wallets available after separate activation depending on the merchant account and plan. The current integration uses the hosted Billplz bill page rather than collecting card details in Ink Spirit.

Official references:
- https://support.billplz.com/guide/overview
- https://support.billplz.com/api

## Environment variables

Copy `server/.env.example` into your deployment environment. Do not commit the real values.

- `BILLPLZ_MODE=sandbox`
- `BILLPLZ_API_KEY`
- `BILLPLZ_COLLECTION_ID`
- `PUBLIC_BASE_URL=https://your-public-domain`

The API key and Collection ID must come from the same Billplz environment. Sandbox and production credentials are separate.

## Flow

1. Customer signs in and adds products to the server-side cart.
2. Server calculates the order total from the product catalogue, creates a `pending_payment` order snapshot, and sends the amount in sen to Billplz.
3. Customer is redirected to the hosted Billplz page.
4. Billplz posts to `/api/payments/billplz/callback`.
5. The backend retrieves the bill directly from Billplz and verifies its paid state and exact amount.
6. Only verified payment updates the order to `paid`, decrements stock and clears the cart.
7. The customer returns to `payment-result.html`; the page reads status from the backend.

## Important limitations

- No merchant account or credentials are stored in the repository.
- The callback requires a publicly reachable HTTPS deployment.
- This first implementation does not yet include automated refunds, cancellation expiry, stock reservation/rollback, full reconciliation reports or a relational transaction.
- Do not enable live mode until sandbox tests and merchant activation are complete.
