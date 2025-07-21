const axios = require('axios');
const WeatherService = require('./weatherService');
const { getStoredRouteData,
        analyzeRouteWeather,
        hasBadWeatherConditions,
        findWeatherOptimizedRoute,
        generateWeatherImprovement,
        getTrafficCondition,
        formatDelay,
        analyzeTrafficSegments } = require('../utils/navigationUtils');

class NavigationService {
    constructor() {
        this.apiKey = process.env.MAPS_API_KEY;
        this.directionsUrl = 'https://maps.googleapis.com/maps/api/directions/json';
        this.weatherService = new WeatherService();
    }

    // Calculate route between points
    async planRoute(origin, destination, departureTime, preferences = {}) {
        try {
            const response = await axios.get(this.directionsUrl, {
                params: {
                    origin: `${origin.latitude},${origin.longitude}`,
                    destination: `${destination.latitude},${destination.longitude}`,
                    departure_time: Math.floor(new Date(departureTime).getTime() / 1000),
                    traffic_model: 'best_guess',
                    avoid: this.buildAvoidParams(preferences),
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Directions API error: ${response.data.status}`);
            }

            const route = response.data.routes[0];
            const leg = route.legs[0];
            
            const routeId = `route_${Date.now()}`;
            const waypoints = this.extractWaypoints(route, departureTime);

            return {
                route_id: routeId,
                total_distance: this.metersToMiles(leg.distance.value),
                total_duration: this.formatDuration(leg.duration.value),
                total_duration_seconds: leg.duration.value,
                waypoints,
                polyline: route.overview_polyline.points
            };
        } catch (error) {
            console.error('Error planning route:', error);
            throw error;
        }
    }

    // Get turn-by-turn directions
    async getDirections(routeId) {
        try {
            // Retrieve route data from database/cache using routeId
            const routeData = getStoredRouteData(routeId);
            
            if (!routeData) {
                throw new Error('Route not found');
            }

            // Get detailed directions from Google Directions API
            const response = await axios.get(this.directionsUrl, {
                params: {
                    origin: `${routeData.origin.latitude},${routeData.origin.longitude}`,
                    destination: `${routeData.destination.latitude},${routeData.destination.longitude}`,
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Directions API error: ${response.data.status}`);
            }

            const route = response.data.routes[0];
            const directions = route.legs[0].steps.map((step, index) => ({
                step: index + 1,
                instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML
                distance: step.distance.text,
                duration: step.duration.text,
                location: {
                    latitude: step.start_location.lat,
                    longitude: step.start_location.lng
                }
            }));

            return {
                route_id: routeId,
                directions
            };
        } catch (error) {
            console.error('Error getting directions:', error);
            throw error;
        }
    }

    // Optimize route for weather conditions
    async optimizeForWeather(routeId, optimizationCriteria) {
    try {
        const originalRoute = getStoredRouteData(routeId);
        if (!originalRoute) {
            throw new Error('Original route not found');
        }

        // Get weather data along original route
        const weatherService = new (require('./weatherService'))();
        const routeWeather = analyzeRouteWeather(originalRoute, weatherService);
        
        // Find alternative routes if bad weather detected
        let optimizedRoute = originalRoute;
        if (hasBadWeatherConditions(routeWeather, optimizationCriteria)) {
            optimizedRoute = findWeatherOptimizedRoute(originalRoute, optimizationCriteria);
        }

        const timeDiff = optimizedRoute.duration - originalRoute.duration;
        const distDiff = optimizedRoute.distance - originalRoute.distance;

        return {
                original_route_id: routeId,
                optimized_route_id: optimizedRoute.route_id,
                optimization_summary: {
                    time_difference: timeDiff > 0 ? `+${Math.round(timeDiff/60)} minutes` : `${Math.round(timeDiff/60)} minutes`,
                    distance_difference: distDiff > 0 ? `+${distDiff.toFixed(1)} miles` : `${distDiff.toFixed(1)} miles`,
                    weather_improvement: generateWeatherImprovement(routeWeather, optimizationCriteria)
                },
                route: optimizedRoute
            };
        } catch (error) {
            console.error('Error optimizing route for weather:', error);
            throw error;
        }
    }

    // Get traffic conditions along route
    async getTrafficConditions(routeId) {
    try {
        // PRODUCTION IMPLEMENTATION NEEDED
        const routeData = await this.getStoredRouteData(routeId);
        if (!routeData) {
            throw new Error('Route not found');
        }

        // Get real-time traffic data from Google Maps Traffic API
        const response = await axios.get(this.directionsUrl, {
            params: {
                origin: `${routeData.origin.latitude},${routeData.origin.longitude}`,
                destination: `${routeData.destination.latitude},${routeData.destination.longitude}`,
                departure_time: 'now',
                traffic_model: 'best_guess',
                key: this.apiKey
            }
        });

        if (response.data.status !== 'OK') {
            throw new Error(`Traffic API error: ${response.data.status}`);
        }

        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        // Calculate delay by comparing duration vs duration_in_traffic
        const normalDuration = leg.duration.value;
        const trafficDuration = leg.duration_in_traffic ? leg.duration_in_traffic.value : normalDuration;
        const delay = trafficDuration - normalDuration;

        return {
            route_id: routeId,
            traffic_summary: {
                overall_condition: getTrafficCondition(delay),
                estimated_delay: formatDelay(delay),
                last_updated: new Date().toISOString()
            },
            segments: analyzeTrafficSegments(route)
        };
        } catch (error) {
            console.error('Error getting traffic conditions:', error);
            throw error;
        }
    }

    // Helper methods
    buildAvoidParams(preferences) {
        const avoid = [];
        if (preferences.avoid_tolls) avoid.push('tolls');
        if (preferences.avoid_highways) avoid.push('highways');
        return avoid.join('|');
    }

    extractWaypoints(route, departureTime) {
        const leg = route.legs[0];
        const steps = leg.steps;
        const waypoints = [];
        
        let cumulativeDistance = 0;
        let cumulativeTime = 0;
        
        // Add start point
        waypoints.push({
            location: {
                latitude: leg.start_location.lat,
                longitude: leg.start_location.lng
            },
            city: 'Kings Mountain, NC', // This would be determined from geocoding
            eta: departureTime,
            distance_from_start: 0,
            sequence: 0
        });

        // Add major waypoints (simplified - would use more sophisticated logic)
        const majorSteps = steps.filter((step, index) => 
            index % Math.max(1, Math.floor(steps.length / 4)) === 0 || 
            index === steps.length - 1
        );

        majorSteps.forEach((step, index) => {
            cumulativeDistance += step.distance.value;
            cumulativeTime += step.duration.value;
            
            if (index < majorSteps.length - 1) { // Don't add destination twice
                waypoints.push({
                    location: {
                        latitude: step.end_location.lat,
                        longitude: step.end_location.lng
                    },
                    city: this.getCityFromStep(step),
                    eta: new Date(new Date(departureTime).getTime() + cumulativeTime * 1000).toISOString(),
                    distance_from_start: this.metersToMiles(cumulativeDistance),
                    sequence: index + 1
                });
            }
        });

        // Add destination
        waypoints.push({
            location: {
                latitude: leg.end_location.lat,
                longitude: leg.end_location.lng
            },
            city: 'Durham, NC', // This would be determined from geocoding
            eta: new Date(new Date(departureTime).getTime() + leg.duration.value * 1000).toISOString(),
            distance_from_start: this.metersToMiles(leg.distance.value),
            sequence: waypoints.length
        });

        return waypoints;
    }

    async getCityFromStep(step) {
    try {
        // Use reverse geocoding to get actual city name
        const locationService = new (require('./locationService'))();
        const result = await locationService.reverseGeocode(
            step.end_location.lat,
            step.end_location.lng
        );
        return result.components.city + ', ' + result.components.state;
        } catch (error) {
            console.error('Error getting city from step:', error);
            return 'Unknown Location';
        }
    }

    metersToMiles(meters) {
        return Math.round((meters * 0.000621371) * 10) / 10;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h${minutes}m`;
        }
        return `${minutes}m`;
    }
}

module.exports = NavigationService;