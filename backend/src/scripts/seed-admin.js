import bcrypt from 'bcryptjs'
import { pool } from '../services/retrieval.js'
import dotenv from 'dotenv'
dotenv.config()

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.')
  process.exit(1)
}

const { rows: existing } = await pool.query(
  'SELECT id FROM users WHERE email = $1',
  [email.toLowerCase()]
)

if (existing.length > 0) {
  console.log(`Admin already exists: ${email}`)
} else {
  const hash = await bcrypt.hash(password, 10)
  await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
    [email.toLowerCase(), hash, 'admin']
  )
  console.log(`Admin created: ${email}`)
}

await pool.end()
