ALTER TABLE orders
    ADD COLUMN idempotency_key VARCHAR(100) NULL,
    ADD COLUMN request_hash CHAR(64) NULL,
    ADD UNIQUE KEY uq_orders_idempotency_key (idempotency_key);