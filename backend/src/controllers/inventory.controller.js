const InventoryService = require('../services/inventory.service');

const InventoryController = {
	async list(req, res, next) {
		try {
			const data = await InventoryService.list(req.query);
			return res.status(200).json({ success: true, count: data.length, data });
		} catch (error) {
			next(error);
		}
	},

	async create(req, res, next) {
		try {
			const data = await InventoryService.create(req.body);
			return res.status(201).json({
				success: true,
				message: 'Inventory item created successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const data = await InventoryService.getById(req.params.id);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async update(req, res, next) {
		try {
			const data = await InventoryService.update(req.params.id, req.body);
			return res.status(200).json({
				success: true,
				message: 'Inventory item updated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async updateQuantity(req, res, next) {
		try {
			const data = await InventoryService.updateQuantity(
				req.params.id,
				req.body
			);
			return res.status(200).json({
				success: true,
				message: 'Inventory quantity updated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = InventoryController;
