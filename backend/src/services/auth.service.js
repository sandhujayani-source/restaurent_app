// TODO: Implement this module.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/env');

const UserRepository = require('../repositories/user.repository');
const TokenRepository = require('../repositories/token.repository');

const AuthService = {
    async login(username, password) {
        // Validate required fields
        if (
            typeof username !== 'string' ||
            !username.trim() ||
            typeof password !== 'string' ||
            !password
        ) {
            const error = new Error('Username and password are required.');
            error.statusCode = 400;
            throw error;
        }

        // Find user by username
        const user = await UserRepository.findByUsername(username.trim());

        if (!user) {
            const error = new Error('Invalid username or password.');
            error.statusCode = 401;
            throw error;
        }

        // Check account status
        if (!user.is_active) {
            const error = new Error('Your account is inactive.');
            error.statusCode = 403;
            throw error;
        }

        // Verify password against its bcrypt hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            const error = new Error('Invalid username or password.');
            error.statusCode = 401;
            throw error;
        }

        // Ensure the JWT secret is configured
        const jwtSecret = getJwtSecret();

        // Retrieve permissions for the user's role
        const permissions =
            await UserRepository.findPermissionsByRoleId(user.role_id);

        // Generate authentication token
        const token = jwt.sign(
            {
                userId: user.id,
                roleId: user.role_id,
                role: user.role_name
            },
            jwtSecret,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1d'
            }
        );

        // Return safe user information; never return the password hash
        return {
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                username: user.username,
                email: user.email,
                role: user.role_name,
                permissions
            }
        };
    },

    async logout(token, expiresAt) {
        if (
            typeof token !== 'string' ||
            !Number.isInteger(expiresAt) ||
            expiresAt <= Math.floor(Date.now() / 1000)
        ) {
            const error = new Error('A valid expiring authentication token is required.');
            error.statusCode = 401;
            throw error;
        }

        await TokenRepository.revoke(token, new Date(expiresAt * 1000));

        return { message: 'Logged out successfully.' };
    }
};

module.exports = AuthService;