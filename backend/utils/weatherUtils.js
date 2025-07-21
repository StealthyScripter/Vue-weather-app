function mapAlertSeverity(tags) {
    if (!tags || !Array.isArray(tags)) return 'moderate';
    if (tags.includes('Extreme')) return 'extreme';
    if (tags.includes('Severe')) return 'severe';
    if (tags.includes('Moderate')) return 'moderate';
    return 'minor';
};


function mapWeatherCondition(condition) {
    const conditionMap = {
        'Clear': 'sunny',
        'Clouds': 'cloudy',
        'Rain': 'rain',
        'Drizzle': 'light_rain',
        'Thunderstorm': 'thunderstorm',
        'Snow': 'snow',
        'Mist': 'foggy',
        'Fog': 'foggy'
    };
    return conditionMap[condition] || 'partly_cloudy';
}

module.exports = {
    mapAlertSeverity,
    mapWeatherCondition
};