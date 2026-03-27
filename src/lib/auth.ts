import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface User {
  id: string
  username: string
  display_name: string
  role: string
}

const SESSION_DURATION_DAYS = 30

export async function verifyLogin(username: string, password: string): Promise<User | null> {
  const rows = await sql`
    SELECT id, username, display_name, role, password_hash
    FROM users
    WHERE username = ${username}
    LIMIT 1
  `

  if (!rows || rows.length === 0) return null

  const user = rows[0] as { id: string; username: string; display_name: string; role: string; password_hash: string }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return null

  return { id: user.id, username: user.username, display_name: user.display_name, role: user.role }
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `

  return token
}

export async function validateSession(token: string): Promise<User | null> {
  const rows = await sql`
    SELECT s.id, s.expires_at, u.id as user_id, u.username, u.display_name, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token} AND s.expires_at > NOW()
    LIMIT 1
  `

  if (!rows || rows.length === 0) return null

  const row = rows[0] as { user_id: string; username: string; display_name: string; role: string }

  return { id: row.user_id, username: row.username, display_name: row.display_name, role: row.role }
}

export async function destroySession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`
}
