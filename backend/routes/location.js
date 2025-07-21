const express = require('express');
const router = express.Router();
const LocationService = require('../services/locationService');
const jwt = require('jsonwebtoken');

const locationService = new LocationService();

// Get user's current location
router.get('/current', async (req, res) => {
    try {
        // In a real app, this would come from the user's device
        // For demo, use default coordinates
        const lat = req.query.lat || 35.3021;
        const lng = req.query.lng || -81.3400;
        
        const location = await LocationService.getCurrentLocation(
            parseFloat(lat), 
            parseFloat(lng)
        );
        
        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        console.error('Error getting current location:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'LOCATION_ERROR',
                message: 'Failed to get current location'
            }
        });
    }
});

// Search locations by query
router.get('/search', async (req, res) => {
    try {
        const { q: query, limit = 5 } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_QUERY',
                    message: 'Search query is required'
                }
            });
        }
        
        const results = await locationService.searchLocations(query, parseInt(limit));
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error searching locations:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SEARCH_ERROR',
                message: 'Failed to search locations'
            }
        });
    }
});

// Convert address to coordinates
router.get('/geocode', async (req, res) => {
    try {
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ADDRESS',
                    message: 'Address parameter is required'
                }
            });
        }
        
        const result = await locationService.geocodeAddress(address);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error geocoding address:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GEOCODE_ERROR',
                message: 'Failed to geocode address'
            }
        });
    }
});

// Convert coordinates to address
router.get('/reverse', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_COORDINATES',
                    message: 'Latitude and longitude parameters are required'
                }
            });
        }
        
        const result = await locationService.reverseGeocode(
            parseFloat(lat), 
            parseFloat(lng)
        );
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REVERSE_GEOCODE_ERROR',
                message: 'Failed to reverse geocode coordinates'
            }
        });
    }
});

module.exports = router;