import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/schema.js'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const isCloudDb = Boolean(
  process.env.DATABASE_URL && (
    process.env.DATABASE_URL.includes('supabase') ||
    process.env.DATABASE_URL.includes('pooler') ||
    process.env.DATABASE_URL.includes('neon') ||
    process.env.DATABASE_URL.includes('rds') ||
    process.env.DATABASE_URL.includes('render') ||
    process.env.DATABASE_URL.includes('sslmode=require')
  )
)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR]:', err.message)
})

export const db = drizzle(pool, { schema })
export default db
