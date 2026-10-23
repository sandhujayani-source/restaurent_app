const crypto = require('node:crypto');
const pool = require('../config/database');

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

const TokenRepository = {
    async revoke(token, expiresAt) {
        await pool.execute(
            'DELETE FROM revoked_tokens WHERE expires_at <= CURRENT_TIMESTAMP'
        );
        await pool.execute(
            `INSERT INTO revoked_tokens (token_hash, expires_at)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
            [hashToken(token), expiresAt]
        );
    },

    async isRevoked(token) {
        const [rows] = await pool.execute(
            `SELECT 1
             FROM revoked_tokens
             WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
             LIMIT 1`,
            [hashToken(token)]
        );

        return rows.length > 0;
    }
};

module.exports = TokenRepository;