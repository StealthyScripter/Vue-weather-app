// const { db } = require('../scripts/database');
// const WeatherService = require('./weatherService');
// const NavigationService = require('./navigationService');
// const { getStoredPrediction } = require('../utils/navigationUtils');

// class RouteWeatherService {
//     constructor() {
//         this.weatherService = new WeatherService();
//         this.navigationService = new NavigationService();
//     }

//     // Get weather predictions along route
//     async predictWeatherAlongRoute(origin, destination, departureTime, preferences = {}) {
//         try {
//             // First, plan the route
//             const route = await this.navigationService.planRoute(
//                 origin, destination, departureTime, preferences
//             );

//             // Generate prediction ID
//             const predictionId = `pred_${Date.now()}`;

//             // Get weather for each waypoint
//             const weatherPoints = await Promise.all(
//                 route.waypoints.map(async (waypoint, index) => {
//                     const weather = await this.getWeatherForWaypoint(
//                         waypoint.location.latitude,
//                         waypoint.location.longitude,
//                         waypoint.eta
//                     );

//                     return {
//                         location: {
//                             latitude: waypoint.location.latitude,
//                             longitude: waypoint.location.longitude,
//                             city: waypoint.city
//                         },
//                         time: waypoint.eta,
//                         distance_from_start: waypoint.distance_from_start,
//                         weather
//                     };
//                 })
//             );

//             // Analyze weather conditions
//             const weatherSummary = this.analyzeWeatherConditions(weatherPoints);

//             return {
//                 prediction_id: predictionId,
//                 route: {
//                     route_id: route.route_id,
//                     total_distance: route.total_distance,
//                     total_duration: route.total_duration,
//                     departure_time: departureTime,
//                     arrival_time: route.waypoints[route.waypoints.length - 1].eta
//                 },
//                 weather_points: weatherPoints,
//                 weather_summary: weatherSummary,
//                 created_at: new Date().toISOString()
//             };
//         } catch (error) {
//             console.error('Error predicting weather along route:', error);
//             throw error;
//         }
//     }

//     // Save route weather prediction
//     async savePrediction(userId, predictionId, name, notifications = {}) {
//     try {
//         // Retrieve the actual prediction data from cache/memory
//         const predictionData = getStoredPrediction(predictionId);
        
//         if (!predictionData) {
//             throw new Error('Prediction data not found. Generate prediction first.');
//         }

//         const query = `
//             INSERT INTO saved_predictions (
//                 user_id, prediction_id, name, route_data, weather_data, notifications
//             )
//             VALUES ($1, $2, $3, $4, $5, $6)
//             RETURNING id, prediction_id, name, notifications, created_at
//         `;

//         const result = await db.one(query, [
//             userId,
//             predictionId,
//             name,
//             JSON.stringify(predictionData.route),
//             JSON.stringify({
//                 weather_points: predictionData.weather_points,
//                 weather_summary: predictionData.weather_summary
//             }),
//             JSON.stringify(notifications)
//         ]);

//         return {
//             saved_prediction_id: `saved_${result.id}`,
//             prediction_id: result.prediction_id,
//             name: result.name,
//             user_id: userId,
//             notifications: result.notifications,
//             created_at: result.created_at
//         };
//         } catch (error) {
//             console.error('Error saving prediction:', error);
//             throw error;
//         }
//     }

//     // Get saved route weather prediction
//     async getSavedPrediction(userId, predictionId) {
//         try {
//             const query = `
//                 SELECT prediction_id, name, route_data, weather_data, notifications, created_at
//                 FROM saved_predictions 
//                 WHERE user_id = $1 AND prediction_id = $2
//             `;

//             const result = await db.oneOrNone(query, [userId, predictionId]);

//             if (!result) {
//                 throw new Error('Saved prediction not found');
//             }

//             return {
//                 prediction_id: result.prediction_id,
//                 route: result.route_data,
//                 weather_points: result.weather_data.weather_points || [],
//                 weather_summary: result.weather_data.weather_summary || {},
//                 created_at: result.created_at,
//                 saved_at: result.created_at
//             };
//         } catch (error) {
//             console.error('Error getting saved prediction:', error);
//             throw error;
//         }
//     }

//     // Delete saved route prediction
//     async deleteSavedPrediction(userId, predictionId) {
//         try {
//             const query = `
//                 DELETE FROM saved_predictions 
//                 WHERE user_id = $1 AND prediction_id = $2
//                 RETURNING id
//             `;

//             const result = await db.oneOrNone(query, [userId, predictionId]);

//             if (!result) {
//                 throw new Error('Saved prediction not found');
//             }

//             return { success: true };
//         } catch (error) {
//             console.error('Error deleting saved prediction:', error);
//             throw error;
//         }
//     }

//     // Get user's saved predictions
//     async getUserSavedPredictions(userId, page = 1, limit = 10) {
//         try {
//             const offset = (page - 1) * limit;
            
//             const query = `
//                 SELECT prediction_id, name, route_data, weather_data, created_at
//                 FROM saved_predictions 
//                 WHERE user_id = $1
//                 ORDER BY created_at DESC
//                 LIMIT $2 OFFSET $3
//             `;
            
//             const countQuery = `
//                 SELECT COUNT(*) as total
//                 FROM saved_predictions 
//                 WHERE user_id = $1
//             `;
            
//             const [predictions, countResult] = await Promise.all([
//                 db.any(query, [userId, limit, offset]),
//                 db.one(countQuery, [userId])
//             ]);
            
//             const total = parseInt(countResult.total);
            
//             return {
//                 predictions: predictions.map(p => ({
//                     prediction_id: p.prediction_id,
//                     name: p.name,
//                     route: p.route_data,
//                     weather_summary: p.weather_data.weather_summary || {},
//                     created_at: p.created_at
//                 })),
//                 pagination: {
//                     page,
//                     limit,
//                     total,
//                     total_pages: Math.ceil(total / limit),
//                     has_next: offset + limit < total,
//                     has_prev: page > 1
//                 }
//             };
//         } catch (error) {
//             console.error('Error getting user saved predictions:', error);
//             throw error;
//         }
//     }

//     // Helper method to get weather for a specific waypoint and time
//     async getWeatherForWaypoint(lat, lng, time) {
//         try {
//             // For current/near-term predictions, use current weather
//             const timeDiff = new Date(time).getTime() - Date.now();
            
//             if (timeDiff < 6 * 60 * 60 * 1000) { // Less than 6 hours
//                 const currentWeather = await this.weatherService.getCurrentWeather(lat, lng);
//                 return this.formatWeatherForRoute(currentWeather.current);
//             } else {
//                 // For longer predictions, use forecast data
//                 const forecast = await this.weatherService.getHourlyForecast(lat, lng, 48);
//                 // Find closest hour in forecast
//                 const targetHour = new Date(time).getHours();
//                 const forecastHour = forecast.hourly.find(h => 
//                     new Date(h.datetime).getHours() === targetHour
//                 ) || forecast.hourly[0];
                
//                 return this.formatWeatherForRoute(forecastHour);
//             }
//         } catch (error) {
//             console.error('Error getting weather for waypoint:', error);
//             // Return default weather if service fails
//             return this.getDefaultWeather();
//         }
//     }

//     // Format weather data for route display
//     formatWeatherForRoute(weather) {
//         return {
//             temperature: weather.temperature,
//             condition: weather.condition,
//             condition_text: weather.condition_text || weather.description,
//             icon: this.getWeatherIcon(weather.condition),
//             precipitation_chance: weather.precipitation_chance || 0,
//             wind_speed: weather.wind_speed,
//             wind_direction: weather.wind_direction || 'ESE',
//             humidity: weather.humidity,
//             visibility: weather.visibility || 10
//         };
//     }

//     // Analyze overall weather conditions for the route
//     analyzeWeatherConditions(weatherPoints) {
//         const conditions = weatherPoints.map(wp => wp.weather.condition);
//         const precipChances = weatherPoints.map(wp => wp.weather.precipitation_chance);
        
//         const hasRain = conditions.some(c => c.includes('rain'));
//         const maxPrecipChance = Math.max(...precipChances);
        
//         let overallCondition = 'clear';
//         if (maxPrecipChance > 70) overallCondition = 'deteriorating';
//         else if (maxPrecipChance > 30) overallCondition = 'variable';
        
//         const rainStart = weatherPoints.find(wp => wp.weather.condition.includes('rain'));
        
//         const recommendations = [];
//         if (hasRain) {
//             recommendations.push('Consider departing earlier to avoid rain');
//             recommendations.push('Pack umbrella for arrival in Durham');
//             recommendations.push('Reduce speed during rain in Greensboro area');
//         }
        
//         return {
//             overall_condition: overallCondition,
//             rain_expected: hasRain,
//             rain_start_location: rainStart ? rainStart.location.city : null,
//             rain_start_time: rainStart ? rainStart.time : null,
//             recommendations
//         };
//     }

//     // Get weather icon based on condition
//     getWeatherIcon(condition) {
//         const iconMap = {
//             'sunny': '☀️',
//             'partly_cloudy': '⛅',
//             'cloudy': '☁️',
//             'light_rain': '🌦',
//             'rain': '🌧',
//             'thunderstorm': '⛈️',
//             'snow': '🌨',
//             'foggy': '🌫'
//         };
//         return iconMap[condition] || '☀️';
//     }

//     // Default weather when service fails
//     getDefaultWeather() {
//         return {
//             temperature: 75,
//             condition: 'partly_cloudy',
//             condition_text: 'Partly Cloudy',
//             icon: '⛅',
//             precipitation_chance: 20,
//             wind_speed: 5,
//             wind_direction: 'ESE',
//             humidity: 65,
//             visibility: 10
//         };
//     }
// }

// module.exports = RouteWeatherService;

const { db } = require('../scripts/database');
const WeatherService = require('./weatherService');
const NavigationService = require('./navigationService');
const { getStoredPrediction, storePrediction, storeRouteData } = require('../utils/navigationUtils');

class RouteWeatherService {
    constructor() {
        this.weatherService = new WeatherService();
        this.navigationService = new NavigationService();
    }

    // Get weather predictions along route
    async predictWeatherAlongRoute(origin, destination, departureTime, preferences = {}) {
        try {
            // First, plan the route
            const route = await this.navigationService.planRoute(
                origin, destination, departureTime, preferences
            );

            // Store route data for later use
            storeRouteData(route.route_id, {
                ...route,
                origin,
                destination,
                departure_time: departureTime
            });

            // Generate prediction ID
            const predictionId = `pred_${Date.now()}`;

            // Get weather for each waypoint
            const weatherPoints = await Promise.all(
                route.waypoints.map(async (waypoint, index) => {
                    const weather = await this.getWeatherForWaypoint(
                        waypoint.location.latitude,
                        waypoint.location.longitude,
                        waypoint.eta
                    );

                    return {
                        location: {
                            latitude: waypoint.location.latitude,
                            longitude: waypoint.location.longitude,
                            city: waypoint.city
                        },
                        time: waypoint.eta,
                        distance_from_start: waypoint.distance_from_start,
                        weather
                    };
                })
            );

            // Analyze weather conditions
            const weatherSummary = this.analyzeWeatherConditions(weatherPoints);

            // Create prediction data
            const predictionData = {
                prediction_id: predictionId,
                route: {
                    route_id: route.route_id,
                    total_distance: route.total_distance,
                    total_duration: route.total_duration,
                    departure_time: departureTime,
                    arrival_time: route.waypoints[route.waypoints.length - 1].eta
                },
                weather_points: weatherPoints,
                weather_summary: weatherSummary,
                created_at: new Date().toISOString()
            };

            // Store prediction data for later retrieval
            storePrediction(predictionId, predictionData);

            return predictionData;
        } catch (error) {
            console.error('Error predicting weather along route:', error);
            throw error;
        }
    }

    // Save route weather prediction
    async savePrediction(userId, predictionId, name, notifications = {}) {
        try {
            // Retrieve the actual prediction data from storage
            const predictionData = getStoredPrediction(predictionId);
            
            if (!predictionData) {
                throw new Error('Prediction data not found. Generate prediction first.');
            }

            const query = `
                INSERT INTO saved_predictions (
                    user_id, prediction_id, name, route_data, weather_data, notifications
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, prediction_id, name, notifications, created_at
            `;

            const result = await db.one(query, [
                userId,
                predictionId,
                name,
                JSON.stringify(predictionData.route),
                JSON.stringify({
                    weather_points: predictionData.weather_points,
                    weather_summary: predictionData.weather_summary
                }),
                JSON.stringify(notifications)
            ]);

            return {
                saved_prediction_id: `saved_${result.id}`,
                prediction_id: result.prediction_id,
                name: result.name,
                user_id: userId,
                notifications: result.notifications,
                created_at: result.created_at
            };
        } catch (error) {
            console.error('Error saving prediction:', error);
            throw error;
        }
    }

    // Get saved route weather prediction
    async getSavedPrediction(userId, predictionId) {
        try {
            const query = `
                SELECT prediction_id, name, route_data, weather_data, notifications, created_at
                FROM saved_predictions 
                WHERE user_id = $1 AND prediction_id = $2
            `;

            const result = await db.oneOrNone(query, [userId, predictionId]);

            if (!result) {
                throw new Error('Saved prediction not found');
            }

            return {
                prediction_id: result.prediction_id,
                name: result.name,
                route: result.route_data,
                weather_points: result.weather_data.weather_points || [],
                weather_summary: result.weather_data.weather_summary || {},
                notifications: result.notifications,
                created_at: result.created_at,
                saved_at: result.created_at
            };
        } catch (error) {
            console.error('Error getting saved prediction:', error);
            throw error;
        }
    }

    // Delete saved route prediction
    async deleteSavedPrediction(userId, predictionId) {
        try {
            const query = `
                DELETE FROM saved_predictions 
                WHERE user_id = $1 AND prediction_id = $2
                RETURNING id
            `;

            const result = await db.oneOrNone(query, [userId, predictionId]);

            if (!result) {
                throw new Error('Saved prediction not found');
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting saved prediction:', error);
            throw error;
        }
    }

    // Get user's saved predictions
    async getUserSavedPredictions(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const query = `
                SELECT prediction_id, name, route_data, weather_data, created_at
                FROM saved_predictions 
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            `;
            
            const countQuery = `
                SELECT COUNT(*) as total
                FROM saved_predictions 
                WHERE user_id = $1
            `;
            
            const [predictions, countResult] = await Promise.all([
                db.any(query, [userId, limit, offset]),
                db.one(countQuery, [userId])
            ]);
            
            const total = parseInt(countResult.total);
            
            return {
                predictions: predictions.map(p => ({
                    prediction_id: p.prediction_id,
                    name: p.name,
                    route: p.route_data,
                    weather_summary: p.weather_data.weather_summary || {},
                    created_at: p.created_at
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                    has_next: offset + limit < total,
                    has_prev: page > 1
                }
            };
        } catch (error) {
            console.error('Error getting user saved predictions:', error);
            throw error;
        }
    }

    // Helper method to get weather for a specific waypoint and time
    async getWeatherForWaypoint(lat, lng, time) {
        try {
            // Calculate time difference from now
            const timeDiff = new Date(time).getTime() - Date.now();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff <= 1) {
                // For current/immediate future, use current weather
                const currentWeather = await this.weatherService.getCurrentWeather(lat, lng);
                return this.formatWeatherForRoute(currentWeather.current);
            } else if (hoursDiff <= 48) {
                // For next 48 hours, use hourly forecast
                const forecast = await this.weatherService.getHourlyForecast(lat, lng, 48);
                
                // Find the closest hour to our target time
                const targetTime = new Date(time);
                let closestHour = forecast.hourly[0];
                let minDiff = Math.abs(new Date(forecast.hourly[0].datetime) - targetTime);
                
                for (const hour of forecast.hourly) {
                    const diff = Math.abs(new Date(hour.datetime) - targetTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestHour = hour;
                    }
                }
                
                return this.formatWeatherForRoute(closestHour);
            } else {
                // For longer predictions, use daily forecast (take average conditions)
                const forecast = await this.weatherService.getForecast(lat, lng, 7);
                const targetDate = new Date(time).toDateString();
                
                let targetDay = forecast.forecast.find(day => 
                    new Date(day.date).toDateString() === targetDate
                );
                
                if (!targetDay) {
                    targetDay = forecast.forecast[forecast.forecast.length - 1];
                }
                
                return this.formatWeatherForRoute(targetDay, true);
            }
        } catch (error) {
            console.error('Error getting weather for waypoint:', error);
            // Return default weather if service fails
            return this.getDefaultWeather();
        }
    }

    // Format weather data for route display (works with OpenWeatherMap format)
    formatWeatherForRoute(weather, isDailyData = false) {
        if (isDailyData) {
            // Handle daily forecast data format
            return {
                temperature: Math.round((weather.high_temp + weather.low_temp) / 2),
                condition: weather.condition,
                condition_text: weather.condition_text,
                icon: this.getWeatherIcon(weather.condition),
                precipitation_chance: weather.precipitation_chance || 0,
                wind_speed: weather.wind_speed,
                wind_direction: 'Variable',
                humidity: weather.humidity || 65,
                visibility: 10
            };
        } else {
            // Handle current/hourly data format (OpenWeatherMap)
            return {
                temperature: weather.temperature,
                condition: weather.condition,
                condition_text: weather.condition_text || weather.description,
                icon: this.getWeatherIcon(weather.condition),
                precipitation_chance: weather.precipitation_chance || 0,
                wind_speed: weather.wind_speed,
                wind_direction: weather.wind_direction || 'ESE',
                humidity: weather.humidity,
                visibility: weather.visibility || 10
            };
        }
    }

    // Analyze overall weather conditions for the route
    analyzeWeatherConditions(weatherPoints) {
        const conditions = weatherPoints.map(wp => wp.weather.condition);
        const precipChances = weatherPoints.map(wp => wp.weather.precipitation_chance);
        
        const hasRain = conditions.some(c => c.includes('rain'));
        const hasSnow = conditions.some(c => c.includes('snow'));
        const hasThunderstorm = conditions.some(c => c.includes('thunderstorm'));
        const maxPrecipChance = Math.max(...precipChances);
        
        let overallCondition = 'clear';
        if (hasThunderstorm || maxPrecipChance > 80) {
            overallCondition = 'severe';
        } else if (hasSnow || maxPrecipChance > 70) {
            overallCondition = 'deteriorating';
        } else if (hasRain || maxPrecipChance > 30) {
            overallCondition = 'variable';
        }
        
        const adverseWeather = weatherPoints.find(wp => 
            wp.weather.condition.includes('rain') || 
            wp.weather.condition.includes('snow') ||
            wp.weather.condition.includes('thunderstorm')
        );
        
        const recommendations = [];
        if (hasThunderstorm) {
            recommendations.push('Consider postponing travel due to thunderstorm risk');
            recommendations.push('Monitor weather alerts before departure');
        } else if (hasSnow) {
            recommendations.push('Pack winter emergency kit');
            recommendations.push('Allow extra travel time for snow conditions');
            recommendations.push('Check road conditions before departure');
        } else if (hasRain) {
            recommendations.push('Pack umbrella and rain gear');
            recommendations.push('Reduce speed during rain');
            if (adverseWeather) {
                recommendations.push(`Expect rain starting near ${adverseWeather.location.city}`);
            }
        }
        
        if (maxPrecipChance > 50) {
            recommendations.push('Consider departing earlier or later to avoid precipitation');
        }
        
        return {
            overall_condition: overallCondition,
            rain_expected: hasRain,
            snow_expected: hasSnow,
            thunderstorm_expected: hasThunderstorm,
            max_precipitation_chance: maxPrecipChance,
            adverse_weather_location: adverseWeather ? adverseWeather.location.city : null,
            adverse_weather_time: adverseWeather ? adverseWeather.time : null,
            recommendations
        };
    }

    // Get weather icon based on condition
    getWeatherIcon(condition) {
        const iconMap = {
            'sunny': '☀️',
            'partly_cloudy': '⛅',
            'cloudy': '☁️',
            'light_rain': '🌦',
            'rain': '🌧',
            'thunderstorm': '⛈️',
            'snow': '🌨',
            'foggy': '🌫'
        };
        return iconMap[condition] || '☀️';
    }

    // Default weather when service fails
    getDefaultWeather() {
        return {
            temperature: 75,
            condition: 'partly_cloudy',
            condition_text: 'Partly Cloudy',
            icon: '⛅',
            precipitation_chance: 20,
            wind_speed: 5,
            wind_direction: 'ESE',
            humidity: 65,
            visibility: 10
        };
    }
}

module.exports = RouteWeatherService;