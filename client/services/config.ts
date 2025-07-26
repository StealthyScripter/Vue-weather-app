const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000'
    : 'https://your-production-api.com',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;