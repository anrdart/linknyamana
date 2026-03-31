import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await sql`
      SELECT id, name, url, category_name, owner, archived, created_at
      FROM custom_domains
      ORDER BY archived ASC, created_at DESC
    `

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error fetching custom domains:', err)
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (user.username !== 'staffwebdev') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { name, url, category_name } = body || {}

    if (!name || !url || !category_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalizedUrl = /^https?:\/\//i.test(url) ? url.trim() : `https://${url.trim()}`

    try {
      const result = await sql`
        INSERT INTO custom_domains (name, url, category_name, owner)
        VALUES (${name.trim()}, ${normalizedUrl}, ${category_name.trim()}, 'staffwebdev')
        RETURNING id
      `
      const id = result?.[0]?.id
      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e: any) {
      const msg = e?.message ?? ''
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return new Response(JSON.stringify({ error: 'Domain sudah ada' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw e
    }
  } catch (err) {
    console.error('Error creating custom domain:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (user.username !== 'staffwebdev') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { id, name, url, category_name, archived } = body || {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalizedUrl = url ? (/^https?:\/\//i.test(url) ? url.trim() : `https://${url.trim()}`) : ''

    const safeName = name !== undefined ? name.trim() : null
    const safeUrl = normalizedUrl || null
    const safeCategory = category_name !== undefined ? category_name.trim() : null
    const hasArchived = archived !== undefined

    if (!safeName && !safeUrl && !safeCategory && !hasArchived) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = await sql`
      UPDATE custom_domains
      SET name = COALESCE(${safeName}, name),
          url = COALESCE(${safeUrl}, url),
          category_name = COALESCE(${safeCategory}, category_name),
          archived = CASE WHEN ${hasArchived} THEN ${archived === true} ELSE archived END
      WHERE id = ${id}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Domain not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error updating custom domain:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (user.username !== 'staffwebdev') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { id } = body || {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = await sql`DELETE FROM custom_domains WHERE id = ${id} RETURNING id`

    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Domain not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error deleting custom domain:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
