import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

export interface DomainProgress {
  domain_name: string
  completed_tasks: number[]
  updated_at: string
}

let _sql: NeonQueryFunction<false, false> | null = null

export function getDb(databaseUrl?: string): NeonQueryFunction<false, false> {
  if (_sql) return _sql
  const url = databaseUrl || import.meta.env.DATABASE_URL as string
  _sql = neon(url)
  return _sql
}
