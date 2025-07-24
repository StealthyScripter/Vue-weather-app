const axios = require('axios');

class LocationService {
    constructor() {
        this.geocodingApiKey = process.env.MAPS_API_KEY;
        this.geocodingBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        this.placesBaseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    }

    // Get user's current location (would typically come from frontend)
    static async getCurrentLocation(lat, lng) {
        try {
            // In a real app, this would get location from user's device
            // For now, we'll reverse geocode the provided coordinates
            const locationService = new LocationService();
            const address = await locationService.reverseGeocode(lat, lng);
            
            return {
                latitude: lat,
                longitude: lng,
                accuracy: 10,
                city: address.components.city || 'Unknown',
                state: address.components.state || 'Unknown',
                country: address.components.country || 'Unknown',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting current location:', error);
            throw error;
        }
    }

    // Search locations by query
    async searchLocations(query, limit = 5) {
        try {
            const response = await axios.get(this.placesBaseUrl, {
                params: {
                    query,
                    key: this.geocodingApiKey,
                    fields: 'place_id,name,geometry,formatted_address,types'
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Geocoding API error: ${response.data.status}`);
            }

            const results = response.data.results.slice(0, limit).map((place, index) => ({
                id: `loc_${index + 1}`,
                name: place.name || place.formatted_address,
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                type: place.types[0] || 'location',
                formatted_address: place.formatted_address
            }));

            return {
                results,
                total: results.length
            };
        } catch (error) {
            console.error('Error searching locations:', error);
            throw error;
        }
    }

    // Convert address to coordinates
    async geocodeAddress(address) {
        try {
            const response = await axios.get(this.geocodingBaseUrl, {
                params: {
                    address,
                    key: this.geocodingApiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Geocoding API error: ${response.data.status}`);
            }

            const result = response.data.results[0];
            const location = result.geometry.location;

            return {
                latitude: location.lat,
                longitude: location.lng,
                formatted_address: result.formatted_address,
                components: this.parseAddressComponents(result.address_components)
            };
        } catch (error) {
            console.error('Error geocoding address:', error);
            throw error;
        }
    }

    // Convert coordinates to address
    async reverseGeocode(lat, lng) {
        try {
            const response = await axios.get(this.geocodingBaseUrl, {
                params: {
                    latlng: `${lat},${lng}`,
                    key: this.geocodingApiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Reverse geocoding API error: ${response.data.status}`);
            }

            const result = response.data.results[0];
            
            return {
                latitude: lat,
                longitude: lng,
                formatted_address: result.formatted_address,
                components: this.parseAddressComponents(result.address_components)
            };
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            throw error;
        }
    }

    // Helper method to parse address components
    parseAddressComponents(components) {
        const parsed = {};
        
        components.forEach(component => {
            if (component.types.includes('street_number')) {
                parsed.street_number = component.long_name;
            } else if (component.types.includes('route')) {
                parsed.street_name = component.long_name;
            } else if (component.types.includes('locality')) {
                parsed.city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
                parsed.state = component.short_name;
            } else if (component.types.includes('postal_code')) {
                parsed.postal_code = component.long_name;
            } else if (component.types.includes('country')) {
                parsed.country = component.short_name;
            }
        });

        return parsed;
    }
}

module.exports = LocationService;