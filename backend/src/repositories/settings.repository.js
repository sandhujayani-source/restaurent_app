const pool = require('../config/database');

const SettingsRepository = {
	async findAll() {
		const [rows] = await pool.execute(
			`SELECT setting_key, setting_value, updated_at
			 FROM settings
			 ORDER BY setting_key`
		);
		return rows;
	},

	async findByKey(key) {
		const [rows] = await pool.execute(
			`SELECT setting_key, setting_value, updated_at
			 FROM settings
			 WHERE setting_key = ?
			 LIMIT 1`,
			[key]
		);
		return rows[0] || null;
	},

	async upsert(key, value) {
		await pool.execute(
			`INSERT INTO settings (setting_key, setting_value)
			 VALUES (?, ?)
			 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
			[key, value]
		);
		return this.findByKey(key);
	}
};

module.exports = SettingsRepository;

