CREATE TABLE IF NOT EXISTS orders (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	order_number VARCHAR(50) NOT NULL,
	table_id INT UNSIGNED NULL,
	customer_id INT UNSIGNED NULL,
	created_by INT UNSIGNED NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'pending',
	total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	notes TEXT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uq_orders_order_number (order_number),
	KEY idx_orders_table_id (table_id),
	KEY idx_orders_customer_id (customer_id),
	KEY idx_orders_created_by (created_by),
	CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id),
	CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
	CONSTRAINT fk_orders_user FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB;

