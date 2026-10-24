const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const RoleRepository = require('../src/repositories/role.repository');
const RoleService = require('../src/services/role.service');

const originalMethods = { ...RoleRepository };

afterEach(() => {
	Object.assign(RoleRepository, originalMethods);
});

test('returns seeded roles with their configured permissions', async () => {
	const roles = [
		{ id: 1, name: 'admin', permissions: ['orders:read', 'orders:write'] }
	];
	RoleRepository.findAllWithPermissions = async () => roles;

	assert.deepEqual(await RoleService.list(), roles);
});
