const express = require('express');
const router = express.Router();
const UserService = require('../services/userServices');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Access token is required'
            }
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Invalid or expired access token'
                }
            });
        }
        req.user = user;
        next();
    });
};

// GET request to fetch user profile data
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await UserService.findUserById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }
        
        const preferences = await UserService.getUserPreferences(userId);
        
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                created_at: user.created_at,
                preferences: preferences.preferences
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get user profile'
            }
        });
    }
});

// PUT request to update user profile data
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { full_name, preferences } = req.body;
        
        const updates = {};
        if (full_name) updates.full_name = full_name;
        
        // Update user basic info if provided
        let updatedUser = null;
        if (Object.keys(updates).length > 0) {
            updatedUser = await UserService.updateUser(userId, updates);
        }
        
        // Update preferences if provided
        let updatedPreferences = null;
        if (preferences) {
            updatedPreferences = await UserService.updateUserPreferences(userId, preferences);
        }
        
        // Get current user data if no updates were made
        if (!updatedUser) {
            updatedUser = await UserService.findUserById(userId);
        }
        if (!updatedPreferences) {
            updatedPreferences = await UserService.getUserPreferences(userId);
        }
        
        res.json({
            success: true,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                full_name: updatedUser.full_name,
                created_at: updatedUser.created_at,
                preferences: updatedPreferences.preferences
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_ERROR',
                message: 'Failed to update user profile'
            }
        });
    }
});

// GET request to retrieve user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const preferences = await UserService.getUserPreferences(userId);
        
        res.json({
            success: true,
            data: {
                user_id: userId,
                preferences: preferences.preferences,
                updated_at: preferences.updated_at
            }
        });
    } catch (error) {
        console.error('Error getting user preferences:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PREFERENCES_ERROR',
                message: 'Failed to get user preferences'
            }
        });
    }
});

// PUT request to update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { preferences } = req.body;
        
        if (!preferences) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PREFERENCES',
                    message: 'Preferences data is required'
                }
            });
        }
        
        const updatedPreferences = await UserService.updateUserPreferences(userId, preferences);
        
        res.json({
            success: true,
            data: {
                user_id: userId,
                preferences: updatedPreferences.preferences,
                updated_at: updatedPreferences.updated_at
            }
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_ERROR',
                message: 'Failed to update user preferences'
            }
        });
    }
});

// GET request to retrieve user's route history
router.get('/routes/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, sort = 'created_at_desc' } = req.query;
        
        const history = await UserService.getUserRouteHistory(
            userId,
            parseInt(page),
            parseInt(limit)
        );
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error getting route history:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'HISTORY_ERROR',
                message: 'Failed to get route history'
            }
        });
    }
});

// GET request to fetch user's favorite items
router.get('/favorites', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const favorites = await UserService.getUserFavorites(userId);
        
        res.json({
            success: true,
            data: {
                favorites,
                count: favorites.length
            }
        });
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FAVORITES_ERROR',
                message: 'Failed to get user favorites'
            }
        });
    }
});

// POST request to add a new item to favorites
router.post('/favorites', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, address, latitude, longitude } = req.body;
        
        // Validation
        if (!name || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Name, latitude, and longitude are required'
                }
            });
        }
        
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_COORDINATES',
                    message: 'Latitude and longitude must be valid numbers'
                }
            });
        }
        
        const favorite = await UserService.addFavorite(
            userId,
            name,
            address,
            parseFloat(latitude),
            parseFloat(longitude)
        );
        
        res.status(201).json({
            success: true,
            data: {
                id: `fav_${favorite.id}`,
                name: favorite.name,
                address: favorite.address,
                latitude: favorite.latitude,
                longitude: favorite.longitude,
                user_id: userId,
                created_at: favorite.created_at
            }
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ADD_FAVORITE_ERROR',
                message: 'Failed to add favorite location'
            }
        });
    }
});

// DELETE request to remove a favorite item by ID
router.delete('/favorites/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const favoriteId = req.params.id.replace('fav_', ''); // Remove prefix if present
        
        const result = await UserService.deleteFavorite(userId, favoriteId);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'FAVORITE_NOT_FOUND',
                    message: 'Favorite location not found'
                }
            });
        }
        
        res.json({
            success: true,
            message: 'Favorite location removed successfully'
        });
    } catch (error) {
        console.error('Error deleting favorite:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_FAVORITE_ERROR',
                message: 'Failed to remove favorite location'
            }
        });
    }
});

module.exports = router;