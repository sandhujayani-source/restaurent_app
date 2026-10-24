const pool = require('../config/database');

const INVENTORY_SELECT = `SELECT i.id, i.supplier_id, s.name AS supplier_name,
		i.item_name, i.unit, i.quantity, i.reorder_level,
		(i.quantity <= i.reorder_level) AS is_low_stock,
		i.created_at, i.updated_at
	FROM inventory i
	LEFT JOIN suppliers s ON s.id = i.supplier_id`;

const InventoryRepository = {
	async findAll({ search, lowStockOnly = false } = {}) {
		const conditions = [];
		const values = [];
		if (search) {
			conditions.push('(i.item_name LIKE ? OR i.unit LIKE ? OR s.name LIKE ?)');
			const query = `%${search}%`;
			values.push(query, query, query);
		}
		if (lowStockOnly) conditions.push('i.quantity <= i.reorder_level');
		const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

		const [rows] = await pool.execute(
			`${INVENTORY_SELECT}
			 ${where}
			 ORDER BY is_low_stock DESC, i.item_name ASC, i.id ASC
			 LIMIT 200`,
			values
		);
		return rows;
	},

	async findById(id) {
		const [rows] = await pool.execute(
			`${INVENTORY_SELECT}
			 WHERE i.id = ?
			 LIMIT 1`,
			[id]
		);
		return rows[0] || null;
	},

	async create({ itemName, unit, quantity, reorderLevel, supplierId }) {
		const [result] = await pool.execute(
			`INSERT INTO inventory (
				item_name, unit, quantity, reorder_level, supplier_id
			 ) VALUES (?, ?, ?, ?, ?)`,
			[itemName, unit, quantity, reorderLevel, supplierId]
		);
		return result.insertId;
	},

	async update(id, { itemName, unit, quantity, reorderLevel, supplierId }) {
		const [result] = await pool.execute(
			`UPDATE inventory
			 SET item_name = ?, unit = ?, quantity = ?, reorder_level = ?, supplier_id = ?
			 WHERE id = ?`,
			[itemName, unit, quantity, reorderLevel, supplierId, id]
		);
		if (result.affectedRows > 0) return true;
		return Boolean(await this.findById(id));
	},

	async updateQuantity(id, quantity) {
		const [result] = await pool.execute(
			'UPDATE inventory SET quantity = ? WHERE id = ?',
			[quantity, id]
		);
		if (result.affectedRows > 0) return true;
		return Boolean(await this.findById(id));
	}
};

module.exports = InventoryRepository;
