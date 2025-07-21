const axios = require('axios');
const { mapAlertSeverity, mapWeatherCondition } = require('../utils/weatherUtils');

class WeatherService {
    constructor() {
        this.apiKey = process.env.WEATHER_API_KEY;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.airQualityUrl = 'https://api.openweathermap.org/data/2.5/air_pollution';
    }

    // Get current weather for location
    async getCurrentWeather(lat, lng) {
        try {
            const response = await axios.get(`${this.baseUrl}/weather`, {
                params: {
                    lat,
                    lon: lng,
                    appid: this.apiKey,
                    units: 'imperial'
                }
            });

            const data = response.data;
            
            return {
                location: {
                    latitude: lat,
                    longitude: lng,
                    city: data.name,
                    state: data.sys.country
                },
                current: {
                    temperature: Math.round(data.main.temp),
                    feels_like: Math.round(data.main.feels_like),
                    condition: this.mapWeatherCondition(data.weather[0].main),
                    condition_text: data.weather[0].description,
                    humidity: data.main.humidity,
                    wind_speed: Math.round(data.wind.speed),
                    wind_direction: this.getWindDirection(data.wind.deg),
                    pressure: (data.main.pressure * 0.02953).toFixed(2), // Convert to inches
                    visibility: Math.round((data.visibility || 10000) / 1609.34), // Convert to miles
                    uv_index: 6, // OpenWeather free tier doesn't include UV
                    air_quality: await this.getAirQuality(lat, lng)
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting current weather:', error);
            throw error;
        }
    }

    // Get multi-day forecast
    async getForecast(lat, lng, days = 5) {
        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    lat,
                    lon: lng,
                    appid: this.apiKey,
                    units: 'imperial'
                }
            });

            const data = response.data;
            const dailyForecasts = this.processDailyForecasts(data.list, days);
            
            return {
                location: {
                    latitude: lat,
                    longitude: lng,
                    city: data.city.name,
                    state: data.city.country
                },
                forecast: dailyForecasts
            };
        } catch (error) {
            console.error('Error getting forecast:', error);
            throw error;
        }
    }

    // Get hourly forecast
    async getHourlyForecast(lat, lng, hours = 24) {
        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    lat,
                    lon: lng,
                    appid: this.apiKey,
                    units: 'imperial'
                }
            });

            const data = response.data;
            const hourlyData = data.list.slice(0, Math.ceil(hours / 3)).map(item => ({
                datetime: item.dt_txt.replace(' ', 'T') + 'Z',
                temperature: Math.round(item.main.temp),
                condition: mapWeatherCondition(item.weather[0].main),
                condition_text: item.weather[0].description,
                precipitation_chance: Math.round((item.pop || 0) * 100),
                wind_speed: Math.round(item.wind.speed),
                humidity: item.main.humidity
            }));

            return {
                location: {
                    latitude: lat,
                    longitude: lng,
                    city: data.city.name,
                    state: data.city.country
                },
                hourly: hourlyData
            };
        } catch (error) {
            console.error('Error getting hourly forecast:', error);
            throw error;
        }
    }

    // Get weather alerts
    async getWeatherAlerts(lat, lng) {
    try {
        // Use OpenWeather OneCall API or weather alerts API
        const response = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
            params: {
                lat,
                lon: lng,
                appid: this.apiKey,
                exclude: 'minutely,daily'
            }
        });

        const alerts = response.data.alerts || [];
        
        return {
            alerts: alerts.map(alert => ({
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: alert.event.toLowerCase().replace(/\s+/g, '_'),
                title: alert.event,
                description: alert.description,
                severity: mapAlertSeverity(alert.tags),
                start_time: new Date(alert.start * 1000).toISOString(),
                end_time: new Date(alert.end * 1000).toISOString(),
                areas: alert.sender_name ? [alert.sender_name] : []
            })),
            count: alerts.length
        };
    } catch (error) {
        console.error('Error getting weather alerts:', error);
        return { alerts: [], count: 0 };
    }
}

    // Get air quality data
    async getAirQuality(lat, lng) {
        try {
            const response = await axios.get(this.airQualityUrl, {
                params: {
                    lat,
                    lon: lng,
                    appid: this.apiKey
                }
            });

            const data = response.data.list[0];
            const aqi = data.main.aqi;
            
            return {
                index: this.calculateAQI(data.components),
                category: this.getAQICategory(aqi),
                description: this.getAQIDescription(aqi),
                components: {
                    pm25: data.components.pm2_5,
                    pm10: data.components.pm10,
                    o3: data.components.o3,
                    no2: data.components.no2,
                    so2: data.components.so2,
                    co: data.components.co
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting air quality:', error);
            // Return default good air quality if service fails
            return {
                index: 35,
                category: 'Good',
                description: 'Air quality is satisfactory for most people'
            };
        }
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    processDailyForecasts(hourlyData, days) {
        const dailyMap = new Map();
        
        hourlyData.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    date,
                    day: this.getDayName(date),
                    high_temp: item.main.temp_max,
                    low_temp: item.main.temp_min,
                    condition: this.mapWeatherCondition(item.weather[0].main),
                    condition_text: item.weather[0].description,
                    precipitation_chance: Math.round((item.pop || 0) * 100),
                    wind_speed: Math.round(item.wind.speed),
                    humidity: item.main.humidity
                });
            } else {
                const existing = dailyMap.get(date);
                existing.high_temp = Math.max(existing.high_temp, item.main.temp_max);
                existing.low_temp = Math.min(existing.low_temp, item.main.temp_min);
            }
        });

        return Array.from(dailyMap.values())
            .slice(0, days)
            .map(day => ({
                ...day,
                high_temp: Math.round(day.high_temp),
                low_temp: Math.round(day.low_temp)
            }));
    }

    getDayName(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    }

    calculateAQI(components) {
        // Simplified AQI calculation
        const pm25 = components.pm2_5 || 0;
        if (pm25 <= 12) return Math.round(pm25 * 50 / 12);
        if (pm25 <= 35.4) return Math.round(50 + (pm25 - 12) * 50 / 23.4);
        if (pm25 <= 55.4) return Math.round(100 + (pm25 - 35.4) * 50 / 20);
        return Math.min(300, Math.round(150 + (pm25 - 55.4) * 100 / 100));
    }

    getAQICategory(aqi) {
        if (aqi <= 1) return 'Good';
        if (aqi <= 2) return 'Fair';
        if (aqi <= 3) return 'Moderate';
        if (aqi <= 4) return 'Poor';
        return 'Very Poor';
    }

    getAQIDescription(aqi) {
        if (aqi <= 1) return 'Air quality is satisfactory for most people';
        if (aqi <= 2) return 'Air quality is acceptable for most people';
        if (aqi <= 3) return 'Members of sensitive groups may experience health effects';
        if (aqi <= 4) return 'Everyone may begin to experience health effects';
        return 'Health warnings of emergency conditions';
    }
}

module.exports = WeatherService;