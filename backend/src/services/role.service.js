const RoleRepository = require('../repositories/role.repository');

const RoleService = {
	async list() {
		return RoleRepository.findAllWithPermissions();
	}
};

module.exports = RoleService;
