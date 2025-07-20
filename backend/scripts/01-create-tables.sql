-- Database Schema for WeatherRoute AI

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create route_history table
CREATE TABLE IF NOT EXISTS route_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    route_id VARCHAR(255) NOT NULL,
    origin_name VARCHAR(255),
    destination_name VARCHAR(255),
    origin_lat DECIMAL(10,8),
    origin_lng DECIMAL(11,8),
    destination_lat DECIMAL(10,8),
    destination_lng DECIMAL(11,8),
    departure_time TIMESTAMP WITH TIME ZONE,
    total_distance DECIMAL(10,2),
    total_duration INTEGER, -- in seconds
    weather_summary TEXT,
    route_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_predictions table
CREATE TABLE IF NOT EXISTS saved_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prediction_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    route_data JSONB NOT NULL,
    weather_data JSONB NOT NULL,
    notifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_route_history_user_id ON route_history(user_id);
CREATE INDEX IF NOT EXISTS idx_route_history_created_at ON route_history(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_predictions_user_id ON saved_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_predictions_prediction_id ON saved_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- If you need to add password column to existing users table, use this:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Insert default preferences for existing users (optional)
-- INSERT INTO user_preferences (user_id, preferences)
-- SELECT id, '{
--     "units": {
--         "temperature": "fahrenheit",
--         "distance": "miles",
--         "speed": "mph",
--         "pressure": "inches"
--     },
--     "display": {
--         "time_format": "12h",
--         "date_format": "MM/dd/yyyy",
--         "theme": "light"
--     },
--     "notifications": {
--         "weather_alerts": true,
--         "severe_weather": true,
--         "traffic_alerts": true,
--         "departure_reminders": true,
--         "push_notifications": true,
--         "email_notifications": false
--     },
--     "route_defaults": {
--         "route_type": "fastest",
--         "avoid_tolls": false,
--         "avoid_highways": false,
--         "optimize_for_weather": true
--     }
-- }'::jsonb
-- FROM users 
-- WHERE id NOT IN (SELECT user_id FROM user_preferences);

-- Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply the trigger to user_preferences table
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();