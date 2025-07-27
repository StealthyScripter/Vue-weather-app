const express = require('express');
const router = express.Router();
const NavigationService = require('../services/navigationService');

const navigationService = new NavigationService();

// Calculate route between points
router.post('/plan', async (req, res) => {
    try {
        const { origin, destination, departure_time, preferences = {} } = req.body;
        
        // Enhanced validation
        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_LOCATIONS',
                    message: 'Origin and destination are required'
                }
            });
        }
        
        // Validate origin coordinates
        if (!origin.latitude || !origin.longitude || 
            typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ORIGIN',
                    message: 'Valid origin latitude and longitude (numbers) are required'
                }
            });
        }
        
        // Validate destination coordinates  
        if (!destination.latitude || !destination.longitude ||
            typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DESTINATION', 
                    message: 'Valid destination latitude and longitude (numbers) are required'
                }
            });
        }
        
        // Validate coordinate ranges
        if (origin.latitude < -90 || origin.latitude > 90 || 
            origin.longitude < -180 || origin.longitude > 180) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ORIGIN_COORDINATES',
                    message: 'Origin coordinates out of valid range'
                }
            });
        }
        
        if (destination.latitude < -90 || destination.latitude > 90 || 
            destination.longitude < -180 || destination.longitude > 180) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DESTINATION_COORDINATES',
                    message: 'Destination coordinates out of valid range'
                }
            });
        }
        
        // Validate departure_time format if provided
        if (departure_time) {
            const departureDate = new Date(departure_time);
            if (isNaN(departureDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_DEPARTURE_TIME',
                        message: 'Invalid departure time format. Use ISO 8601 format (e.g., 2025-07-28T14:00:00Z)'
                    }
                });
            }
        }
        
        const departureTime = departure_time || new Date().toISOString();
        
        // Continue with existing route planning logic...
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
