import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  const envPath = resolve(__dirname, '..', '.env')
  try {
    const envContent = readFileSync(envPath, 'utf-8')
    const match = envContent.match(/DATABASE_URL=['"](.*?)['"]/)
    if (match) dbUrl = match[1]
  } catch { /* */ }
}
if (!dbUrl) {
  console.error('No DATABASE_URL found.')
  process.exit(1)
}

const sql = neon(dbUrl, { fullResults: false })

async function run(label, query) {
  try {
    await sql.query(query)
    console.log(`  OK: ${label}`)
  } catch (err) {
    console.error(`  FAIL: ${label} — ${err.message}`)
    throw err
  }
}

async function main() {
  const step = process.argv[2] || 'all'
  console.log(`\nRunning migration: ${step}\n`)

  if (step === '001' || step === 'all') {
    console.log('--- 001: Rename whatsapp_notify → email_notify ---')
    try {
      await run('rename column', 'ALTER TABLE domain_meta RENAME COLUMN whatsapp_notify TO email_notify')
    } catch {
      console.log('  (may already be renamed, continuing...)')
    }
  }

  if (step === '002' || step === 'all') {
    console.log('--- 002: Progress table — add domain_url + fix constraint ---')
    await run('add domain_url column', 'ALTER TABLE domain_progress ADD COLUMN IF NOT EXISTS domain_url TEXT')
    try {
      await run('drop old constraint', 'ALTER TABLE domain_progress DROP CONSTRAINT IF EXISTS domain_progress_user_id_domain_name_key')
    } catch {
      console.log('  (old constraint may not exist)')
    }
    try {
      await run('add new constraint', 'ALTER TABLE domain_progress ADD CONSTRAINT domain_progress_user_id_domain_url_key UNIQUE (user_id, domain_url)')
    } catch {
      console.log('  (constraint may already exist)')
    }
  }

  if (step === '003' || step === 'all') {
    console.log('--- 003: Fix unique constraints ---')
    try {
      await run('drop old categories constraint', 'ALTER TABLE custom_categories DROP CONSTRAINT IF EXISTS custom_categories_name_owner_key')
    } catch { /* */ }
    try {
      await run('add name-only unique', 'ALTER TABLE custom_categories ADD CONSTRAINT custom_categories_name_key UNIQUE (name)')
    } catch {
      console.log('  (constraint may already exist)')
    }
    try {
      await run('drop old domains constraint', 'ALTER TABLE custom_domains DROP CONSTRAINT IF EXISTS custom_domains_url_owner_key')
    } catch { /* */ }
    try {
      await run('add url-only unique', 'ALTER TABLE custom_domains ADD CONSTRAINT custom_domains_url_key UNIQUE (url)')
    } catch {
      console.log('  (constraint may already exist)')
    }

    console.log('--- 003: Seed data ---')
    const seedSql = readFileSync(resolve(__dirname, '..', 'migrations', '003_seed_domains.sql'), 'utf-8')

    // Split on semicolons, filter actual SQL statements
    const statements = seedSql
      .split(/;\s*\n/)
      .map(s => s.replace(/^--.*$/gm, '').trim())
      .filter(s => s.toUpperCase().startsWith('INSERT'))

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      const preview = stmt.slice(0, 80).replace(/\n/g, ' ')
      await run(`statement ${i + 1}/${statements.length}: ${preview}...`, stmt)
    }
  }

  console.log('\nDone!\n')
}

main().catch((err) => {
  console.error('\nMigration failed:', err.message)
  process.exit(1)
})
