# Restaurant Management App - Backend

Node.js, Express.js and MySQL backend.

## Development workbench data

On startup outside production, the backend creates demo settings, menu items,
three sample orders, and their kitchen tickets once. Demo orders and kitchen
tickets are marked `DEMO DATA`; the default demo settings are 0% tax, cash/card,
and USD. Existing setting values are preserved. To avoid inserting demo records
in production, set `NODE_ENV=production`.
