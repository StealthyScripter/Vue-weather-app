// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// const SALT_ROUNDS = 12; // Higher = more secure but slower

// // In-memory token blacklist (use Redis in production)
// const tokenBlacklist = new Set();

// class AuthUtils {
//     // Hash a password
//     static async hashPassword(plainPassword) {
//         return await bcrypt.hash(plainPassword, SALT_ROUNDS);
//     }

//     // Verify password against hash
//     static async verifyPassword(plainPassword, hashedPassword) {
//         return await bcrypt.compare(plainPassword, hashedPassword);
//     }

//     static async addToTokenBlacklist(token) {
//         try {
//             // Add token to blacklist
//             tokenBlacklist.add(token);
            
//             // Optionally decode to get expiration and clean up later
//             const decoded = jwt.decode(token);
//             if (decoded && decoded.exp) {
//                 const expiresAt = new Date(decoded.exp * 1000);
                
//                 // Set timeout to remove token from blacklist after expiration
//                 const timeUntilExpiry = expiresAt.getTime() - Date.now();
//                 if (timeUntilExpiry > 0) {
//                     setTimeout(() => {
//                         tokenBlacklist.delete(token);
//                     }, timeUntilExpiry);
//                 }
//             }
            
//             console.log(`Token added to blacklist: ${token.substring(0, 20)}...`);
//         } catch (error) {
//             console.error('Error adding token to blacklist:', error);
//             throw error;
//         }
//     }

//     static isTokenBlacklisted(token) {
//         return tokenBlacklist.has(token);
//     }

//     static clearBlacklist() {
//         tokenBlacklist.clear();
//     }

//     // Helper function to send password reset email
//     static async sendPasswordResetEmail(email, token) {
//         try {
//             const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            
//             // In production, use nodemailer, SendGrid, etc.
//             console.log('📧 Password Reset Email');
//             console.log(`To: ${email}`);
//             console.log(`Reset URL: ${resetUrl}`);
//             console.log('Subject: Reset your WeatherRoute AI password');
//             console.log('\nEmail body would contain:');
//             console.log(`Click the following link to reset your password: ${resetUrl}`);
//             console.log('This link will expire in 1 hour.');
            
//             // Simulate email sending delay
//             await new Promise(resolve => setTimeout(resolve, 100));
            
//             return {
//                 success: true,
//                 message: 'Password reset email sent successfully',
//                 resetUrl // Don't include this in production!
//             };
//         } catch (error) {
//             console.error('Error sending password reset email:', error);
//             throw new Error('Failed to send password reset email');
//         }
//     }

//     // Generate a secure random token
//     static generateSecureToken(length = 32) {
//         const crypto = require('crypto');
//         return crypto.randomBytes(length).toString('hex');
//     }

//     // Validate password strength
//     static validatePasswordStrength(password) {
//         const errors = [];
        
//         if (password.length < 8) {
//             errors.push('Password must be at least 8 characters long');
//         }
        
//         if (password.length > 128) {
//             errors.push('Password must be less than 128 characters');
//         }
        
//         if (!/[A-Za-z]/.test(password)) {
//             errors.push('Password must contain at least one letter');
//         }
        
//         if (!/[0-9]/.test(password)) {
//             errors.push('Password must contain at least one number');
//         }
        
//         return {
//             isValid: errors.length === 0,
//             errors
//         };
//     }

//     // Generate JWT token
//     static generateAccessToken(userId, expiresIn = '1h') {
//         return jwt.sign(
//             { userId }, 
//             process.env.JWT_SECRET, 
//             { expiresIn }
//         );
//     }

//     // Generate refresh token
//     static generateRefreshToken(userId, expiresIn = '7d') {
//         return jwt.sign(
//             { userId, type: 'refresh' }, 
//             process.env.REFRESH_SECRET, 
//             { expiresIn }
//         );
//     }
// }

// module.exports = AuthUtils;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const SALT_ROUNDS = 12;

// In-memory token blacklist (use Redis in production for distributed systems)
const tokenBlacklist = new Set();

class AuthUtils {
    static async hashPassword(plainPassword) {
        return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async addToTokenBlacklist(token) {
        try {
            tokenBlacklist.add(token);
            
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                const expiresAt = new Date(decoded.exp * 1000);
                const timeUntilExpiry = expiresAt.getTime() - Date.now();
                if (timeUntilExpiry > 0) {
                    setTimeout(() => {
                        tokenBlacklist.delete(token);
                    }, timeUntilExpiry);
                }
            }
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

    static async sendPasswordResetEmail(email, token) {
        try {
            const transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
            
            const mailOptions = {
                from: process.env.FROM_EMAIL,
                to: email,
                subject: 'Reset your WeatherRoute AI password',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <h2 style="color: #4A90E2;">Password Reset Request</h2>
                        <p>You requested to reset your password for your WeatherRoute AI account.</p>
                        <p>Click the button below to reset your password:</p>
                        <a href="${resetUrl}" 
                           style="display: inline-block; background-color: #4A90E2; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                                  margin: 20px 0;">
                            Reset Password
                        </a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                        <p style="color: #666; font-size: 14px;">
                            This link will expire in 1 hour. If you didn't request this reset, 
                            please ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px;">
                            WeatherRoute AI - Smart Weather Predictions
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            
            return {
                success: true,
                message: 'Password reset email sent successfully'
            };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    static generateSecureToken(length = 32) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    }

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

    static generateAccessToken(userId, expiresIn = '1h') {
        return jwt.sign(
            { userId }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );
    }

    static generateRefreshToken(userId, expiresIn = '7d') {
        return jwt.sign(
            { userId, type: 'refresh' }, 
            process.env.REFRESH_SECRET, 
            { expiresIn }
        );
    }

    static async validateEmailFormat(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static sanitizeUserData(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
}

module.exports = AuthUtils;
