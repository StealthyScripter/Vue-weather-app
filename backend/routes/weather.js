const express = require('express');
const router = express.Router();
const WeatherService = require('../services/weatherService');

const weatherService = new WeatherService();

// Current weather for location
router.get('/current', async (req, res) => {
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
        
        const weather = await weatherService.getCurrentWeather(
            parseFloat(lat), 
            parseFloat(lng)
        );
        
        res.json({
            success: true,
            data: weather
        });
    } catch (error) {
        console.error('Error getting current weather:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'WEATHER_ERROR',
                message: 'Failed to get current weather'
            }
        });
    }
});

// Multi-day forecast for location
router.get('/forecast', async (req, res) => {
    try {
        const { lat, lng, days = 5 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_COORDINATES',
                    message: 'Latitude and longitude parameters are required'
                }
            });
        }
        
        const forecast = await weatherService.getForecast(
            parseFloat(lat), 
            parseFloat(lng),
            parseInt(days)
        );
        
        res.json({
            success: true,
            data: forecast
        });
    } catch (error) {
        console.error('Error getting forecast:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FORECAST_ERROR',
                message: 'Failed to get weather forecast'
            }
        });
    }
});

// Hourly forecast for location
router.get('/hourly', async (req, res) => {
    try {
        const { lat, lng, hours = 24 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_COORDINATES',
                    message: 'Latitude and longitude parameters are required'
                }
            });
        }
        
        const hourlyForecast = await weatherService.getHourlyForecast(
            parseFloat(lat), 
            parseFloat(lng),
            parseInt(hours)
        );
        
        res.json({
            success: true,
            data: hourlyForecast
        });
    } catch (error) {
        console.error('Error getting hourly forecast:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'HOURLY_FORECAST_ERROR',
                message: 'Failed to get hourly forecast'
            }
        });
    }
});

// Weather alerts for location
router.get('/alerts', async (req, res) => {
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
        
        const alerts = await weatherService.getWeatherAlerts(
            parseFloat(lat), 
            parseFloat(lng)
        );
        
        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Error getting weather alerts:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ALERTS_ERROR',
                message: 'Failed to get weather alerts'
            }
        });
    }
});

// Air quality index for location
router.get('/air-quality', async (req, res) => {
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
        
        const airQuality = await weatherService.getAirQuality(
            parseFloat(lat), 
            parseFloat(lng)
        );
        
        res.json({
            success: true,
            data: {
                location: {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                    city: 'Kings Mountain',
                    state: 'NC'
                },
                air_quality: airQuality
            }
        });
    } catch (error) {
        console.error('Error getting air quality:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AIR_QUALITY_ERROR',
                message: 'Failed to get air quality data'
            }
        });
    }
});

module.exports = router;