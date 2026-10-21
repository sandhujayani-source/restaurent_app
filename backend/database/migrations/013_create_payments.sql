CREATE TABLE IF NOT EXISTS payments (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	bill_id INT UNSIGNED NOT NULL,
	payment_method VARCHAR(30) NOT NULL,
	amount DECIMAL(10, 2) NOT NULL,
	transaction_reference VARCHAR(100) NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'completed',
	paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_payments_bill_id (bill_id),
	CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills (id)
) ENGINE=InnoDB;

