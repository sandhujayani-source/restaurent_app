CREATE TABLE IF NOT EXISTS revoked_tokens (
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (token_hash),
    KEY idx_revoked_tokens_expires_at (expires_at)
) ENGINE=InnoDB;