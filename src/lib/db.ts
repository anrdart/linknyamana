import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

export interface DomainProgress {
  domain_name: string
  completed_tasks: number[]
  updated_at: string
}

export function getDb(databaseUrl?: string): NeonQueryFunction<false, false> {
  const url = databaseUrl || import.meta.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  return neon(url)
}
