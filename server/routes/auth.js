const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const UserService = require('../services/userServices');
const AuthUtils = require('../utils/authUtils');
const db = require('../scripts/database'); // Your database connection

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_FIELDS',
                message: 'Email and password are required.'
            }
        });
    }
    
    try {
        const user = await UserService.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        if (!JWT_SECRET || !REFRESH_SECRET) {
            throw new Error('JWT configuration missing');
        }

        const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    created_at: user.created_at
                },
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: 3600
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }
        });
    }
});

// User registration  
router.post('/signup', async (req, res) => {
    const { full_name, email, password, confirm_password } = req.body;

    if (!full_name || !email || !password || !confirm_password) {
        return res.status(400).json({ 
            success: false, 
            error: {
                code: 'MISSING_FIELDS',
                message: 'All fields are required.'
            }
        });
    }

    if (password !== confirm_password) {
        return res.status(400).json({
            success: false, 
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input parameters',
                details: [{
                    field: 'confirm_password',
                    message: 'Passwords do not match'
                }]
            }
        });
    }

    const passwordValidation = AuthUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input parameters',
                details: [{
                    field: 'password',
                    message: passwordValidation.errors[0]
                }]
            }
        });
    }

    try {
        const existingUser = await UserService.findUserByEmail(email);
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'An account with this email already exists'
                }
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await UserService.createUser(full_name, email, hashedPassword);
        
        if (!JWT_SECRET || !REFRESH_SECRET) {
            throw new Error('JWT configuration missing');
        }

        const accessToken = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: newUser.id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            success: true,
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    full_name: newUser.full_name,
                    created_at: newUser.created_at
                },
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: 3600
                }
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }
        });
    }
});

// User logout
router.post('/logout', async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_REFRESH_TOKEN',
                message: 'Refresh token is required'
            }
        });
    }

    try {
        await AuthUtils.addToTokenBlacklist(refresh_token);

        return res.json({
            success: true,
            message: 'Successfully logged out'
        });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'LOGOUT_ERROR',
                message: 'Failed to logout'
            }
        });
    }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_REFRESH_TOKEN',
                message: 'Refresh token is required'
            }
        });
    }

    try {
        if (AuthUtils.isTokenBlacklisted(refresh_token)) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Token has been revoked'
                }
            });
        }

        const decoded = jwt.verify(refresh_token, REFRESH_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN_TYPE',
                    message: 'Invalid refresh token'
                }
            });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1h' });

        return res.json({
            success: true,
            data: {
                access_token: accessToken,
                expires_in: 3600
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token'
            }
        });
    }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_EMAIL',
                message: 'Email is required'
            }
        });
    }

    try {
        const user = await UserService.findUserByEmail(email);
        
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await db.none(`
                INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    token = $2, 
                    expires_at = $3, 
                    created_at = NOW(), 
                    used_at = NULL
            `, [user.id, resetToken, expiresAt]);

            await AuthUtils.sendPasswordResetEmail(user.email, resetToken);
        }

        return res.json({
            success: true,
            message: 'Password reset email sent if account exists'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }
        });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    const { token, new_password, confirm_password } = req.body;

    if (!token || !new_password || !confirm_password) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_FIELDS',
                message: 'Token, new password, and confirmation are required'
            }
        });
    }

    if (new_password !== confirm_password) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input parameters',
                details: [{
                    field: 'confirm_password',
                    message: 'Passwords do not match'
                }]
            }
        });
    }

    const passwordValidation = AuthUtils.validatePasswordStrength(new_password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input parameters',
                details: [{
                    field: 'password',
                    message: passwordValidation.errors[0]
                }]
            }
        });
    }

    try {
        const tokenData = await db.oneOrNone(`
            SELECT user_id, expires_at 
            FROM password_reset_tokens 
            WHERE token = $1 AND used_at IS NULL
        `, [token]);

        if (!tokenData) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired reset token'
                }
            });
        }

        if (new Date() > tokenData.expires_at) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'EXPIRED_TOKEN',
                    message: 'Reset token has expired'
                }
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await UserService.updateUserPassword(tokenData.user_id, hashedPassword);

        await db.none(`
            UPDATE password_reset_tokens 
            SET used_at = NOW() 
            WHERE token = $1
        `, [token]);

        return res.json({
            success: true,
            message: 'Password successfully reset'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }
        });
    }
});

module.exports = router;
