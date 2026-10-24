const SupplierService = require('../services/supplier.service');

const SupplierController = {
	async list(req, res, next) {
		try {
			const data = await SupplierService.list(req.query);
			return res.status(200).json({ success: true, count: data.length, data });
		} catch (error) {
			next(error);
		}
	},

	async create(req, res, next) {
		try {
			const data = await SupplierService.create(req.body);
			return res.status(201).json({
				success: true,
				message: 'Supplier created successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const data = await SupplierService.getById(req.params.id);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async update(req, res, next) {
		try {
			const data = await SupplierService.update(req.params.id, req.body);
			return res.status(200).json({
				success: true,
				message: 'Supplier updated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async deactivate(req, res, next) {
		try {
			const data = await SupplierService.deactivate(req.params.id);
			return res.status(200).json({
				success: true,
				message: 'Supplier deactivated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = SupplierController;
