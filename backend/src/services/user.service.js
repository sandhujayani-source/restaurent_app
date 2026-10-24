const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/user.repository');

const UserService = {
    // 1. Create a new Waiter or Kitchen Staff account
    async createStaff(data) {
        const { fullName, username, email, password, roleId } = data;

        if (
            typeof fullName !== 'string' ||
            !fullName.trim() ||
            typeof username !== 'string' ||
            !username.trim() ||
            typeof password !== 'string' ||
            password.length < 8 ||
            !Number.isInteger(Number(roleId)) ||
            Number(roleId) < 1
        ) {
            const error = new Error(
                'Provide a full name, username, password of at least 8 characters, and a staff role ID.'
            );
            error.statusCode = 400;
            throw error;
        }

        const staffRole = await UserRepository.findStaffRoleById(Number(roleId));
        if (!staffRole) {
            const error = new Error('Role must be Waiter or Kitchen Staff.');
            error.statusCode = 400;
            throw error;
        }

        const cleanUsername = username.trim();
        const cleanEmail =
            typeof email === 'string' && email.trim()
                ? email.trim()
                : null;

        if (await UserRepository.findByUsername(cleanUsername)) {
            const error = new Error('Username already exists.');
            error.statusCode = 409;
            throw error;
        }

        if (cleanEmail && await UserRepository.findByEmail(cleanEmail)) {
            const error = new Error('Email already exists.');
            error.statusCode = 409;
            throw error;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const id = await UserRepository.createStaff({
            fullName: fullName.trim(),
            username: cleanUsername,
            email: cleanEmail,
            passwordHash,
            roleId: Number(staffRole.id)
        });

        return {
            id,
            fullName: fullName.trim(),
            username: cleanUsername,
            email: cleanEmail,
            role: staffRole.role_name
        };
    },

    // 2. Get all Waiter and Kitchen Staff accounts
    async getAllStaff() {
        return await UserRepository.findAllStaff();
    },

    // 3. Get one staff member by ID
    async getStaffById(id) {
        const staffId = Number(id);

        if (!Number.isInteger(staffId) || staffId <= 0) {
            const error = new Error('Invalid staff ID.');
            error.statusCode = 400;
            throw error;
        }

        const staff = await UserRepository.findStaffById(staffId);

        if (!staff) {
            const error = new Error('Staff member not found.');
            error.statusCode = 404;
            throw error;
        }

        return staff;
    },

    // 4. Update staff details
    async updateStaff(id, data) {
        const staffId = Number(id);
        const { fullName, email, roleId } = data;

        if (
            !Number.isInteger(staffId) ||
            staffId <= 0 ||
            typeof fullName !== 'string' ||
            !fullName.trim() ||
            !Number.isInteger(Number(roleId)) ||
            Number(roleId) < 1 ||
            (email != null && typeof email !== 'string')
        ) {
            const error = new Error('Please provide valid staff details.');
            error.statusCode = 400;
            throw error;
        }

        const staffRole = await UserRepository.findStaffRoleById(Number(roleId));
        if (!staffRole) {
            const error = new Error('Role must be Waiter or Kitchen Staff.');
            error.statusCode = 400;
            throw error;
        }

        const cleanEmail =
            typeof email === 'string' && email.trim()
                ? email.trim()
                : null;

        if (cleanEmail) {
            const existingUser = await UserRepository.findByEmail(cleanEmail);

            if (
                existingUser &&
                Number(existingUser.id) !== staffId
            ) {
                const error = new Error('Email already exists.');
                error.statusCode = 409;
                throw error;
            }
        }

        const updated = await UserRepository.updateStaff(staffId, {
            fullName: fullName.trim(),
            email: cleanEmail,
            roleId: Number(staffRole.id)
        });

        if (!updated) {
            const error = new Error(
                'Staff member not found or no changes were made.'
            );
            error.statusCode = 404;
            throw error;
        }

        return await this.getStaffById(staffId);
    },

    // 5. Deactivate a staff account
    async deactivateStaff(id) {
        const staffId = Number(id);

        if (!Number.isInteger(staffId) || staffId <= 0) {
            const error = new Error('Invalid staff ID.');
            error.statusCode = 400;
            throw error;
        }

        const staff = await UserRepository.findStaffById(staffId);

        if (!staff) {
            const error = new Error('Staff member not found.');
            error.statusCode = 404;
            throw error;
        }

        if (!staff.is_active) {
            const error = new Error('Staff account is already deactivated.');
            error.statusCode = 409;
            throw error;
        }

        const deactivated = await UserRepository.deactivateStaff(staffId);

        if (!deactivated) {
            const error = new Error('Unable to deactivate staff account.');
            error.statusCode = 500;
            throw error;
        }

        return {
            id: staffId,
            isActive: false,
            message: 'Staff account deactivated successfully.'
        };
    }
};

module.exports = UserService;