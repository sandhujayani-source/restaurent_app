CREATE TABLE IF NOT EXISTS kitchen_orders (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	order_id INT UNSIGNED NOT NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'pending',
	notes TEXT NULL,
	started_at TIMESTAMP NULL,
	completed_at TIMESTAMP NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_kitchen_orders_status (status),
	KEY idx_kitchen_orders_order_id (order_id),
	CONSTRAINT fk_kitchen_orders_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB;

