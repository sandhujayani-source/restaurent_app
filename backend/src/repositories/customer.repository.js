const pool = require('../config/database');

const CustomerRepository = {
	async findAll({ search } = {}) {
		const conditions = [];
		const values = [];

		if (search) {
			conditions.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
			const query = `%${search}%`;
			values.push(query, query, query);
		}

		const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
		const [rows] = await pool.execute(
			`SELECT id, full_name, phone, email, created_at, updated_at
			 FROM customers
			 ${where}
			 ORDER BY full_name ASC, id ASC
			 LIMIT 200`,
			values
		);
		return rows;
	},

	async findById(id) {
		const [rows] = await pool.execute(
			`SELECT id, full_name, phone, email, created_at, updated_at
			 FROM customers
			 WHERE id = ?
			 LIMIT 1`,
			[id]
		);
		return rows[0] || null;
	},

	async create({ fullName, phone, email }) {
		const [result] = await pool.execute(
			`INSERT INTO customers (full_name, phone, email)
			 VALUES (?, ?, ?)`,
			[fullName, phone, email]
		);
		return result.insertId;
	},

	async update(id, { fullName, phone, email }) {
		const [result] = await pool.execute(
			`UPDATE customers
			 SET full_name = ?, phone = ?, email = ?
			 WHERE id = ?`,
			[fullName, phone, email, id]
		);
		if (result.affectedRows > 0) return true;
		return Boolean(await this.findById(id));
	}
};

module.exports = CustomerRepository;
