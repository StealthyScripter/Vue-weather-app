// Simple in-memory rate limiter (use Redis in production)
class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.cleanupInterval = null; // Don't start immediately
    }

    // Start cleanup process manually
    startCleanup() {
        if (!this.cleanupInterval) {
            this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        }
    }

    // Stop cleanup process
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.requests.entries()) {
            if (now - data.firstRequest > data.windowMs) {
                this.requests.delete(key);
            }
        }
    }

    isAllowed(identifier, maxRequests, windowMs) {
        const now = Date.now();
        const requestData = this.requests.get(identifier);

        if (!requestData) {
            // First request from this identifier
            this.requests.set(identifier, {
                count: 1,
                firstRequest: now,
                windowMs
            });
            return { allowed: true, remaining: maxRequests - 1 };
        }

        // Check if window has expired
        if (now - requestData.firstRequest > windowMs) {
            // Reset window
            this.requests.set(identifier, {
                count: 1,
                firstRequest: now,
                windowMs
            });
            return { allowed: true, remaining: maxRequests - 1 };
        }

        // Within window - check if under limit
        if (requestData.count >= maxRequests) {
            const resetTime = requestData.firstRequest + windowMs;
            const retryAfter = Math.ceil((resetTime - now) / 1000);
            return { 
                allowed: false, 
                remaining: 0, 
                retryAfter,
                resetTime: new Date(resetTime)
            };
        }

        // Increment counter
        requestData.count++;
        return { 
            allowed: true, 
            remaining: maxRequests - requestData.count 
        };
    }
}

const limiter = new RateLimiter();

// General rate limiter
const createRateLimit = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        maxRequests = 100, // requests per window
        keyGenerator = (req) => req.ip, // Default to IP
        skipSuccessfulRequests = false,
        skipFailedRequests = false
    } = options;

    return (req, res, next) => {
        const identifier = keyGenerator(req);
        const result = limiter.isAllowed(identifier, maxRequests, windowMs);

        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': result.remaining,
            'X-RateLimit-Window': Math.ceil(windowMs / 1000)
        });

        if (!result.allowed) {
            res.set('Retry-After', result.retryAfter);
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests. Please try again later.',
                    retry_after: result.retryAfter
                }
            });
        }

        // Track response status for conditional skipping
        const originalSend = res.send;
        res.send = function(data) {
            const statusCode = this.statusCode;
            
            // If configured to skip successful/failed requests, adjust counter
            if ((skipSuccessfulRequests && statusCode < 400) || 
                (skipFailedRequests && statusCode >= 400)) {
                const requestData = limiter.requests.get(identifier);
                if (requestData) {
                    requestData.count = Math.max(0, requestData.count - 1);
                }
            }
            
            return originalSend.call(this, data);
        };

        next();
    };
};

// Specific rate limiters for different endpoints
const authRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per window
    keyGenerator: (req) => `auth_${req.ip}_${req.body?.email || 'unknown'}`,
    skipSuccessfulRequests: true // Don't count successful logins
});

const apiRateLimit = createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000, // 1000 requests per hour
    keyGenerator: (req) => req.user ? `user_${req.user.userId}` : `ip_${req.ip}`
});

const weatherRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute for weather data
    keyGenerator: (req) => req.user ? `weather_${req.user.userId}` : `weather_ip_${req.ip}`
});

const routeRateLimit = createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 route calculations per 5 minutes
    keyGenerator: (req) => req.user ? `route_${req.user.userId}` : `route_ip_${req.ip}`
});

// Initialize and cleanup functions
const startRateLimiter = () => {
    limiter.startCleanup();
};

const cleanup = () => {
    limiter.stopCleanup();
};

module.exports = {
    createRateLimit,
    authRateLimit,
    apiRateLimit,
    weatherRateLimit,
    routeRateLimit,
    startRateLimiter,
    cleanup
};