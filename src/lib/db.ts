import { neon } from '@neondatabase/serverless'

const databaseUrl = import.meta.env.DATABASE_URL as string

export const sql = neon(databaseUrl)

export interface DomainProgress {
  domain_name: string
  completed_tasks: number[]
  updated_at: string
}
