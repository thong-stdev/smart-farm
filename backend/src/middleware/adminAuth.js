const { asyncHandler } = require('./errorHandler');

/**
 * Middleware to check if user has admin role
 * Must be used after authenticate middleware
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
    // Check if user exists (should be set by authenticate middleware)
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
        });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
            code: 'FORBIDDEN'
        });
    }

    next();
});

module.exports = {
    requireAdmin
};
