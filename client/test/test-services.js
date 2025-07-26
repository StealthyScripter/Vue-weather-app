// Tests ALL endpoints with success and error cases, logs all received JSON

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let accessToken = null;
let refreshToken = null;

class ApiTester {
  async request(method, endpoint, data = null, headers = {}) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      if (accessToken && !headers.skipAuth) {
        defaultHeaders.Authorization = `Bearer ${accessToken}`;
      }

      const config = {
        method,
        headers: defaultHeaders,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);
      const result = await response.json();
      
      return {
        status: response.status,
        data: result
      };
    } catch (error) {
      return {
        status: 0,
        data: { error: error.message }
      };
    }
  }

  logResponse(testName, response) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${testName}`);
    console.log(`STATUS: ${response.status}`);
    console.log(`JSON RESPONSE:`);
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`${'='.repeat(80)}`);
  }
}

const tester = new ApiTester();

async function runAllTests() {
  console.log('WeatherRoute AI - COMPREHENSIVE API TEST');
  console.log('Logging ALL received JSON responses');
  console.log(`Started: ${new Date().toISOString()}`);

  // AUTHENTICATION TESTS
  
  // Test 1: Valid login
  let response = await tester.request('POST', '/api/auth/login', {
    email: 'demo@weather.ai',
    password: 'demo1234'
  });
  tester.logResponse('AUTH - Valid Login', response);
  
  if (response.data.success && response.data.data) {
    accessToken = response.data.data.tokens?.access_token;
    refreshToken = response.data.data.tokens?.refresh_token;
  }

  // Test 2: Invalid password (too short)
  response = await tester.request('POST', '/api/auth/login', {
    email: 'demo@weather.ai',
    password: 'demo123'
  });
  tester.logResponse('AUTH - Invalid Password (Too Short)', response);

  // Test 3: Invalid email format
  response = await tester.request('POST', '/api/auth/login', {
    email: 'invalid-email',
    password: 'demo1234'
  });
  tester.logResponse('AUTH - Invalid Email Format', response);

  // Test 4: Missing fields
  response = await tester.request('POST', '/api/auth/login', {
    email: 'demo@weather.ai'
  });
  tester.logResponse('AUTH - Missing Password Field', response);

  // Test 5: Empty request body
  response = await tester.request('POST', '/api/auth/login', {});
  tester.logResponse('AUTH - Empty Request Body', response);

  // Test 6: Wrong credentials
  response = await tester.request('POST', '/api/auth/login', {
    email: 'wrong@email.com',
    password: 'wrongpassword123'
  });
  tester.logResponse('AUTH - Wrong Credentials', response);

  // Test 7: Valid signup
  response = await tester.request('POST', '/api/auth/signup', {
    full_name: 'Test User',
    email: 'newuser@test.com',
    password: 'newpass123',
    confirm_password: 'newpass123'
  });
  tester.logResponse('AUTH - Valid Signup', response);

  // Test 8: Signup password mismatch
  response = await tester.request('POST', '/api/auth/signup', {
    full_name: 'Test User',
    email: 'test2@test.com',
    password: 'password123',
    confirm_password: 'different123'
  });
  tester.logResponse('AUTH - Signup Password Mismatch', response);

  // Test 9: Signup existing email
  response = await tester.request('POST', '/api/auth/signup', {
    full_name: 'Another User',
    email: 'demo@weather.ai',
    password: 'password123',
    confirm_password: 'password123'
  });
  tester.logResponse('AUTH - Signup Existing Email', response);

  // Test 10: Signup weak password
  response = await tester.request('POST', '/api/auth/signup', {
    full_name: 'Test User',
    email: 'weak@test.com',
    password: 'weak',
    confirm_password: 'weak'
  });
  tester.logResponse('AUTH - Signup Weak Password', response);

  // Test 11: Forgot password valid
  response = await tester.request('POST', '/api/auth/forgot-password', {
    email: 'demo@weather.ai'
  });
  tester.logResponse('AUTH - Forgot Password Valid', response);

  // Test 12: Forgot password invalid email
  response = await tester.request('POST', '/api/auth/forgot-password', {
    email: 'nonexistent@email.com'
  });
  tester.logResponse('AUTH - Forgot Password Invalid Email', response);

  // Test 13: Refresh token valid
  if (refreshToken) {
    response = await tester.request('POST', '/api/auth/refresh', {
      refresh_token: refreshToken
    });
    tester.logResponse('AUTH - Refresh Token Valid', response);
    
    if (response.data.success && response.data.data) {
      accessToken = response.data.data.access_token;
    }
  }

  // Test 14: Refresh token invalid
  response = await tester.request('POST', '/api/auth/refresh', {
    refresh_token: 'invalid_token_123'
  });
  tester.logResponse('AUTH - Refresh Token Invalid', response);

  // Test 15: Reset password (will fail without valid token)
  response = await tester.request('POST', '/api/auth/reset-password', {
    token: 'invalid_reset_token',
    new_password: 'newpassword123',
    confirm_password: 'newpassword123'
  });
  tester.logResponse('AUTH - Reset Password Invalid Token', response);

  // WEATHER TESTS

  // Test 16: Current weather valid
  response = await tester.request('GET', '/api/weather/current?lat=35.3021&lng=-81.3400');
  tester.logResponse('WEATHER - Current Valid Coordinates', response);

  // Test 17: Current weather invalid coordinates
  response = await tester.request('GET', '/api/weather/current?lat=999&lng=999');
  tester.logResponse('WEATHER - Current Invalid Coordinates', response);

  // Test 18: Current weather missing parameters
  response = await tester.request('GET', '/api/weather/current');
  tester.logResponse('WEATHER - Current Missing Parameters', response);

  // Test 19: Forecast valid
  response = await tester.request('GET', '/api/weather/forecast?lat=35.3021&lng=-81.3400&days=5');
  tester.logResponse('WEATHER - Forecast Valid', response);

  // Test 20: Forecast invalid days
  response = await tester.request('GET', '/api/weather/forecast?lat=35.3021&lng=-81.3400&days=20');
  tester.logResponse('WEATHER - Forecast Invalid Days (Too Many)', response);

  // Test 21: Hourly forecast valid
  response = await tester.request('GET', '/api/weather/hourly?lat=35.3021&lng=-81.3400&hours=24');
  tester.logResponse('WEATHER - Hourly Valid', response);

  // Test 22: Hourly forecast invalid hours
  response = await tester.request('GET', '/api/weather/hourly?lat=35.3021&lng=-81.3400&hours=100');
  tester.logResponse('WEATHER - Hourly Invalid Hours (Too Many)', response);

  // Test 23: Weather alerts valid
  response = await tester.request('GET', '/api/weather/alerts?lat=35.3021&lng=-81.3400');
  tester.logResponse('WEATHER - Alerts Valid', response);

  // Test 24: Air quality valid
  response = await tester.request('GET', '/api/weather/air-quality?lat=35.3021&lng=-81.3400');
  tester.logResponse('WEATHER - Air Quality Valid', response);

  // LOCATION TESTS

  // Test 25: Current location valid
  response = await tester.request('GET', '/api/location/current?lat=35.3021&lng=-81.3400');
  tester.logResponse('LOCATION - Current Valid', response);

  // Test 26: Current location default
  response = await tester.request('GET', '/api/location/current');
  tester.logResponse('LOCATION - Current Default', response);

  // Test 27: Location search valid
  response = await tester.request('GET', '/api/location/search?q=Durham%20NC&limit=5');
  tester.logResponse('LOCATION - Search Valid', response);

  // Test 28: Location search empty query
  response = await tester.request('GET', '/api/location/search?q=&limit=5');
  tester.logResponse('LOCATION - Search Empty Query', response);

  // Test 29: Location search no results
  response = await tester.request('GET', '/api/location/search?q=NonexistentCityName12345&limit=5');
  tester.logResponse('LOCATION - Search No Results', response);

  // Test 30: Geocode valid
  response = await tester.request('GET', '/api/location/geocode?address=123%20Main%20St%2C%20Durham%2C%20NC');
  tester.logResponse('LOCATION - Geocode Valid', response);

  // Test 31: Geocode invalid address
  response = await tester.request('GET', '/api/location/geocode?address=InvalidAddress123456');
  tester.logResponse('LOCATION - Geocode Invalid Address', response);

  // Test 32: Reverse geocode valid
  response = await tester.request('GET', '/api/location/reverse?lat=35.9940&lng=-78.8986');
  tester.logResponse('LOCATION - Reverse Geocode Valid', response);

  // Test 33: Reverse geocode invalid coordinates
  response = await tester.request('GET', '/api/location/reverse?lat=999&lng=999');
  tester.logResponse('LOCATION - Reverse Geocode Invalid', response);

  // ROUTE TESTS

  // Test 34: Route plan valid
  response = await tester.request('POST', '/api/routes/plan', {
    origin: { latitude: 35.3021, longitude: -81.3400 },
    destination: { latitude: 35.9940, longitude: -78.8986 },
    departure_time: new Date().toISOString(),
    preferences: { avoid_tolls: false, avoid_highways: false }
  });
  tester.logResponse('ROUTE - Plan Valid', response);
  
  let routeId = null;
  if (response.data.success && response.data.data) {
    routeId = response.data.data.route_id;
  }

  // Test 35: Route plan missing origin
  response = await tester.request('POST', '/api/routes/plan', {
    destination: { latitude: 35.9940, longitude: -78.8986 },
    departure_time: new Date().toISOString()
  });
  tester.logResponse('ROUTE - Plan Missing Origin', response);

  // Test 36: Route plan invalid coordinates
  response = await tester.request('POST', '/api/routes/plan', {
    origin: { latitude: 999, longitude: 999 },
    destination: { latitude: 35.9940, longitude: -78.8986 },
    departure_time: new Date().toISOString()
  });
  tester.logResponse('ROUTE - Plan Invalid Coordinates', response);

  // Test 37: Route directions
  if (routeId) {
    response = await tester.request('GET', `/api/routes/directions?route_id=${routeId}`);
    tester.logResponse('ROUTE - Directions Valid Route ID', response);
  }

  // Test 38: Route directions invalid ID
  response = await tester.request('GET', '/api/routes/directions?route_id=invalid_route_123');
  tester.logResponse('ROUTE - Directions Invalid Route ID', response);

  // Test 39: Route optimize
  if (routeId) {
    response = await tester.request('POST', '/api/routes/optimize', {
      route_id: routeId,
      optimization_criteria: { avoid_rain: true, max_precipitation: 50 }
    });
    tester.logResponse('ROUTE - Optimize Valid', response);
  }

  // Test 40: Route optimize invalid data
  response = await tester.request('POST', '/api/routes/optimize', {
    route_id: 'invalid_route',
    optimization_criteria: { invalid_param: true }
  });
  tester.logResponse('ROUTE - Optimize Invalid', response);

  // Test 41: Route traffic
  if (routeId) {
    response = await tester.request('GET', `/api/routes/traffic?route_id=${routeId}`);
    tester.logResponse('ROUTE - Traffic Valid Route ID', response);
  }

  // Test 42: Route traffic invalid ID
  response = await tester.request('GET', '/api/routes/traffic?route_id=invalid_route_123');
  tester.logResponse('ROUTE - Traffic Invalid Route ID', response);

  // ROUTE WEATHER TESTS

  // Test 43: Route weather predict valid
  response = await tester.request('POST', '/api/route-weather/predict', {
    origin: { latitude: 35.3021, longitude: -81.3400 },
    destination: { latitude: 35.9940, longitude: -78.8986 },
    departure_time: new Date().toISOString(),
    preferences: {}
  });
  tester.logResponse('ROUTE WEATHER - Predict Valid', response);
  
  let predictionId = null;
  if (response.data.success && response.data.data) {
    predictionId = response.data.data.prediction_id;
  }

  // Test 44: Route weather predict invalid coordinates
  response = await tester.request('POST', '/api/route-weather/predict', {
    origin: { latitude: 999, longitude: 999 },
    destination: { latitude: 35.9940, longitude: -78.8986 },
    departure_time: new Date().toISOString()
  });
  tester.logResponse('ROUTE WEATHER - Predict Invalid Coordinates', response);

  // Test 45: Route weather save (requires auth)
  if (predictionId && accessToken) {
    response = await tester.request('POST', '/api/route-weather/save', {
      prediction_id: predictionId,
      name: 'Test Route Prediction',
      notifications: { weather_alerts: true }
    });
    tester.logResponse('ROUTE WEATHER - Save Valid (Authenticated)', response);
  }

  // Test 46: Route weather save without auth
  if (predictionId) {
    response = await tester.request('POST', '/api/route-weather/save', {
      prediction_id: predictionId,
      name: 'Test Route Prediction',
      notifications: { weather_alerts: true }
    }, { skipAuth: true });
    tester.logResponse('ROUTE WEATHER - Save Without Auth', response);
  }

  // Test 47: Route weather save invalid prediction ID
  if (accessToken) {
    response = await tester.request('POST', '/api/route-weather/save', {
      prediction_id: 'invalid_prediction_123',
      name: 'Test Route',
      notifications: { weather_alerts: true }
    });
    tester.logResponse('ROUTE WEATHER - Save Invalid Prediction ID', response);
  }

  // Test 48: Get saved predictions
  if (accessToken) {
    response = await tester.request('GET', '/api/route-weather/saved?page=1&limit=10');
    tester.logResponse('ROUTE WEATHER - Get Saved (Authenticated)', response);
  }

  // Test 49: Get saved predictions without auth
  response = await tester.request('GET', '/api/route-weather/saved?page=1&limit=10', null, { skipAuth: true });
  tester.logResponse('ROUTE WEATHER - Get Saved Without Auth', response);

  // USER TESTS

  // Test 50: User profile with auth
  if (accessToken) {
    response = await tester.request('GET', '/api/user/profile');
    tester.logResponse('USER - Profile Valid Auth', response);
  }

  // Test 51: User profile without auth
  response = await tester.request('GET', '/api/user/profile', null, { skipAuth: true });
  tester.logResponse('USER - Profile Without Auth', response);

  // Test 52: Update user profile
  if (accessToken) {
    response = await tester.request('PUT', '/api/user/profile', {
      full_name: 'Updated Test User',
      preferences: {
        units: { temperature: 'celsius', distance: 'kilometers' }
      }
    });
    tester.logResponse('USER - Update Profile Valid', response);
  }

  // Test 53: Update profile invalid data
  if (accessToken) {
    response = await tester.request('PUT', '/api/user/profile', {
      invalid_field: 'invalid_value'
    });
    tester.logResponse('USER - Update Profile Invalid Data', response);
  }

  // Test 54: Get preferences
  if (accessToken) {
    response = await tester.request('GET', '/api/user/preferences');
    tester.logResponse('USER - Get Preferences Valid', response);
  }

  // Test 55: Update preferences
  if (accessToken) {
    response = await tester.request('PUT', '/api/user/preferences', {
      preferences: {
        notifications: { weather_alerts: true, severe_weather: false }
      }
    });
    tester.logResponse('USER - Update Preferences Valid', response);
  }

  // Test 56: Route history
  if (accessToken) {
    response = await tester.request('GET', '/api/user/routes/history?page=1&limit=10');
    tester.logResponse('USER - Route History Valid', response);
  }

  // Test 57: Favorites list
  if (accessToken) {
    response = await tester.request('GET', '/api/user/favorites');
    tester.logResponse('USER - Favorites List Valid', response);
  }

  // Test 58: Add favorite
  if (accessToken) {
    response = await tester.request('POST', '/api/user/favorites', {
      name: 'Test Location',
      address: '123 Test St, Test City, NC',
      latitude: 35.5,
      longitude: -80.5
    });
    tester.logResponse('USER - Add Favorite Valid', response);
    
    // Test 59: Delete favorite (if add succeeded)
    if (response.data.success && response.data.data && response.data.data.id) {
      const favoriteId = response.data.data.id;
      response = await tester.request('DELETE', `/api/user/favorites/${favoriteId}`);
      tester.logResponse('USER - Delete Favorite Valid', response);
    }
  }

  // Test 60: Add favorite without auth
  response = await tester.request('POST', '/api/user/favorites', {
    name: 'Test Location',
    latitude: 35.5,
    longitude: -80.5
  }, { skipAuth: true });
  tester.logResponse('USER - Add Favorite Without Auth', response);

  // Test 61: Add favorite invalid data
  if (accessToken) {
    response = await tester.request('POST', '/api/user/favorites', {
      name: 'Test Location'
      // Missing required latitude/longitude
    });
    tester.logResponse('USER - Add Favorite Invalid Data', response);
  }

  // Test 62: Delete non-existent favorite
  if (accessToken) {
    response = await tester.request('DELETE', '/api/user/favorites/999999');
    tester.logResponse('USER - Delete Non-existent Favorite', response);
  }

  // LOGOUT TEST

  // Test 63: Logout valid
  if (refreshToken) {
    response = await tester.request('POST', '/api/auth/logout', {
      refresh_token: refreshToken
    });
    tester.logResponse('AUTH - Logout Valid', response);
  }

  // Test 64: Logout invalid token
  response = await tester.request('POST', '/api/auth/logout', {
    refresh_token: 'invalid_refresh_token_123'
  });
  tester.logResponse('AUTH - Logout Invalid Token', response);

  // Test 65: Logout missing token
  response = await tester.request('POST', '/api/auth/logout', {});
  tester.logResponse('AUTH - Logout Missing Token', response);

  // HEALTH CHECK TESTS (if implemented)

  // Test 66: Health check
  response = await tester.request('GET', '/health');
  tester.logResponse('HEALTH - Basic Health Check', response);

  // Test 67: API health check
  response = await tester.request('GET', '/api/health');
  tester.logResponse('HEALTH - API Health Check', response);

  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE TEST COMPLETED');
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log('All received JSON responses logged above');
  console.log('='.repeat(80));
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };