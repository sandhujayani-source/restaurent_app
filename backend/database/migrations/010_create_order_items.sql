CREATE TABLE IF NOT EXISTS order_items (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	order_id INT UNSIGNED NOT NULL,
	menu_item_id INT UNSIGNED NOT NULL,
	quantity DECIMAL(10, 2) UNSIGNED NOT NULL DEFAULT 1.00,
	unit_price DECIMAL(10, 2) NOT NULL,
	subtotal DECIMAL(10, 2) NOT NULL,
	notes TEXT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_order_items_order_id (order_id),
	KEY idx_order_items_menu_item_id (menu_item_id),
	CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
	CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
) ENGINE=InnoDB;

