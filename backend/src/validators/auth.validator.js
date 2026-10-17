// TODO: Implement this module.

function validateLogin(req, res, next) {
    const { username, password } = req.body || {};

    const errors = [];

    if (typeof username !== 'string' || !username.trim()) {
        errors.push('Username is required.');
    }

    if (typeof password !== 'string' || !password) {
        errors.push('Password is required.');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed.',
            errors
        });
    }

    next();
}

module.exports = {
    validateLogin
};