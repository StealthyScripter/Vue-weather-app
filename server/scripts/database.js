require('dotenv').config()
const pgp = require('pg-promise')()

const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

const db = pgp(connectionString)

// Test connection
async function testConnection() {
  try {
    await db.one('SELECT NOW() as current_time')
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

testConnection()

module.exports = { db, testConnection }