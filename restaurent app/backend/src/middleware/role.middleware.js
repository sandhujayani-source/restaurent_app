function allowRoles(...allowedRoles) {
    return function (req, res, next) {
        // Authentication middleware must run first.
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in first.'
            });
        }

        // Check the authenticated user's role.
        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to access this resource.'
            });
        }

        next();
    };
}

module.exports = allowRoles;

