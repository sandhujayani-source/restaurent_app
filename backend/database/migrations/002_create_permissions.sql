CREATE TABLE IF NOT EXISTS permissions (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	permission_name VARCHAR(100) NOT NULL,
	description VARCHAR(255) NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uq_permissions_permission_name (permission_name)
) ENGINE=InnoDB;

