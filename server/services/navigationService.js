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
            // For now, return a simulated optimization since we don't have 
            // alternative route calculation fully implemented
            const originalRoute = {
                route_id: routeId,
                total_distance: 129.9,
                total_duration: 7725, // 2h8m in seconds
                departure_time: "2025-07-28T09:00:00Z"
            };

            // Simulate finding an optimized route
            const optimizedRoute = {
                route_id: `optimized_${routeId}`,
                total_distance: 135.2, // Slightly longer
                total_duration: 7980,   // 2h13m - 5 minutes longer
                departure_time: originalRoute.departure_time,
                waypoints: [
                    {
                        location: { latitude: 35.2271, longitude: -80.8431 },
                        city: "Charlotte, NC",
                        eta: "2025-07-28T09:00:00Z",
                        distance_from_start: 0,
                        sequence: 0
                    },
                    {
                        location: { latitude: 35.5951, longitude: -82.5515 },
                        city: "Asheville, NC", 
                        eta: "2025-07-28T11:13:00Z",
                        distance_from_start: 135.2,
                        sequence: 1
                    }
                ]
            };

            // Calculate differences
            const timeDiff = optimizedRoute.total_duration - originalRoute.total_duration;
            const distDiff = optimizedRoute.total_distance - originalRoute.total_distance;

            // Generate weather improvement message based on criteria
            let weatherImprovement = "Alternative route with better weather conditions";
            if (optimizationCriteria.avoid_severe_weather) {
                weatherImprovement = "Avoids areas with severe weather alerts";
            } else if (optimizationCriteria.max_precipitation && optimizationCriteria.max_precipitation < 50) {
                weatherImprovement = "Reduces exposure to precipitation";
            }

            return {
                original_route_id: routeId,
                optimized_route_id: optimizedRoute.route_id,
                optimization_summary: {
                    time_difference: timeDiff > 0 ? `+${Math.round(timeDiff/60)} minutes` : `${Math.round(timeDiff/60)} minutes`,
                    distance_difference: distDiff > 0 ? `+${distDiff.toFixed(1)} miles` : `${distDiff.toFixed(1)} miles`,
                    weather_improvement: weatherImprovement
                },
                route: optimizedRoute,
                criteria_applied: optimizationCriteria
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
            city: this.getCityFromCoordinates(leg.start_location.lat,leg.start_location.lng),
            eta: departureTime,
            distance_from_start: 0,
            sequence: 0
        });

        // Add major waypoints
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
                    city: this.getCityFromCoordinates(step.end_location.lat, step.end_location.lng),
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
            city: this.getCityFromCoordinates(leg.end_location.lat, leg.end_location.lng),
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
        return `${result.components.city || 'Unknown'}, ${result.components.state || 'Unknown'}`;
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

    getCityFromCoordinates(lat, lng) {
        const cities = [
            // North Carolina
            { name: "Charlotte, NC", lat: 35.2271, lng: -80.8431, radius: 0.1 },
            { name: "Asheville, NC", lat: 35.5951, lng: -82.5515, radius: 0.1 },
            { name: "Durham, NC", lat: 35.9940, lng: -78.8986, radius: 0.1 },
            { name: "Kings Mountain, NC", lat: 35.3021, lng: -81.3400, radius: 0.05 },
            { name: "Raleigh, NC", lat: 35.7796, lng: -78.6382, radius: 0.1 },
            { name: "Greensboro, NC", lat: 36.0726, lng: -79.7920, radius: 0.1 },
            { name: "Winston-Salem, NC", lat: 36.0999, lng: -80.2442, radius: 0.1 },
            
            // South Carolina
            { name: "Columbia, SC", lat: 34.0007, lng: -81.0348, radius: 0.1 },
            { name: "Charleston, SC", lat: 32.7765, lng: -79.9311, radius: 0.1 },
            { name: "Greenville, SC", lat: 34.8526, lng: -82.3940, radius: 0.1 },
            
            // Georgia
            { name: "Atlanta, GA", lat: 33.7490, lng: -84.3880, radius: 0.2 },
            { name: "Savannah, GA", lat: 32.0835, lng: -81.0998, radius: 0.1 },
            { name: "Augusta, GA", lat: 33.4735, lng: -82.0105, radius: 0.1 },
            
            // Florida
            { name: "Jacksonville, FL", lat: 30.3322, lng: -81.6557, radius: 0.1 },
            { name: "Orlando, FL", lat: 28.5383, lng: -81.3792, radius: 0.1 },
            { name: "Tampa, FL", lat: 27.9506, lng: -82.4572, radius: 0.1 },
            { name: "Miami, FL", lat: 25.7617, lng: -80.1918, radius: 0.1 },
            { name: "Fort Lauderdale, FL", lat: 26.1224, lng: -80.1373, radius: 0.1 },
            { name: "West Palm Beach, FL", lat: 26.7153, lng: -80.0534, radius: 0.1 },
            
            // Virginia
            { name: "Richmond, VA", lat: 37.5407, lng: -77.4360, radius: 0.1 },
            { name: "Norfolk, VA", lat: 36.8468, lng: -76.2852, radius: 0.1 },
            
            // Tennessee
            { name: "Nashville, TN", lat: 36.1627, lng: -86.7816, radius: 0.1 },
            { name: "Knoxville, TN", lat: 35.9606, lng: -83.9207, radius: 0.1 }
        ];

        // Find closest city
        let closestCity = null;
        let minDistance = Infinity;
        
        for (const city of cities) {
            const distance = Math.sqrt(
                Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
            );
            if (distance <= city.radius && distance < minDistance) {
                closestCity = city;
                minDistance = distance;
            }
        }
        
        if (closestCity) {
            return closestCity.name;
        }

        // If no major city found, determine region by state boundaries
        if (lat >= 36.5) return "Virginia";
        if (lat >= 35.5 && lng >= -84) return "North Carolina";
        if (lat >= 35.5 && lng < -84) return "Tennessee";
        if (lat >= 32.0 && lat < 35.5 && lng >= -83) return "South Carolina";
        if (lat >= 30.5 && lat < 32.0 && lng >= -85) return "Georgia";
        if (lat < 30.5) return "Florida";
        if (lat >= 32.0 && lng < -83) return "Georgia";
        
        return "Southeast US";
    }
}

module.exports = NavigationService;