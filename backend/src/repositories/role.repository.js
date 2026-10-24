const pool = require('../config/database');

const RoleRepository = {
	async findAllWithPermissions() {
		const [rows] = await pool.execute(
			`SELECT r.id AS role_id, r.role_name, r.description,
					p.permission_name
			 FROM roles r
			 LEFT JOIN role_permissions rp ON rp.role_id = r.id
			 LEFT JOIN permissions p ON p.id = rp.permission_id
			 ORDER BY r.id ASC, p.permission_name ASC`
		);

		const roles = new Map();
		for (const row of rows) {
			let role = roles.get(row.role_id);
			if (!role) {
				role = {
					id: row.role_id,
					name: row.role_name,
					description: row.description,
					permissions: []
				};
				roles.set(row.role_id, role);
			}
			if (row.permission_name) role.permissions.push(row.permission_name);
		}

		return [...roles.values()];
	}
};

module.exports = RoleRepository;
