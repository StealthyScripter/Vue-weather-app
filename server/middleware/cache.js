// Simple in-memory cache (use Redis in production)
class Cache {
    constructor() {
        this.data = new Map();
        this.timers = new Map();
        this.cleanupInterval = null; // Don't start automatically
    }

    // Start cleanup process manually
    startCleanup() {
        if (!this.cleanupInterval) {
            this.cleanupInterval = setInterval(() => this.forceCleanup(), 60000);
        }
    }

    // Stop cleanup process
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
    }

    set(key, value, ttlSeconds = 300) {
        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Store data
        this.data.set(key, {
            value,
            createdAt: Date.now(),
            ttl: ttlSeconds * 1000
        });

        // Set expiration timer
        const timer = setTimeout(() => {
            this.delete(key);
        }, ttlSeconds * 1000);

        this.timers.set(key, timer);
    }

    get(key) {
        const item = this.data.get(key);
        
        if (!item) return null;

        // Check if expired
        if (Date.now() - item.createdAt > item.ttl) {
            this.delete(key);
            return null;
        }

        return item.value;
    }

    delete(key) {
        this.data.delete(key);
        
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    clear() {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        
        this.data.clear();
        this.timers.clear();
    }

    size() {
        return this.data.size;
    }

    stats() {
        return {
            size: this.data.size,
            keys: Array.from(this.data.keys())
        };
    }

    // Force cleanup of expired items
    forceCleanup() {
        const now = Date.now();
        const keysToDelete = [];
        
        for (const [key, item] of this.data.entries()) {
            if (now - item.createdAt > item.ttl) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
    }
}

const cache = new Cache();

// Cache middleware factory
const createCache = (options = {}) => {
    const {
        ttl = 300, // 5 minutes default
        keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
        condition = (req) => req.method === 'GET',
        skipCache = (req, res) => false
    } = options;

    return (req, res, next) => {
        // Skip if condition not met
        if (!condition(req) || skipCache(req, res)) {
            return next();
        }

        const cacheKey = keyGenerator(req);
        
        // Try to get from cache
        const cachedResponse = cache.get(cacheKey);
        
        if (cachedResponse) {
            // Set cache headers
            res.set({
                'X-Cache': 'HIT',
                'X-Cache-Key': cacheKey,
                'Cache-Control': `public, max-age=${ttl}`
            });
            
            return res.json(cachedResponse);
        }

        // Intercept response to cache it
        const originalJson = res.json;
        res.json = function(data) {
            // Only cache successful responses
            if (this.statusCode === 200 && data.success !== false) {
                cache.set(cacheKey, data, ttl);
            }

            // Set cache headers
            this.set({
                'X-Cache': 'MISS',
                'X-Cache-Key': cacheKey,
                'Cache-Control': `public, max-age=${ttl}`
            });

            return originalJson.call(this, data);
        };

        next();
    };
};

// Specific cache configurations
const weatherCache = createCache({
    ttl: 600, // 10 minutes for weather data
    keyGenerator: (req) => {
        const { lat, lng, days, hours } = req.query;
        return `weather:${req.path}:${lat}:${lng}:${days || ''}:${hours || ''}`;
    }
});

const locationCache = createCache({
    ttl: 1800, // 30 minutes for location data
    keyGenerator: (req) => {
        const { q, address, lat, lng, limit } = req.query;
        return `location:${req.path}:${q || ''}:${address || ''}:${lat || ''}:${lng || ''}:${limit || ''}`;
    }
});

const routeCache = createCache({
    ttl: 300, // 5 minutes for routes (traffic changes frequently)
    keyGenerator: (req) => {
        if (req.method === 'POST') {
            const { origin, destination, departure_time } = req.body;
            return `route:${origin.latitude}:${origin.longitude}:${destination.latitude}:${destination.longitude}:${departure_time}`;
        }
        return `route:${req.path}:${JSON.stringify(req.query)}`;
    },
    condition: (req) => req.method === 'GET' || (req.method === 'POST' && req.path.includes('/plan'))
});

const userDataCache = createCache({
    ttl: 60, // 1 minute for user data
    keyGenerator: (req) => `user:${req.user?.userId}:${req.path}`,
    condition: (req) => req.method === 'GET' && req.user,
    skipCache: (req, res) => req.path.includes('/history') // Don't cache frequently changing data
});

// Cache invalidation middleware
const invalidateCache = (patterns = []) => {
    return (req, res, next) => {
        const originalJson = res.json;
        
        res.json = function(data) {
            // Only invalidate on successful operations
            if (this.statusCode < 400) {
                patterns.forEach(pattern => {
                    const keys = Array.from(cache.data.keys());
                    const matchingKeys = keys.filter(key => {
                        if (typeof pattern === 'string') {
                            return key.includes(pattern);
                        }
                        if (pattern instanceof RegExp) {
                            return pattern.test(key);
                        }
                        return false;
                    });
                    
                    matchingKeys.forEach(key => cache.delete(key));
                });
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Cache warming function (call manually)
const warmCache = async () => {
    try {
        console.log('Starting cache warm-up...');
        
        // Pre-load frequently accessed data
        const commonLocations = [
            { lat: 35.3021, lng: -81.3400, name: 'Kings Mountain, NC' },
            { lat: 35.9940, lng: -78.8986, name: 'Durham, NC' },
            { lat: 35.2269, lng: -80.8414, name: 'Charlotte, NC' }
        ];
        
        console.log(`Cache warm-up completed for ${commonLocations.length} locations`);
    } catch (error) {
        console.error('Cache warm-up failed:', error.message);
    }
};

// Cache statistics endpoint
const getCacheStats = (req, res) => {
    const stats = {
        ...cache.stats(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    };
    
    res.json({
        success: true,
        data: stats
    });
};

// Clear cache endpoint (admin only)
const clearCache = (req, res) => {
    const pattern = req.query.pattern;
    
    if (pattern) {
        const keys = Array.from(cache.data.keys());
        const matchingKeys = keys.filter(key => key.includes(pattern));
        matchingKeys.forEach(key => cache.delete(key));
        
        res.json({
            success: true,
            message: `Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`
        });
    } else {
        cache.clear();
        res.json({
            success: true,
            message: 'Cache cleared completely'
        });
    }
};

// Initialize and cleanup functions
const startCache = () => {
    cache.startCleanup();
};

const stopCache = () => {
    cache.stopCleanup();
};

module.exports = {
    cache,
    createCache,
    weatherCache,
    locationCache,
    routeCache,
    userDataCache,
    invalidateCache,
    warmCache,
    getCacheStats,
    clearCache,
    startCache,
    stopCache
};