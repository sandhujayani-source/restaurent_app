const RoleService = require('../services/role.service');

const RoleController = {
	async list(req, res, next) {
		try {
			const data = await RoleService.list();
			return res.status(200).json({ success: true, count: data.length, data });
		} catch (error) {
			next(error);
		}
	}
};

module.exports = RoleController;
