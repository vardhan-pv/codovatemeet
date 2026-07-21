import { Pool } from 'pg'

let connectionString = process.env.DATABASE_URL
if (connectionString) {
  // Safely strip sslmode from the query string using URL parsing
  try {
    const url = new URL(connectionString)
    url.searchParams.delete('sslmode')
    connectionString = url.toString()
  } catch {
    // Fallback: strip sslmode with regex if URL parsing fails (e.g., non-standard format)
    connectionString = connectionString
      .replace(/([?&])sslmode=[^&]*/g, '$1')
      .replace(/[?&]$/, '')
      .replace(/\?&/, '?')
  }
}

const pool = new Pool({
  connectionString,
  max: 5,                        // max connections in pool
  idleTimeoutMillis: 30000,      // close idle clients after 30s (less than Neon's 300s limit)
  connectionTimeoutMillis: 10000, // fail fast if can't get a connection in 10s
  ssl: { rejectUnauthorized: false }
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client:', err)
})

// Initialize DB schema
let isInitialized = false

async function initDB() {
  if (isInitialized) return
  try {
    const client = await pool.connect()
    try {
      // Create Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Add new security and billing columns to users table
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_code VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS plan VARCHAR(255) DEFAULT 'free',
        ADD COLUMN IF NOT EXISTS billing_period VARCHAR(255) DEFAULT 'monthly',
        ADD COLUMN IF NOT EXISTS ai_prompts_used INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS extra_ai_credits INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS active_workspaces INTEGER DEFAULT 1;
      `)

      // Create Security Logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS security_logs (
          id VARCHAR(255) PRIMARY KEY,
          event_type VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          ip_address VARCHAR(255) DEFAULT '127.0.0.1',
          details TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Create Meetings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS meetings (
          id VARCHAR(255) PRIMARY KEY,
          meeting_code VARCHAR(255) UNIQUE NOT NULL,
          host_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Add new columns if they don't exist for existing DBs
      await client.query(`
        ALTER TABLE meetings 
        ADD COLUMN IF NOT EXISTS room_name TEXT,
        ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'technical',
        ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;
      `)

      // Create Participants table
      await client.query(`
        CREATE TABLE IF NOT EXISTS participants (
          id VARCHAR(255) PRIMARY KEY,
          meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Create Messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(255) PRIMARY KEY,
          meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Create Meeting History table
      await client.query(`
        CREATE TABLE IF NOT EXISTS meeting_history (
          id VARCHAR(255) PRIMARY KEY,
          meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
          duration INTEGER,
          ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Create Meeting Summaries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS meeting_summaries (
          id VARCHAR(255) PRIMARY KEY,
          meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
          summary_text TEXT,
          key_points JSONB DEFAULT '[]',
          action_items JSONB DEFAULT '[]',
          decisions JSONB DEFAULT '[]',
          follow_ups JSONB DEFAULT '[]',
          provider VARCHAR(100) DEFAULT 'AI',
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      console.log('PostgreSQL database tables checked/initialized successfully.')
      isInitialized = true
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Error initializing PostgreSQL database:', err)
  }
}

export async function query(text: string, params?: any[]) {
  await initDB()
  return pool.query(text, params)
}

export default pool
