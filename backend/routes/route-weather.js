const express = require('express');
const router = express.Router();
const RouteWeatherService = require('../services/routeWeatherService');
const jwt = require('jsonwebtoken');

const routeWeatherService = new RouteWeatherService();

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

// Get weather predictions along route
router.post('/predict', async (req, res) => {
    try {
        const { origin, destination, departure_time, preferences = {} } = req.body;
        
        // Validation
        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_LOCATIONS',
                    message: 'Origin and destination are required'
                }
            });
        }
        
        if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_COORDINATES',
                    message: 'Valid latitude and longitude are required for both origin and destination'
                }
            });
        }
        
        const departureTime = departure_time || new Date().toISOString();
        
        const prediction = await routeWeatherService.predictWeatherAlongRoute(
            origin,
            destination,
            departureTime,
            preferences
        );
        
        res.json({
            success: true,
            data: prediction
        });
    } catch (error) {
        console.error('Error predicting route weather:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PREDICTION_ERROR',
                message: 'Failed to predict weather along route'
            }
        });
    }
});

// Save route weather prediction
router.post('/save', authenticateToken, async (req, res) => {
    try {
        const { prediction_id, name, notifications = {} } = req.body;
        const userId = req.user.userId;
        
        if (!prediction_id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PREDICTION_ID',
                    message: 'Prediction ID is required'
                }
            });
        }
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_NAME',
                    message: 'Name is required'
                }
            });
        }
        
        const savedPrediction = await routeWeatherService.savePrediction(
            userId,
            prediction_id,
            name,
            notifications
        );
        
        res.status(201).json({
            success: true,
            data: savedPrediction
        });
    } catch (error) {
        console.error('Error saving prediction:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SAVE_ERROR',
                message: 'Failed to save route weather prediction'
            }
        });
    }
});

// Get saved route weather prediction
router.get('/saved/:id', authenticateToken, async (req, res) => {
    try {
        const predictionId = req.params.id;
        const userId = req.user.userId;
        
        const savedPrediction = await routeWeatherService.getSavedPrediction(userId, predictionId);
        
        res.json({
            success: true,
            data: savedPrediction
        });
    } catch (error) {
        console.error('Error getting saved prediction:', error);
        
        if (error.message === 'Saved prediction not found') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Saved prediction not found'
                }
            });
        }
        
        res.status(500).json({
            success: false,
            error: {
                code: 'RETRIEVAL_ERROR',
                message: 'Failed to get saved prediction'
            }
        });
    }
});

// Delete saved route prediction
router.delete('/saved/:id', authenticateToken, async (req, res) => {
    try {
        const predictionId = req.params.id;
        const userId = req.user.userId;
        
        await routeWeatherService.deleteSavedPrediction(userId, predictionId);
        
        res.json({
            success: true,
            message: 'Route weather prediction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting saved prediction:', error);
        
        if (error.message === 'Saved prediction not found') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Saved prediction not found'
                }
            });
        }
        
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_ERROR',
                message: 'Failed to delete saved prediction'
            }
        });
    }
});

// Get user's saved predictions (bonus endpoint)
router.get('/saved', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;
        
        const predictions = await routeWeatherService.getUserSavedPredictions(
            userId,
            parseInt(page),
            parseInt(limit)
        );
        
        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        console.error('Error getting user saved predictions:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'RETRIEVAL_ERROR',
                message: 'Failed to get saved predictions'
            }
        });
    }
});

module.exports = router;