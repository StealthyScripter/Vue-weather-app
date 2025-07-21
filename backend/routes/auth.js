const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserService = require('../services/userServices');
const AuthUtils = require('../utils/authUtils');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

//User login
router.post('/login', async(req,res) => {
    const {email, password } = req.body;

    //basic validation
    if (!email || !password){
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_FIELDS',
                message: 'Email and password are required.'
            }
        });
    }
    
    try {
        //Find user by email
        const user = await UserService.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: INVALID_CREDENTIALS,
                    message: 'Invalid email or password'
                }
            });
        }

        //Check password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password'
                    }
                }
            });
        }

            // Create tokens
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
    } catch(error) {
        console.error('Error during login: ', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }
        });
    }
});

//User registration  
router.post('/signup', async (req, res) => {
    const { full_name, email, password, confirm_password } = req.body;

    // Basic validation
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
                code: 'PASSWORDS_MISMATCH',
                message: 'Passwords do not match.'
            }
        });
    }

    // Password strength validation
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'WEAK_PASSWORD',
                message: 'Password must be at least 8 characters long.'
            }
        });
    }

    try {
        // Check if user already exists
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

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const newUser = await UserService.createUser(full_name, email, hashedPassword);
        console.log('Created user: ', newUser);
        
        // Create tokens
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
        console.error('Error creating user:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }
        });
    }
});

//User logout
router.post('/logout', async(req, res) => {
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
            message: 'successfully logged out'
        });

    } catch(error) {
        console.error('Error during logout', error);
        return res.status(500).json({
            success:false,
            error: {
                code: 'LOGOUT_ERROR',
                message: 'Failed to logout'
            }
        });
    }
});

//Refresh access token
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
        // Verify refresh token
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

        // Generate new access token
        const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1h' });

        return res.json({
            success: true,
            data: {
                access_token: accessToken,
                expires_in: 3600
            }
        });

    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token'
            }
        });
    }
});

//Password reset request
// In routes/auth.js - Password reset methods need actual implementation
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
            // PRODUCTION IMPLEMENTATION NEEDED
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Store reset token in database
            await db.none(`
                INSERT INTO password_reset_tokens (user_id, token, expires_at)
                VALUES ($1, $2, $3)
            `, [user.id, resetToken, expiresAt]);

            // Send email with reset link
            AuthUtils.sendPasswordResetEmail(user.email, resetToken);
        }

        // Always return success to prevent email enumeration
        return res.json({
            success: true,
            message: 'Password reset email sent if account exists'
        });

    } catch (error) {
        console.error('Error in forgot password:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }
        });
    }
});

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
                code: 'PASSWORDS_MISMATCH',
                message: 'Passwords do not match'
            }
        });
    }

    if (new_password.length < 8) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'WEAK_PASSWORD',
                message: 'Password must be at least 8 characters long'
            }
        });
    }

    try {
        // PRODUCTION IMPLEMENTATION NEEDED
        // Verify the reset token from database
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

        // Check if token is expired
        if (new Date() > tokenData.expires_at) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'EXPIRED_TOKEN',
                    message: 'Reset token has expired'
                }
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update user's password
        await UserService.updateUser(tokenData.user_id, { password: hashedPassword });

        // Mark token as used
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
        console.error('Error resetting password:', error);
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
