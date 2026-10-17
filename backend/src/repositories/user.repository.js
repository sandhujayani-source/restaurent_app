const pool = require('../config/database');

const UserRepository = {
    // Find a user by username
    async findByUsername(username) {
        const sql = `
            SELECT
                u.id, u.full_name, u.username, u.email,
                u.password_hash, u.role_id, u.is_active,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.username = ?
            LIMIT 1
        `;

        const [rows] = await pool.execute(sql, [username]);
        return rows.length ? rows[0] : null;
    },

    // Find a user by email
    async findByEmail(email) {
        const sql = `
            SELECT
                u.id, u.full_name, u.username, u.email,
                u.password_hash, u.role_id, u.is_active,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?
            LIMIT 1
        `;

        const [rows] = await pool.execute(sql, [email]);
        return rows.length ? rows[0] : null;
    },

    // Retrieve permissions for a role
    async findPermissionsByRoleId(roleId) {
        const sql = `
            SELECT p.permission_name
            FROM role_permissions rp
            INNER JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ?
            ORDER BY p.permission_name
        `;

        const [rows] = await pool.execute(sql, [roleId]);
        return rows.map(row => row.permission_name);
    },

    // Create a staff account
    async createStaff({ fullName, username, email, passwordHash, roleId }) {
        const sql = `
            INSERT INTO users (
                full_name, username, email,
                password_hash, role_id, is_active
            )
            VALUES (?, ?, ?, ?, ?, 1)
        `;

        const [result] = await pool.execute(sql, [
            fullName, username, email, passwordHash, roleId
        ]);

        return result.insertId;
    },

    // List waiter and kitchen staff accounts
    async findAllStaff() {
        const sql = `
            SELECT
                u.id,
                u.full_name,
                u.username,
                u.email,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.role_id IN (2, 3)
            ORDER BY u.id DESC
        `;

        const [rows] = await pool.execute(sql);
        return rows;
    },

    // Find a staff member by ID
    async findStaffById(id) {
        const sql = `
            SELECT
                u.id,
                u.full_name,
                u.username,
                u.email,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
              AND u.role_id IN (2, 3)
            LIMIT 1
        `;

        const [rows] = await pool.execute(sql, [id]);
        return rows.length ? rows[0] : null;
    },

    // Update staff details
    async updateStaff(id, { fullName, email, roleId }) {
        const sql = `
            UPDATE users
            SET full_name = ?,
                email = ?,
                role_id = ?
            WHERE id = ?
              AND role_id IN (2, 3)
        `;

        const [result] = await pool.execute(sql, [
            fullName, email, roleId, id
        ]);

        return result.affectedRows > 0;
    },

    // Deactivate a staff account without deleting its history
    async deactivateStaff(id) {
        const sql = `
            UPDATE users
            SET is_active = 0
            WHERE id = ?
              AND role_id IN (2, 3)
              AND is_active = 1
        `;

        const [result] = await pool.execute(sql, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = UserRepository;