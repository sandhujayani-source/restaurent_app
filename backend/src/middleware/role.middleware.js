function allowRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Support common JWT role field names.
        const userRole =
            req.user.role ||
            req.user.role_name ||
            req.user.roleName;

        const normalizedUserRole =
            typeof userRole === 'string' ? userRole.toLowerCase() : '';

        if (
            !normalizedUserRole ||
            !allowedRoles.some(role => role.toLowerCase() === normalizedUserRole)
        ) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action.'
            });
        }

        next();
    };
}

module.exports = allowRoles;