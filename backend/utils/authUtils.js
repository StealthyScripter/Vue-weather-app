const bcrypt = require('bcrypt')

const SALT_ROUNDS = 12 // Higher = more secure but slower

class AuthUtils {
    // Hash a password
    static async hashPassword(plainPassword) {
        return await bcrypt.hash(plainPassword, SALT_ROUNDS)
    }

    // Verify password against hash
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword)
    }

    static async addToTokenBlacklist(token) {
        // Store in Redis with expiration matching token expiry
        // Or store in database blacklist table
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);
        
        // Redis implementation:
        // await redisClient.setex(`blacklist_${token}`, Math.floor((expiresAt - Date.now()) / 1000), 'true');
        
        // Database implementation:
        // await db.none('INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2)', [token, expiresAt]);
    }

    // Helper function to implement
    static async sendPasswordResetEmail(email, token) {
        // Implement email sending using nodemailer, SendGrid, etc.
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        // Send email with resetUrl
    }
}


module.exports = AuthUtils