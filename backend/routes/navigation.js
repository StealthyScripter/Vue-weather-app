const express = require('express');
const router = express.Router();
const NavigationService = require('../services/navigationService');

const navigationService = new NavigationService();

// Calculate route between points
router.post('/plan', async (req, res) => {
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
        
        const route = await navigationService.planRoute(
            origin,
            destination,
            departureTime,
            preferences
        );
        
        res.json({
            success: true,
            data: route
        });
    } catch (error) {
        console.error('Error planning route:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ROUTE_PLANNING_ERROR',
                message: 'Failed to plan route'
            }
        });
    }
});

// Get turn-by-turn directions
router.get('/directions', async (req, res) => {
    try {
        const { route_id } = req.query;
        
        if (!route_id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ROUTE_ID',
                    message: 'Route ID is required'
                }
            });
        }
        
        const directions = await navigationService.getDirections(route_id);
        
        res.json({
            success: true,
            data: directions
        });
    } catch (error) {
        console.error('Error getting directions:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DIRECTIONS_ERROR',
                message: 'Failed to get directions'
            }
        });
    }
});

// Optimize route for weather
router.post('/optimize', async (req, res) => {
    try {
        const { route_id, optimization_criteria = {} } = req.body;
        
        if (!route_id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ROUTE_ID',
                    message: 'Route ID is required'
                }
            });
        }
        
        const optimizedRoute = await navigationService.optimizeForWeather(
            route_id,
            optimization_criteria
        );
        
        res.json({
            success: true,
            data: optimizedRoute
        });
    } catch (error) {
        console.error('Error optimizing route:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'OPTIMIZATION_ERROR',
                message: 'Failed to optimize route'
            }
        });
    }
});

// Get traffic conditions
router.get('/traffic', async (req, res) => {
    try {
        const { route_id } = req.query;
        
        if (!route_id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ROUTE_ID',
                    message: 'Route ID is required'
                }
            });
        }
        
        const trafficData = await navigationService.getTrafficConditions(route_id);
        
        res.json({
            success: true,
            data: trafficData
        });
    } catch (error) {
        console.error('Error getting traffic conditions:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'TRAFFIC_ERROR',
                message: 'Failed to get traffic conditions'
            }
        });
    }
});

module.exports = router;