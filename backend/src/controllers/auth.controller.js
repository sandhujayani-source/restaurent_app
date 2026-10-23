// TODO: Implement this module.
const AuthService = require('../services/auth.service');

const AuthController = {
    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            const result = await AuthService.login(username, password);

            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async logout(req, res, next) {
        try {
            const result = await AuthService.logout(req.authToken, req.user.exp);

            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = AuthController;