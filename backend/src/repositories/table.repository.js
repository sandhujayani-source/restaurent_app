const pool = require('../config/database');

const TableRepository = {
	async findAll(status) {
		const conditions = ['is_active = 1'];
		const values = [];

		if (status) {
			conditions.push('status = ?');
			values.push(status);
		}

		const [rows] = await pool.execute(
			`SELECT id, table_number, capacity, status, is_active, created_at, updated_at
			 FROM restaurant_tables
			 WHERE ${conditions.join(' AND ')}
			 ORDER BY table_number ASC`,
			values
		);

		return rows;
	},

	async findById(id) {
		const [rows] = await pool.execute(
			`SELECT id, table_number, capacity, status, is_active, created_at, updated_at
			 FROM restaurant_tables
			 WHERE id = ? AND is_active = 1
			 LIMIT 1`,
			[id]
		);

		return rows[0] || null;
	},

	async create({ tableNumber, capacity, status }) {
		const [result] = await pool.execute(
			`INSERT INTO restaurant_tables (table_number, capacity, status)
			 VALUES (?, ?, ?)`,
			[tableNumber, capacity, status]
		);

		return result.insertId;
	},

	async update(id, changes) {
		const columns = {
			tableNumber: 'table_number',
			capacity: 'capacity',
			status: 'status',
			isActive: 'is_active'
		};
		const updates = Object.entries(changes)
			.filter(([key]) => columns[key])
			.map(([key, value]) => [columns[key], value]);
		const assignments = updates.map(([column]) => `${column} = ?`).join(', ');

		const [result] = await pool.execute(
			`UPDATE restaurant_tables
			 SET ${assignments}
			 WHERE id = ? AND is_active = 1`,
			[...updates.map(([, value]) => value), id]
		);

		return result.affectedRows;
	},

	async deactivate(id) {
		const [result] = await pool.execute(
			`UPDATE restaurant_tables
			 SET is_active = 0
			 WHERE id = ? AND is_active = 1`,
			[id]
		);

		return result.affectedRows > 0;
	}
};

module.exports = TableRepository;

