const pool = require('../config/database');

const SupplierRepository = {
	async findAll({ search, includeInactive = false } = {}) {
		const conditions = [];
		const values = [];

		if (!includeInactive) conditions.push('is_active = 1');
		if (search) {
			conditions.push('(name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR email LIKE ?)');
			const query = `%${search}%`;
			values.push(query, query, query, query);
		}

		const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
		const [rows] = await pool.execute(
			`SELECT id, name, contact_person, phone, email, address,
					is_active, created_at, updated_at
			 FROM suppliers
			 ${where}
			 ORDER BY name ASC, id ASC
			 LIMIT 200`,
			values
		);
		return rows;
	},

	async findById(id) {
		const [rows] = await pool.execute(
			`SELECT id, name, contact_person, phone, email, address,
					is_active, created_at, updated_at
			 FROM suppliers
			 WHERE id = ?
			 LIMIT 1`,
			[id]
		);
		return rows[0] || null;
	},

	async create({ name, contactPerson, phone, email, address }) {
		const [result] = await pool.execute(
			`INSERT INTO suppliers (name, contact_person, phone, email, address)
			 VALUES (?, ?, ?, ?, ?)`,
			[name, contactPerson, phone, email, address]
		);
		return result.insertId;
	},

	async update(id, { name, contactPerson, phone, email, address }) {
		const [result] = await pool.execute(
			`UPDATE suppliers
			 SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?
			 WHERE id = ? AND is_active = 1`,
			[name, contactPerson, phone, email, address, id]
		);
		if (result.affectedRows > 0) return true;
		const existing = await this.findById(id);
		return Boolean(existing && existing.is_active);
	},

	async deactivate(id) {
		const [result] = await pool.execute(
			`UPDATE suppliers
			 SET is_active = 0
			 WHERE id = ? AND is_active = 1`,
			[id]
		);
		return result.affectedRows > 0;
	}
};

module.exports = SupplierRepository;
