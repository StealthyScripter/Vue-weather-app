const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

class Logger {
    constructor() {
        this.logLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeToFile(filename, message) {
        const logPath = path.join(logsDir, filename);
        fs.appendFile(logPath, message, (err) => {
            if (err) console.error('Failed to write to log file:', err);
        });
    }

    log(level, message, meta = {}) {
        if (LOG_LEVELS[level] <= this.logLevel) {
            const formatted = this.formatMessage(level, message, meta);
            
            // Console output (with colors in development)
            if (process.env.NODE_ENV !== 'production') {
                const colors = {
                    ERROR: '\x1b[31m', // Red
                    WARN: '\x1b[33m',  // Yellow
                    INFO: '\x1b[32m',  // Green
                    DEBUG: '\x1b[36m'  // Cyan
                };
                console.log(`${colors[level]}[${level}]\x1b[0m ${message}`, meta);
            }
            
            // File output
            const date = new Date().toISOString().split('T')[0];
            this.writeToFile(`app-${date}.log`, formatted);
            
            // Separate error log
            if (level === 'ERROR') {
                this.writeToFile(`error-${date}.log`, formatted);
            }
        }
    }

    error(message, meta) { this.log('ERROR', message, meta); }
    warn(message, meta) { this.log('WARN', message, meta); }
    info(message, meta) { this.log('INFO', message, meta); }
    debug(message, meta) { this.log('DEBUG', message, meta); }
}

const logger = new Logger();

// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    // Add request ID to req object for use in other middleware/routes
    req.requestId = requestId;
    
    // Log incoming request
    const requestMeta = {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        body: req.method === 'POST' || req.method === 'PUT' ? 
              sanitizeBody(req.body) : undefined
    };
    
    logger.info(`Incoming ${req.method} ${req.url}`, requestMeta);
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        const statusCode = this.statusCode;
        
        const responseMeta = {
            requestId,
            method: req.method,
            url: req.url,
            statusCode,
            duration: `${duration}ms`,
            userId: req.user?.userId,
            responseSize: data ? Buffer.byteLength(data, 'utf8') : 0
        };
        
        // Log response
        if (statusCode >= 400) {
            logger.error(`${req.method} ${req.url} - ${statusCode}`, {
                ...responseMeta,
                error: statusCode >= 500 ? JSON.parse(data) : undefined
            });
        } else {
            logger.info(`${req.method} ${req.url} - ${statusCode}`, responseMeta);
        }
        
        return originalSend.call(this, data);
    };
    
    next();
};

// API usage tracking middleware
const apiUsageLogger = (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
        // Track API usage for billing/monitoring
        const usageMeta = {
            userId: req.user?.userId,
            endpoint: req.route?.path || req.url,
            method: req.method,
            statusCode: this.statusCode,
            timestamp: new Date().toISOString(),
            duration: res.get('X-Response-Time') || 0
        };
        
        // Write to usage log for analytics
        const date = new Date().toISOString().split('T')[0];
        logger.writeToFile(`usage-${date}.log`, 
            JSON.stringify(usageMeta) + '\n'
        );
        
        return originalSend.call(this, data);
    };
    
    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    const errorMeta = {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userId: req.user?.userId,
        stack: err.stack,
        message: err.message,
        code: err.code
    };
    
    logger.error('Unhandled error', errorMeta);
    next(err);
};

// Sanitize request body for logging (remove sensitive data)
function sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'confirm_password', 'access_token', 'refresh_token'];
    
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

module.exports = {
    logger,
    requestLogger,
    apiUsageLogger,
    errorLogger
};