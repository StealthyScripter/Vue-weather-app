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
}

module.exports = AuthUtils