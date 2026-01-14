import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async () => {
  try {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRole) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Supabase server config missing' }) }
    }

    const supabase = createClient(url, serviceRole)

    // fetch users from auth and enrich with profiles
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers()
    if (authErr) return { statusCode: 400, body: JSON.stringify({ error: authErr.message }) }

    const ids = (authUsers?.users || []).map(u => u.id)
    let profilesMap: Record<string, any> = {}
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
      profilesMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
    }

    const result = (authUsers?.users || []).map(u => {
      const p = profilesMap[u.id]
      return {
        id: u.id,
        email: u.email,
        name: p?.name || u.user_metadata?.name || '',
        role: p?.role || u.user_metadata?.role || 'user',
        disabled: !!p?.disabled,
        created_at: u.created_at,
      }
    })

    return { statusCode: 200, body: JSON.stringify({ users: result }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'unknown' }) }
  }
}

export default handler
