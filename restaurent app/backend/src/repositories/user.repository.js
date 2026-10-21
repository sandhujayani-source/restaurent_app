// TODO: Implement this module.

const pool = require('../config/database');

const UserRepository = {
    // Find a user by username
    async findByUsername(username) {
        const sql = `
            SELECT
                u.id,
                u.full_name,
                u.username,
                u.email,
                u.password_hash,
                u.role_id,
                u.is_active,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.username = ?
            LIMIT 1
        `;

        const [rows] = await pool.execute(sql, [username]);

        return rows.length > 0 ? rows[0] : null;
    },

    // Find a user by email
    async findByEmail(email) {
        const sql = `
            SELECT
                u.id,
                u.full_name,
                u.username,
                u.email,
                u.password_hash,
                u.role_id,
                u.is_active,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?
            LIMIT 1
        `;

        const [rows] = await pool.execute(sql, [email]);

        return rows.length > 0 ? rows[0] : null;
    },

    // Retrieve permissions assigned to a user's role
    async findPermissionsByRoleId(roleId) {
        const sql = `
            SELECT p.permission_name
            FROM role_permissions rp
            INNER JOIN permissions p
                ON rp.permission_id = p.id
            WHERE rp.role_id = ?
            ORDER BY p.permission_name
        `;

        const [rows] = await pool.execute(sql, [roleId]);

        return rows.map(row => row.permission_name);
    }
};

module.exports = UserRepository;