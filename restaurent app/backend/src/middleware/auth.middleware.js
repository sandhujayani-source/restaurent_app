const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    try {
        // Read the token from the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please log in first.'
            });
        }

        // Extract the token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing.'
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store the logged-in user's information
        req.user = {
            userId: decoded.userId,
            roleId: decoded.roleId,
            role: decoded.role
        };

        // Continue to the requested route
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }
}

module.exports = authMiddleware;

