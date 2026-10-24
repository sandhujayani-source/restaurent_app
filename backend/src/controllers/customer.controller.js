const CustomerService = require('../services/customer.service');

const CustomerController = {
	async list(req, res, next) {
		try {
			const data = await CustomerService.list(req.query);
			return res.status(200).json({ success: true, count: data.length, data });
		} catch (error) {
			next(error);
		}
	},

	async create(req, res, next) {
		try {
			const data = await CustomerService.create(req.body);
			return res.status(201).json({
				success: true,
				message: 'Customer created successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const data = await CustomerService.getById(req.params.id);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async update(req, res, next) {
		try {
			const data = await CustomerService.update(req.params.id, req.body);
			return res.status(200).json({
				success: true,
				message: 'Customer updated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = CustomerController;
