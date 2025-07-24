// Import all middleware modules
const auth = require('./auth');
const rateLimiter = require('./rateLimiter');
const logger = require('./logger');
const validation = require('./validation');
const errorHandler = require('./errorHandler');
const cache = require('./cache');

// Export individual functions (avoid any spreading issues)
module.exports = {
    // Authentication
    authenticateToken: auth.authenticateToken,
    optionalAuth: auth.optionalAuth,
    requirePermission: auth.requirePermission,
    
    // Rate limiting
    createRateLimit: rateLimiter.createRateLimit,
    authRateLimit: rateLimiter.authRateLimit,
    apiRateLimit: rateLimiter.apiRateLimit,
    weatherRateLimit: rateLimiter.weatherRateLimit,
    routeRateLimit: rateLimiter.routeRateLimit,
    startRateLimiter: rateLimiter.startRateLimiter,
    cleanupRateLimiter: rateLimiter.cleanup,
    
    // Logging
    logger: logger.logger,
    requestLogger: logger.requestLogger,
    apiUsageLogger: logger.apiUsageLogger,
    errorLogger: logger.errorLogger,
    
    // Validation & sanitization
    Validator: validation.Validator,
    sanitizeInputs: validation.sanitizeInputs,
    validateAuth: validation.validateAuth,
    validateCoordinates: validation.validateCoordinates,
    validateRoute: validation.validateRoute,
    validateFavorite: validation.validateFavorite,
    validatePagination: validation.validatePagination,
    xssProtection: validation.xssProtection,
    
    // Error handling
    AppError: errorHandler.AppError,
    ValidationError: errorHandler.ValidationError,
    AuthenticationError: errorHandler.AuthenticationError,
    AuthorizationError: errorHandler.AuthorizationError,
    NotFoundError: errorHandler.NotFoundError,
    RateLimitError: errorHandler.RateLimitError,
    globalErrorHandler: errorHandler.globalErrorHandler,
    notFoundHandler: errorHandler.notFoundHandler,
    asyncHandler: errorHandler.asyncHandler,
    healthCheck: errorHandler.healthCheck,
    gracefulShutdown: errorHandler.gracefulShutdown,
    
    // Caching
    cache: cache.cache,
    createCache: cache.createCache,
    weatherCache: cache.weatherCache,
    locationCache: cache.locationCache,
    routeCache: cache.routeCache,
    userDataCache: cache.userDataCache,
    invalidateCache: cache.invalidateCache,
    warmCache: cache.warmCache,
    getCacheStats: cache.getCacheStats,
    clearCache: cache.clearCache,
    startCache: cache.startCache,
    stopCache: cache.stopCache,
    
    // Convenience middleware stacks for common scenarios
    publicEndpoints: [
        logger.requestLogger,
        validation.xssProtection,
        validation.sanitizeInputs,
        rateLimiter.apiRateLimit
    ],
    
    authEndpoints: [
        logger.requestLogger,
        validation.xssProtection,
        validation.sanitizeInputs,
        rateLimiter.authRateLimit,
        validation.validateAuth
    ],
    
    protectedEndpoints: [
        logger.requestLogger,
        validation.xssProtection,
        validation.sanitizeInputs,
        auth.authenticateToken,
        rateLimiter.apiRateLimit
    ],
    
    weatherEndpoints: [
        logger.requestLogger,
        validation.xssProtection,
        validation.sanitizeInputs,
        auth.optionalAuth,
        rateLimiter.weatherRateLimit,
        validation.validateCoordinates,
        cache.weatherCache
    ],
    
    routeEndpoints: [
        logger.requestLogger,
        validation.xssProtection,
        validation.sanitizeInputs,
        auth.optionalAuth,
        rateLimiter.routeRateLimit,
        cache.routeCache
    ],
    
    userDataEndpoints: [
        logger.requestLogger,
        validation.xssProtection,
        validation.sanitizeInputs,
        auth.authenticateToken,
        rateLimiter.apiRateLimit,
        cache.userDataCache
    ],

    // Initialization function - call this manually when app starts
    initialize: () => {
        console.log('🔧 Initializing middleware...');
        
        // Start background processes only when explicitly called
        rateLimiter.startRateLimiter();
        cache.startCache();
        
        // Warm cache after a delay
        setTimeout(() => {
            cache.warmCache().catch(err => 
                logger.logger.warn('Cache warming failed', { error: err.message })
            );
        }, 5000);
        
        console.log('✅ Middleware initialized');
    },

    // Cleanup function - call this on app shutdown
    cleanup: () => {
        console.log('🧹 Cleaning up middleware...');
        rateLimiter.cleanup();
        cache.stopCache();
        console.log('✅ Middleware cleanup complete');
    }
};

// Don't start anything automatically - let the app control initialization