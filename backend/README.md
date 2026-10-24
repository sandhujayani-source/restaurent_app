# Restaurant Management App - Backend

Node.js, Express.js and MySQL backend.

## Local setup

1. Install Node.js and MySQL.
2. Copy `.env.example` to `.env` and set the database connection values.
3. Set `JWT_SECRET` to a random secret of at least 32 characters. Do not use the
   example placeholder.
4. Install dependencies and start the API:

   ```powershell
   npm install
   npm run dev
   ```

   Database migrations and role/permission seeds run during startup. Open
   [http://localhost:5000/api-docs](http://localhost:5000/api-docs) and choose
   the localhost server before trying endpoints.

## Development workbench data

On startup outside production, the backend creates default settings, sample
menu items/tables, and three sample orders with kitchen tickets once. Sample
orders and tickets are marked `DEMO DATA`; existing settings are preserved.
These demo records are intentionally skipped in production.

## Production bootstrap

- Configure `JWT_SECRET`, database credentials, and `ADMIN_PASSWORD` in the
  hosting provider's environment settings before the first deployment. The
  password is used only when no administrator account exists; existing accounts
  are not reset.
- Migrations and idempotent role/permission seeds run at startup in all
  environments. If startup fails during a migration or seed, resolve that
  database error before retrying; migrations are applied in filename order.
- Configure `tax_rate`, `payment_methods`, and `currency` through the settings
  API before using billing. No production demo settings or orders are inserted.

## Verification

Run the backend test suite with:

```powershell
npm test
```
