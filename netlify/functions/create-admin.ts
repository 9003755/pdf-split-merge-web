import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const { email, password, name = '管理员' } = JSON.parse(event.body || '{}')
    if (!email || !password) {
      return { statusCode: 400, body: 'email and password required' }
    }

    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRole) {
      return { statusCode: 500, body: 'Supabase server config missing' }
    }

    const supabase = createClient(url, serviceRole)

    const createRes = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' },
    })
    if (createRes.error) {
      return { statusCode: 400, body: JSON.stringify({ error: createRes.error.message }) }
    }

    const user = createRes.data.user
    if (!user) {
      return { statusCode: 500, body: 'User not returned' }
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      email,
      name,
      role: 'admin',
      disabled: false,
    })

    return { statusCode: 200, body: JSON.stringify({ ok: true, id: user.id }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'unknown' }) }
  }
}

export default handler
