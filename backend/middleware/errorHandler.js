const { logger } = require('./logger');

// Custom error classes
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'FORBIDDEN');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter = 60) {
        super(message, 429, 'RATE_LIMITED');
        this.retryAfter = retryAfter;
    }
}

// Database error handler
const handleDatabaseError = (error) => {
    logger.error('Database error', { error: error.message, stack: error.stack });
    
    // PostgreSQL specific error codes
    if (error.code === '23505') { // Unique constraint violation
        return new AppError('Resource already exists', 409, 'DUPLICATE_RESOURCE');
    }
    
    if (error.code === '23503') { // Foreign key violation
        return new AppError('Referenced resource not found', 400, 'INVALID_REFERENCE');
    }
    
    if (error.code === '23502') { // Not null violation
        return new AppError('Required field missing', 400, 'MISSING_REQUIRED_FIELD');
    }
    
    // Connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return new AppError('Database connection failed', 503, 'SERVICE_UNAVAILABLE');
    }
    
    // Default database error
    return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

// External API error handler
const handleExternalAPIError = (error, service = 'external') => {
    logger.error(`${service} API error`, { 
        error: error.message, 
        response: error.response?.data,
        status: error.response?.status 
    });
    
    if (error.response) {
        const status = error.response.status;
        
        if (status === 401) {
            return new AppError(`${service} authentication failed`, 502, 'EXTERNAL_AUTH_ERROR');
        }
        
        if (status === 403) {
            return new AppError(`${service} access denied`, 502, 'EXTERNAL_ACCESS_DENIED');
        }
        
        if (status === 429) {
            return new AppError(`${service} rate limit exceeded`, 502, 'EXTERNAL_RATE_LIMITED');
        }
        
        if (status >= 500) {
            return new AppError(`${service} service unavailable`, 503, 'SERVICE_UNAVAILABLE');
        }
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return new AppError(`${service} service unavailable`, 503, 'SERVICE_UNAVAILABLE');
    }
    
    if (error.code === 'ETIMEDOUT') {
        return new AppError(`${service} request timeout`, 504, 'GATEWAY_TIMEOUT');
    }
    
    return new AppError(`${service} service error`, 502, 'BAD_GATEWAY');
};

// JWT error handler
const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
        return new AuthenticationError('Invalid access token');
    }
    
    if (error.name === 'TokenExpiredError') {
        return new AuthenticationError('Access token expired');
    }
    
    return new AuthenticationError('Token verification failed');
};

// Main error handling middleware
const globalErrorHandler = (err, req, res, next) => {
    let error = err;
    
    // Handle different types of errors
    if (err.name === 'ValidationError' && err.details) {
        // Mongoose/Joi validation errors
        error = new ValidationError('Validation failed', err.details);
    } else if (err.code && err.code.startsWith('23')) {
        // PostgreSQL errors
        error = handleDatabaseError(err);
    } else if (err.response && err.config) {
        // Axios errors (external API)
        const service = err.config.url?.includes('openweathermap') ? 'Weather' :
                       err.config.url?.includes('googleapis') ? 'Maps' : 'External';
        error = handleExternalAPIError(err, service);
    } else if (err.name?.includes('JsonWebToken') || err.name === 'TokenExpiredError') {
        // JWT errors
        error = handleJWTError(err);
    } else if (!err.isOperational) {
        // Programming errors - log full stack trace
        logger.error('Programming error', {
            message: err.message,
            stack: err.stack,
            requestId: req.requestId,
            url: req.url,
            method: req.method,
            userId: req.user?.userId
        });
        
        // Don't leak error details in production
        if (process.env.NODE_ENV === 'production') {
            error = new AppError('Internal server error');
        }
    }
    
    // Log operational errors at appropriate level
    if (error.statusCode >= 500) {
        logger.error('Server error', {
            message: error.message,
            code: error.code,
            requestId: req.requestId,
            userId: req.user?.userId
        });
    } else if (error.statusCode >= 400) {
        logger.warn('Client error', {
            message: error.message,
            code: error.code,
            requestId: req.requestId,
            userId: req.user?.userId
        });
    }
    
    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'An unexpected error occurred'
        }
    };
    
    // Add additional fields for specific error types
    if (error instanceof ValidationError && error.details) {
        errorResponse.error.details = error.details;
    }
    
    if (error instanceof RateLimitError && error.retryAfter) {
        errorResponse.error.retry_after = error.retryAfter;
        res.set('Retry-After', error.retryAfter);
    }
    
    // Add request ID for debugging (not in production)
    if (process.env.NODE_ENV !== 'production' && req.requestId) {
        errorResponse.requestId = req.requestId;
    }
    
    res.status(error.statusCode || 500).json(errorResponse);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
    next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Health check endpoint with error handling
const healthCheck = (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json(health);
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
    const shutdown = (signal) => {
        logger.info(`Received ${signal}. Starting graceful shutdown...`);
        
        server.close(() => {
            logger.info('HTTP server closed');
            
            // Close database connections, cleanup resources
            process.exit(0);
        });
        
        // Force close after 30 seconds
        setTimeout(() => {
            logger.error('Forcing shutdown after timeout');
            process.exit(1);
        }, 30000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught exception', { error: err.message, stack: err.stack });
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled rejection', { reason, promise });
        process.exit(1);
    });
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    globalErrorHandler,
    notFoundHandler,
    asyncHandler,
    healthCheck,
    gracefulShutdown
};