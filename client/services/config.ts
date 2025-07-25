const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000' // Development server
    : 'https://your-production-api.com', // Production server
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;