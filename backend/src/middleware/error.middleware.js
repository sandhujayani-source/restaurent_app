// TODO: Implement this module.

function errorMiddleware(err, req, res, next) {
    const statusCode = err.statusCode || 500;

    // Log unexpected server errors for debugging.
    if (statusCode >= 500) {
        console.error('Server error:', err);
    }

    res.status(statusCode).json({
        success: false,
        message: statusCode >= 500
            ? 'Internal server error.'
            : err.message
    });
}

module.exports = errorMiddleware;