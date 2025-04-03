// src/routes/weatherMapRoutes.ts
import express from 'express';
import { WeatherMapService } from '../services/weatherMapService';
import logger from '../utils/logger';

const router = express.Router();
const weatherMapService = new WeatherMapService();

// Get weather for a location
router.get('/weather/:location', async (req, res) => {
  try {
    const location = req.params.location;
    const weather = await weatherMapService.getWeatherForLocation(location);
    
    res.json({
      success: true,
      data: weather,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error getting weather: ${error instanceof Error ? error.message : String(error)}`);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

// Get weather forecast for a location
router.get('/forecast/:location', async (req, res) => {
  try {
    const location = req.params.location;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    
    const forecast = await weatherMapService.getWeatherForecast(location, days);
    
    res.json({
      success: true,
      data: forecast,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error getting forecast: ${error instanceof Error ? error.message : String(error)}`);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

// Get location details
router.get('/location/:place', async (req, res) => {
  try {
    const place = req.params.place;
    const location = await weatherMapService.getLocationDetails(place);
    
    res.json({
      success: true,
      data: location,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error getting location: ${error instanceof Error ? error.message : String(error)}`);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

// Get nearby places
router.get('/nearby', async (req, res) => {
  try {
    const location = req.query.location as string;
    const radius = req.query.radius ? parseInt(req.query.radius as string) : 1000;
    const type = req.query.type as string | undefined;
    
    const places = await weatherMapService.getNearbyPlaces(location, radius, type);
    
    res.json({
      success: true,
      data: places,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error getting nearby places: ${error instanceof Error ? error.message : String(error)}`);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

// Calculate route with weather
router.post('/route', async (req, res) => {
  try {
    const { start, end, options } = req.body;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Start and end locations are required',
        timestamp: new Date()
      });
    }
    
    const routeWithWeather = await weatherMapService.getRouteWithWeather(start, end, options);
    
    res.json({
      success: true,
      data: routeWithWeather,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error calculating route: ${error instanceof Error ? error.message : String(error)}`);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

export default router;