import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
    const { email, password } = JSON.parse(event.body || '{}')
    if (!email || !password) return { statusCode: 400, body: 'email and password required' }

    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRole) return { statusCode: 500, body: 'Supabase server config missing' }

    const supabase = createClient(url, serviceRole)
    const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).single()
    if (!prof?.id) return { statusCode: 404, body: 'user id not found in profiles' }

    const res = await supabase.auth.admin.updateUserById(prof.id, { password })
    if (res.error) return { statusCode: 400, body: JSON.stringify({ error: res.error.message }) }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'unknown' }) }
  }
}

export default handler
