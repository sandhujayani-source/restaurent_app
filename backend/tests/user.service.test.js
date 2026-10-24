const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const UserRepository = require('../src/repositories/user.repository');
const UserService = require('../src/services/user.service');

const originalMethods = { ...UserRepository };

afterEach(() => {
    Object.assign(UserRepository, originalMethods);
});

test('creates staff using the actual seeded role ID and name', async () => {
    let savedUser;
    UserRepository.findStaffRoleById = async id => (
        id === 12 ? { id: 12, role_name: 'Kitchen Staff' } : null
    );
    UserRepository.findByUsername = async () => null;
    UserRepository.findByEmail = async () => null;
    UserRepository.createStaff = async input => {
        savedUser = input;
        return 42;
    };

    const result = await UserService.createStaff({
        fullName: 'Kitchen Member',
        username: 'kitchenmember',
        email: null,
        password: 'safe-password',
        roleId: 12
    });

    assert.equal(savedUser.roleId, 12);
    assert.equal(result.role, 'Kitchen Staff');
    assert.equal(result.id, 42);
});

test('rejects staff role IDs that do not refer to a seeded staff role', async () => {
    UserRepository.findStaffRoleById = async () => null;

    await assert.rejects(
        UserService.createStaff({
            fullName: 'Invalid Member',
            username: 'invalidmember',
            password: 'safe-password',
            roleId: 1
        }),
        error => error.statusCode === 400
    );
});
