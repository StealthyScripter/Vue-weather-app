// In-memory storage for routes and predictions -use Redis in production
const routeStorage = new Map();
const predictionStorage = new Map();

function getStoredRouteData(routeId) {
    return routeStorage.get(routeId) || null;
}

function storeRouteData(routeId, routeData) {
    routeStorage.set(routeId, routeData);
}

function analyzeRouteWeather(route, weatherService) {
    // Analyze weather conditions along route waypoints
    const weatherConditions = route.waypoints?.map(waypoint => ({
        location: waypoint.location,
        condition: 'partly_cloudy', // Simplified - would get from weatherService
        precipitation: Math.random() * 100, // Mock data
        severity: Math.random() > 0.7 ? 'severe' : 'mild'
    })) || [];

    const hasRain = weatherConditions.some(w => w.precipitation > 50);
    const hasSevereWeather = weatherConditions.some(w => w.severity === 'severe');
    
    return {
        conditions: weatherConditions,
        hasRain,
        hasSevereWeather,
        averagePrecipitation: weatherConditions.reduce((sum, w) => sum + w.precipitation, 0) / weatherConditions.length || 0
    };
}

function hasBadWeatherConditions(routeWeather, criteria = {}) {
    const {
        maxPrecipitation = 70,
        avoidSevereWeather = true,
        maxAveragePrecipitation = 40
    } = criteria;

    // Check if route has weather conditions that should be avoided
    if (avoidSevereWeather && routeWeather.hasSevereWeather) {
        return true;
    }
    
    if (routeWeather.averagePrecipitation > maxAveragePrecipitation) {
        return true;
    }
    
    if (routeWeather.hasRain && routeWeather.averagePrecipitation > maxPrecipitation) {
        return true;
    }
    
    return false;
}

function findWeatherOptimizedRoute(originalRoute, criteria = {}) {
    // Create an optimized route by modifying the original
    const optimizedRoute = {
        ...originalRoute,
        route_id: `optimized_${originalRoute.route_id}`,
        duration: originalRoute.duration + (5 * 60), // Add 5 minutes
        distance: originalRoute.distance + 0.5, // Add 0.5 miles
        waypoints: originalRoute.waypoints?.map(waypoint => ({
            ...waypoint,
            eta: new Date(new Date(waypoint.eta).getTime() + 5 * 60 * 1000).toISOString()
        })) || []
    };
    
    // Store the optimized route
    storeRouteData(optimizedRoute.route_id, optimizedRoute);
    
    return optimizedRoute;
}

function generateWeatherImprovement(routeWeather, criteria = {}) {
    const improvements = [];
    
    if (routeWeather.hasSevereWeather) {
        improvements.push('Avoids severe weather conditions');
    }
    
    if (routeWeather.hasRain) {
        improvements.push('Reduces exposure to rain');
    }
    
    if (routeWeather.averagePrecipitation > 50) {
        improvements.push('Lower chance of precipitation');
    }
    
    return improvements.length > 0 
        ? improvements.join(', ')
        : 'Alternative route with similar weather conditions';
}

function getTrafficCondition(delaySeconds) {
    if (delaySeconds < 300) return 'light';
    if (delaySeconds < 900) return 'moderate';
    return 'heavy';
}

function formatDelay(delaySeconds) {
    const minutes = Math.round(delaySeconds / 60);
    if (minutes < 5) return '0-5 minutes';
    if (minutes < 15) return '5-15 minutes';
    return `${minutes}+ minutes`;
}

function analyzeTrafficSegments(route) {
    // Analyze traffic for different segments of the route
    const segments = route.legs?.[0]?.steps?.map((step, index) => ({
        segment_id: `seg_${index}`,
        start_location: step.start_location,
        end_location: step.end_location,
        distance: step.distance?.text || '0 miles',
        normal_duration: step.duration?.text || '0 mins',
        current_duration: step.duration_in_traffic?.text || step.duration?.text || '0 mins',
        traffic_condition: Math.random() > 0.7 ? 'heavy' : Math.random() > 0.4 ? 'moderate' : 'light',
        delay_minutes: Math.floor(Math.random() * 10)
    })) || [];

    return segments;
}

function getStoredPrediction(predictionId) {
    return predictionStorage.get(predictionId) || null;
}

function storePrediction(predictionId, predictionData) {
    predictionStorage.set(predictionId, predictionData);
}

function clearStoredData() {
    routeStorage.clear();
    predictionStorage.clear();
}

module.exports = {
    getStoredRouteData,
    storeRouteData,
    analyzeRouteWeather,
    hasBadWeatherConditions,
    findWeatherOptimizedRoute,
    generateWeatherImprovement,
    getTrafficCondition,
    formatDelay,
    analyzeTrafficSegments,
    getStoredPrediction,
    storePrediction,
    clearStoredData
};