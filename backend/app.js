require('dotenv').config();
const express = require('express');

console.log('🚀 Starting WeatherRoute AI...');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for proper IP detection
app.set('trust proxy', 1);

// Try to load optional dependencies
let cors, helmet;
try {
    cors = require('cors');
    console.log('✅ CORS loaded');
} catch (err) {
    console.log('⚠️  CORS not available - install with: npm install cors');
}

try {
    helmet = require('helmet');
    console.log('✅ Helmet loaded');
} catch (err) {
    console.log('⚠️  Helmet not available - install with: npm install helmet');
}

// Try to load middleware
let middleware;
try {
    middleware = require('./middleware');
    console.log('✅ Custom middleware loaded');
} catch (err) {
    console.error('❌ Failed to load middleware:', err.message);
    console.log('Using basic middleware fallback');
    
    // Fallback middleware
    middleware = {
        requestLogger: (req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        },
        xssProtection: (req, res, next) => {
            res.set({
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            });
            next();
        },
        healthCheck: (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                middleware: 'fallback'
            });
        },
        globalErrorHandler: (err, req, res, next) => {
            console.error('Error:', err.message);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        },
        notFoundHandler: (req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Route ${req.method} ${req.originalUrl} not found`
                }
            });
        },
        initialize: () => console.log('Using fallback middleware'),
        cleanup: () => console.log('Cleanup complete'),
        // Empty middleware arrays for fallback
        publicEndpoints: [],
        authEndpoints: [],
        protectedEndpoints: [],
        weatherEndpoints: [],
        routeEndpoints: [],
        userDataEndpoints: []
    };
}

// Security middleware (if available)
if (helmet) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.openweathermap.org", "https://maps.googleapis.com"]
            }
        }
    }));
}

// CORS configuration (if available)
if (cors) {
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global middleware applied to all routes
app.use(middleware.xssProtection);
app.use(middleware.requestLogger);

// Health check endpoints
app.get('/health', middleware.healthCheck);
app.get('/api/health', middleware.healthCheck);

// Cache management endpoints (development only)
if (process.env.NODE_ENV !== 'production' && middleware.getCacheStats) {
    app.get('/api/cache/stats', middleware.getCacheStats);
    app.delete('/api/cache', middleware.clearCache);
}

// Load route modules
console.log('📂 Loading route modules...');
let authRoutes, userRoutes, locationRoutes, navigationRoutes, routeWeatherRoutes, weatherRoutes;

try {
    authRoutes = require('./routes/auth');
    userRoutes = require('./routes/users');
    locationRoutes = require('./routes/location');
    navigationRoutes = require('./routes/navigation');
    routeWeatherRoutes = require('./routes/route-weather');
    weatherRoutes = require('./routes/weather');
    console.log('✅ All route modules loaded successfully');
} catch (err) {
    console.error('❌ Error loading routes:', err.message);
    console.error(err.stack);
    process.exit(1);
}

// Apply middleware stacks to route groups
app.use('/api/auth', ...middleware.authEndpoints, authRoutes);
app.use('/api/weather', ...middleware.weatherEndpoints, weatherRoutes);
app.use('/api/location', [
    ...middleware.publicEndpoints,
    ...(middleware.validateCoordinates ? [middleware.validateCoordinates] : []),
    ...(middleware.locationCache ? [middleware.locationCache] : [])
], locationRoutes);
app.use('/api/routes', ...middleware.routeEndpoints, navigationRoutes);
app.use('/api/route-weather', [
    ...middleware.protectedEndpoints,
    ...(middleware.validateRoute ? [middleware.validateRoute] : [])
], routeWeatherRoutes);
app.use('/api/user', [
    ...middleware.userDataEndpoints,
    ...(middleware.validatePagination ? [middleware.validatePagination] : [])
], userRoutes);

// API usage tracking for all routes
if (middleware.apiUsageLogger) {
    app.use('/api', middleware.apiUsageLogger);
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'WeatherRoute AI API is running',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        middleware: middleware.publicEndpoints.length > 0 ? 'full' : 'basic',
        documentation: process.env.NODE_ENV === 'production' 
            ? '/api/docs' 
            : 'Available at /api/docs'
    });
});

// API documentation endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/docs', (req, res) => {
        res.json({
            success: true,
            title: 'WeatherRoute AI - API Documentation',
            baseUrl: `${req.protocol}://${req.get('host')}`,
            endpoints: {
                auth: {
                    'POST /api/auth/login': 'User login',
                    'POST /api/auth/signup': 'User registration',
                    'POST /api/auth/logout': 'User logout',
                    'POST /api/auth/refresh': 'Refresh access token'
                },
                weather: {
                    'GET /api/weather/current': 'Current weather (lat, lng)',
                    'GET /api/weather/forecast': 'Multi-day forecast (lat, lng, days)',
                    'GET /api/weather/hourly': 'Hourly forecast (lat, lng, hours)',
                    'GET /api/weather/alerts': 'Weather alerts (lat, lng)',
                    'GET /api/weather/air-quality': 'Air quality (lat, lng)'
                },
                location: {
                    'GET /api/location/current': 'Get current location',
                    'GET /api/location/search': 'Search locations (q, limit)',
                    'GET /api/location/geocode': 'Address to coordinates (address)',
                    'GET /api/location/reverse': 'Coordinates to address (lat, lng)'
                },
                routes: {
                    'POST /api/routes/plan': 'Plan route (origin, destination)',
                    'GET /api/routes/directions': 'Get directions (route_id)',
                    'POST /api/routes/optimize': 'Optimize route for weather',
                    'GET /api/routes/traffic': 'Get traffic conditions'
                }
            },
            examples: {
                health: `curl ${req.protocol}://${req.get('host')}/health`,
                weather: `curl "${req.protocol}://${req.get('host')}/api/weather/current?lat=35.3021&lng=-81.3400"`,
                location: `curl "${req.protocol}://${req.get('host')}/api/location/search?q=durham+nc"`
            },
            middleware: {
                status: middleware.publicEndpoints.length > 0 ? 'Full middleware active' : 'Basic middleware only',
                features: middleware.publicEndpoints.length > 0 ? [
                    'Authentication', 'Rate limiting', 'Caching', 'Input validation', 'Request logging'
                ] : ['Basic logging', 'XSS protection']
            }
        });
    });
}

// Handle 404 for undefined routes
app.use('*', middleware.notFoundHandler);

// Error logging middleware (if available)
if (middleware.errorLogger) {
    app.use(middleware.errorLogger);
}

// Global error handling middleware (must be last)
app.use(middleware.globalErrorHandler);

// Initialize middleware (start background processes)
if (middleware.initialize) {
    middleware.initialize();
}

// Start server
console.log('🚀 Starting server...');
const server = app.listen(PORT, () => {
    console.log('');
    console.log('🎉 SUCCESS! WeatherRoute AI is running!');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`💾 Health: http://localhost:${PORT}/health`);
    console.log(`📖 Docs:   http://localhost:${PORT}/api/docs`);
    console.log('');
    
    // Show middleware status
    const middlewareStatus = middleware.publicEndpoints.length > 0 
        ? 'Full middleware loaded ✅' 
        : 'Basic middleware only ⚠️';
    console.log(`🔧 Middleware: ${middlewareStatus}`);
    
    if (middleware.publicEndpoints.length === 0) {
        console.log('');
        console.log('💡 To enable full middleware features:');
        console.log('   1. Ensure all middleware files are created');
        console.log('   2. Check middleware/index.js exports');
        console.log('   3. Install: npm install helmet cors');
    }
    
    console.log('');
    console.log('🧪 Quick test: curl http://localhost:' + PORT + '/health');
    console.log('');
});

server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    process.exit(1);
});

// Setup graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    
    // Cleanup middleware
    if (middleware.cleanup) {
        middleware.cleanup();
    }
    
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
        console.log('❌ Forcing shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection:', reason);
    process.exit(1);
});

module.exports = app;