// Input sanitization and validation middleware
class Validator {
    static sanitizeString(str, maxLength = 1000) {
        if (typeof str !== 'string') return str;
        
        // Remove potentially dangerous characters
        return str
            .trim()
            .replace(/[<>\"']/g, '') // Remove HTML/script injection chars
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .slice(0, maxLength); // Limit length
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    static isValidCoordinate(lat, lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        return !isNaN(latitude) && 
               !isNaN(longitude) && 
               latitude >= -90 && latitude <= 90 &&
               longitude >= -180 && longitude <= 180;
    }

    static isValidPassword(password) {
        return typeof password === 'string' && 
               password.length >= 8 && 
               password.length <= 128 &&
               /[A-Za-z]/.test(password) && // At least one letter
               /[0-9]/.test(password);      // At least one number
    }

    static sanitizeObject(obj, rules = {}) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const rule = rules[key] || {};
            
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value, rule.maxLength);
            } else if (typeof value === 'number') {
                sanitized[key] = this.validateNumber(value, rule);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value, rule.nested || {});
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    static validateNumber(num, rule = {}) {
        const { min = -Infinity, max = Infinity } = rule;
        const parsed = parseFloat(num);
        
        if (isNaN(parsed)) return null;
        
        return Math.max(min, Math.min(max, parsed));
    }
}

// Generic input sanitization middleware
const sanitizeInputs = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = Validator.sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
                req.query[key] = Validator.sanitizeString(value, 500);
            }
        }
    }
    
    // Sanitize params
    if (req.params) {
        for (const [key, value] of Object.entries(req.params)) {
            if (typeof value === 'string') {
                req.params[key] = Validator.sanitizeString(value, 100);
            }
        }
    }
    
    next();
};

// Specific validation middleware factories
const validateAuth = (req, res, next) => {
    const { email, password, full_name, confirm_password } = req.body;
    
    const errors = [];
    
    if (email && !Validator.isValidEmail(email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }
    
    if (password && !Validator.isValidPassword(password)) {
        errors.push({ 
            field: 'password', 
            message: 'Password must be 8-128 characters with at least one letter and number' 
        });
    }
    
    if (confirm_password && password !== confirm_password) {
        errors.push({ field: 'confirm_password', message: 'Passwords do not match' });
    }
    
    if (full_name && (typeof full_name !== 'string' || full_name.trim().length < 1)) {
        errors.push({ field: 'full_name', message: 'Full name is required' });
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input parameters',
                details: errors
            }
        });
    }
    
    next();
};

const validateCoordinates = (req, res, next) => {
    const lat = req.query.lat || req.body.latitude;
    const lng = req.query.lng || req.body.longitude;
    
    if (lat && lng && !Validator.isValidCoordinate(lat, lng)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_COORDINATES',
                message: 'Invalid latitude or longitude values'
            }
        });
    }
    
    next();
};

const validateRoute = (req, res, next) => {
    const { origin, destination } = req.body;
    
    const errors = [];
    
    if (!origin || !origin.latitude || !origin.longitude) {
        errors.push({ field: 'origin', message: 'Valid origin coordinates required' });
    } else if (!Validator.isValidCoordinate(origin.latitude, origin.longitude)) {
        errors.push({ field: 'origin', message: 'Invalid origin coordinates' });
    }
    
    if (!destination || !destination.latitude || !destination.longitude) {
        errors.push({ field: 'destination', message: 'Valid destination coordinates required' });
    } else if (!Validator.isValidCoordinate(destination.latitude, destination.longitude)) {
        errors.push({ field: 'destination', message: 'Invalid destination coordinates' });
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid route parameters',
                details: errors
            }
        });
    }
    
    next();
};

const validateFavorite = (req, res, next) => {
    const { name, address, latitude, longitude } = req.body;
    
    const errors = [];
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Name is required' });
    }
    
    if (latitude === undefined || longitude === undefined) {
        errors.push({ field: 'coordinates', message: 'Latitude and longitude are required' });
    } else if (!Validator.isValidCoordinate(latitude, longitude)) {
        errors.push({ field: 'coordinates', message: 'Invalid coordinates' });
    }
    
    if (address && typeof address !== 'string') {
        errors.push({ field: 'address', message: 'Address must be a string' });
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid favorite location data',
                details: errors
            }
        });
    }
    
    next();
};

const validatePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Enforce reasonable limits
    req.query.page = Math.max(1, Math.min(1000, page));
    req.query.limit = Math.max(1, Math.min(100, limit));
    
    next();
};

// XSS Protection middleware
const xssProtection = (req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    next();
};

module.exports = {
    Validator,
    sanitizeInputs,
    validateAuth,
    validateCoordinates,
    validateRoute,
    validateFavorite,
    validatePagination,
    xssProtection
};