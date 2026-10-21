const TableService = require('../services/table.service');

const TableController = {
	async getTables(req, res, next) {
		try {
			const data = await TableService.getTables(req.query.status);

			return res.status(200).json({
				success: true,
				count: data.length,
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async getTable(req, res, next) {
		try {
			const data = await TableService.getTable(req.params.id);

			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async createTable(req, res, next) {
		try {
			const data = await TableService.createTable(req.body);

			return res.status(201).json({
				success: true,
				message: 'Table created successfully.',
				data
			});
		} catch (error) {
			if (error.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({
					success: false,
					message: 'Table number already exists.'
				});
			}

			next(error);
		}
	},

	async updateTable(req, res, next) {
		try {
			const data = await TableService.updateTable(req.params.id, req.body);

			return res.status(200).json({
				success: true,
				message: 'Table updated successfully.',
				data
			});
		} catch (error) {
			if (error.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({
					success: false,
					message: 'Table number already exists.'
				});
			}

			next(error);
		}
	},

	async deactivateTable(req, res, next) {
		try {
			const data = await TableService.deactivateTable(req.params.id);

			return res.status(200).json({
				success: true,
				message: 'Table deactivated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = TableController;

