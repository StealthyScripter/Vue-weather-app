const jwt = require('jsonwebtoken');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Access token is required'
            }
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Invalid or expired access token'
                }
            });
        }
        
        req.user = user;
        next();
    });
};

// Optional auth - doesn't fail if no token provided
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

// Check if user has specific permissions
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
        }

        // In a more complex system, you'd check user roles/permissions
        // For now, we'll assume all authenticated users have basic permissions
        if (permission === 'basic' || req.user.role === 'admin') {
            return next();
        }

        return res.status(403).json({
            success: false,
            error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions to access this resource'
            }
        });
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requirePermission
};