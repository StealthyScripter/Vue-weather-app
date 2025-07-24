const { db } = require('../scripts/database');

class UserService {
    
    // Create a new user
    static async createUser(fullName, email, hashedPassword) {
        try {
            const query = `
                INSERT INTO users (full_name, email, password_hash, created_at) 
                VALUES ($1, $2, $3, NOW()) 
                RETURNING id, full_name, email, created_at
            `;
            const values = [fullName, email, hashedPassword];
            
            const result = await db.one(query, values);
            return result;
            
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Find user by email
    static async findUserByEmail(email) {
        try {
            const query = `
                SELECT id, full_name, email, password_hash as password, created_at 
                FROM users 
                WHERE email = $1 AND deleted_at IS NULL
            `;
            
            const result = await db.oneOrNone(query, [email]);
            return result;
            
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Find user by ID
    static async findUserById(userId) {
        try {
            const query = `
                SELECT id, full_name, email, created_at 
                FROM users 
                WHERE id = $1 AND deleted_at IS NULL
            `;
            
            const result = await db.oneOrNone(query, [userId]);
            return result;
            
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    // Update user profile
    static async updateUser(userId, updates) {
        try {
            const setClause = [];
            const values = [];
            let paramCounter = 1;

            // Build dynamic SET clause
            if (updates.full_name) {
                setClause.push(`full_name = $${paramCounter}`);
                values.push(updates.full_name);
                paramCounter++;
            }

            if (updates.email) {
                setClause.push(`email = $${paramCounter}`);
                values.push(updates.email);
                paramCounter++;
            }

            if (updates.password) {
                setClause.push(`password_hash = $${paramCounter}`);
                values.push(updates.password);
                paramCounter++;
            }

            if (setClause.length === 0) {
                throw new Error('No fields to update');
            }

            // Add updated_at timestamp
            setClause.push(`updated_at = NOW()`);
            
            // Add user ID for WHERE clause
            values.push(userId);

            const query = `
                UPDATE users 
                SET ${setClause.join(', ')}
                WHERE id = $${paramCounter} AND deleted_at IS NULL
                RETURNING id, full_name, email, created_at, updated_at
            `;

            const result = await db.one(query, values);
            return result;
            
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Update user preferences
    static async updateUserPreferences(userId, preferences) {
        try {
            const query = `
                INSERT INTO user_preferences (user_id, preferences, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    preferences = $2,
                    updated_at = NOW()
                RETURNING user_id, preferences, updated_at
            `;
            
            const result = await db.one(query, [userId, JSON.stringify(preferences)]);
            return result;
            
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    // Get user preferences
    static async getUserPreferences(userId) {
        try {
            const query = `
                SELECT preferences, updated_at 
                FROM user_preferences 
                WHERE user_id = $1
            `;
            
            const result = await db.oneOrNone(query, [userId]);
            
            if (result) {
                return {
                    user_id: userId,
                    preferences: result.preferences,
                    updated_at: result.updated_at
                };
            }
            
            // Return default preferences if none exist
            return {
                user_id: userId,
                preferences: {
                    units: {
                        temperature: 'fahrenheit',
                        distance: 'miles',
                        speed: 'mph',
                        pressure: 'inches'
                    },
                    display: {
                        time_format: '12h',
                        date_format: 'MM/dd/yyyy',
                        theme: 'light'
                    },
                    notifications: {
                        weather_alerts: true,
                        severe_weather: true,
                        traffic_alerts: true,
                        departure_reminders: true,
                        push_notifications: true,
                        email_notifications: false
                    },
                    route_defaults: {
                        route_type: 'fastest',
                        avoid_tolls: false,
                        avoid_highways: false,
                        optimize_for_weather: true
                    }
                },
                updated_at: new Date()
            };
            
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    // Delete user (soft delete)
    static async deleteUser(userId) {
        try {
            const query = `
                UPDATE users 
                SET deleted_at = NOW()
                WHERE id = $1
                RETURNING id
            `;
            
            const result = await db.oneOrNone(query, [userId]);
            return result;
            
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Add user to favorites
    static async addFavorite(userId, name, address, latitude, longitude) {
        try {
            const query = `
                INSERT INTO favorites (user_id, name, address, latitude, longitude)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, user_id, name, address, latitude, longitude, created_at
            `;
            
            const result = await db.one(query, [userId, name, address, latitude, longitude]);
            return result;
            
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    }

    // Get user favorites
    static async getUserFavorites(userId) {
        try {
            const query = `
                SELECT id, name, address, latitude, longitude, created_at
                FROM favorites 
                WHERE user_id = $1
                ORDER BY created_at DESC
            `;
            
            const results = await db.any(query, [userId]);
            return results;
            
        } catch (error) {
            console.error('Error getting user favorites:', error);
            throw error;
        }
    }

    // Delete favorite
    static async deleteFavorite(userId, favoriteId) {
        try {
            const query = `
                DELETE FROM favorites 
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `;
            
            const result = await db.oneOrNone(query, [favoriteId, userId]);
            return result;
            
        } catch (error) {
            console.error('Error deleting favorite:', error);
            throw error;
        }
    }

    // Save route to history
    static async saveRouteHistory(userId, routeData) {
        try {
            const query = `
                INSERT INTO route_history (
                    user_id, route_id, origin_name, destination_name,
                    origin_lat, origin_lng, destination_lat, destination_lng,
                    departure_time, total_distance, total_duration,
                    weather_summary, route_data
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id, created_at
            `;
            
            const values = [
                userId,
                routeData.route_id,
                routeData.origin_name,
                routeData.destination_name,
                routeData.origin_lat,
                routeData.origin_lng,
                routeData.destination_lat,
                routeData.destination_lng,
                routeData.departure_time,
                routeData.total_distance,
                routeData.total_duration,
                routeData.weather_summary,
                JSON.stringify(routeData)
            ];
            
            const result = await db.one(query, values);
            return result;
            
        } catch (error) {
            console.error('Error saving route history:', error);
            throw error;
        }
    }

    // Get user route history
    static async getUserRouteHistory(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const query = `
                SELECT 
                    id, route_id, origin_name, destination_name,
                    departure_time, total_distance, total_duration,
                    weather_summary, created_at
                FROM route_history 
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            `;
            
            const countQuery = `
                SELECT COUNT(*) as total
                FROM route_history 
                WHERE user_id = $1
            `;
            
            const [routes, countResult] = await Promise.all([
                db.any(query, [userId, limit, offset]),
                db.one(countQuery, [userId])
            ]);
            
            const total = parseInt(countResult.total);
            
            return {
                routes,
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
            console.error('Error getting user route history:', error);
            throw error;
        }
    }
}

module.exports = UserService;