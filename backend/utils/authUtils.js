const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12; // Higher = more secure but slower

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

class AuthUtils {
    // Hash a password
    static async hashPassword(plainPassword) {
        return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    }

    // Verify password against hash
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async addToTokenBlacklist(token) {
        try {
            // Add token to blacklist
            tokenBlacklist.add(token);
            
            // Optionally decode to get expiration and clean up later
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                const expiresAt = new Date(decoded.exp * 1000);
                
                // Set timeout to remove token from blacklist after expiration
                const timeUntilExpiry = expiresAt.getTime() - Date.now();
                if (timeUntilExpiry > 0) {
                    setTimeout(() => {
                        tokenBlacklist.delete(token);
                    }, timeUntilExpiry);
                }
            }
            
            console.log(`Token added to blacklist: ${token.substring(0, 20)}...`);
        } catch (error) {
            console.error('Error adding token to blacklist:', error);
            throw error;
        }
    }

    static isTokenBlacklisted(token) {
        return tokenBlacklist.has(token);
    }

    static clearBlacklist() {
        tokenBlacklist.clear();
    }

    // Helper function to send password reset email
    static async sendPasswordResetEmail(email, token) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            
            // In production, use nodemailer, SendGrid, etc.
            console.log('📧 Password Reset Email');
            console.log(`To: ${email}`);
            console.log(`Reset URL: ${resetUrl}`);
            console.log('Subject: Reset your WeatherRoute AI password');
            console.log('\nEmail body would contain:');
            console.log(`Click the following link to reset your password: ${resetUrl}`);
            console.log('This link will expire in 1 hour.');
            
            // Simulate email sending delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return {
                success: true,
                message: 'Password reset email sent successfully',
                resetUrl // Don't include this in production!
            };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    // Generate a secure random token
    static generateSecureToken(length = 32) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    }

    // Validate password strength
    static validatePasswordStrength(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (password.length > 128) {
            errors.push('Password must be less than 128 characters');
        }
        
        if (!/[A-Za-z]/.test(password)) {
            errors.push('Password must contain at least one letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Generate JWT token
    static generateAccessToken(userId, expiresIn = '1h') {
        return jwt.sign(
            { userId }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );
    }

    // Generate refresh token
    static generateRefreshToken(userId, expiresIn = '7d') {
        return jwt.sign(
            { userId, type: 'refresh' }, 
            process.env.REFRESH_SECRET, 
            { expiresIn }
        );
    }
}

module.exports = AuthUtils;