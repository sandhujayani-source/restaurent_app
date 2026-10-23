const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/env');
const TokenRepository = require('../repositories/token.repository');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token is required.'
        });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    let jwtSecret;

    try {
        jwtSecret = getJwtSecret();
    } catch (error) {
        return next(error);
    }

    try {
        decoded = jwt.verify(token, jwtSecret);

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }

    try {
        if (await TokenRepository.isRevoked(token)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token.'
            });
        }

        req.user = decoded;
        req.authToken = token;
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = authenticateToken;