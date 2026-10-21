CREATE TABLE IF NOT EXISTS bills (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	bill_number VARCHAR(50) NOT NULL,
	order_id INT UNSIGNED NOT NULL,
	subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
	issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uq_bills_bill_number (bill_number),
	KEY idx_bills_order_id (order_id),
	CONSTRAINT fk_bills_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB;

