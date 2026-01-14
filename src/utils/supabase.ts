import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const ADMIN_EMAIL = '9003755@qq.com'

// 本地模式：当没有配置Supabase时使用模拟数据
const isLocalMode = !supabaseUrl || supabaseUrl === 'your_supabase_url_here'

let supabase: any = null

if (!isLocalMode) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-application-name': 'pdf-split-merge',
        },
      },
    })
  } catch (error) {
    console.warn('Supabase初始化失败，使用本地模式')
  }
} else {
  console.warn('Supabase未配置，使用本地模式')
}

// 模拟用户数据存储
let mockUser: any = null
let mockSession: any = null
const mockUsers: any[] = [
  {
    id: 'admin-1',
    email: 'admin@local',
    user_metadata: { name: '管理员', role: 'admin' },
    created_at: new Date().toISOString(),
    disabled: false,
  },
]

// 用户认证相关函数
export const auth = {
  async signUp(email: string, password: string, name: string) {
    if (isLocalMode) {
      mockUser = {
        id: 'mock-user-' + Date.now(),
        email,
        user_metadata: { name, role: 'user' },
        created_at: new Date().toISOString(),
      }
      mockSession = { user: mockUser }
      mockUsers.push({ ...mockUser, disabled: false })
      return { data: { user: mockUser, session: mockSession }, error: null }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) return { data, error }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        name,
        role: email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user',
      })
    }
    return { data, error }
  },

  async signIn(email: string, password: string) {
    if (isLocalMode) {
      const found = mockUsers.find(u => u.email === email)
      if (!found) return { data: null, error: { message: '用户不存在' } }
      if (found.disabled) return { data: null, error: { message: '用户已被禁用' } }
      mockUser = found
      mockSession = { user: mockUser }
      return { data: { user: mockUser, session: mockSession }, error: null }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { data, error }
    let prof = null
    if (data.user) {
      const res = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      prof = res.data
      if (!prof) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name: data.user.user_metadata?.name || '',
          role: 'user',
          disabled: false,
        })
        const res2 = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        prof = res2.data
      }
      if (prof?.disabled) {
        await supabase.auth.signOut()
        return { data: null, error: { message: '用户已被禁用' } }
      }
    }
    return { data: { ...data, profile: prof }, error }
  },

  async signOut() {
    if (isLocalMode) {
      // 模拟登出
      mockUser = null
      mockSession = null
      return { error: null }
    }
    
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    if (isLocalMode) {
      return mockUser
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    return { ...user, disabled: prof?.disabled, user_metadata: { ...(user.user_metadata||{}), role: prof?.role || 'user', name: prof?.name || user.user_metadata?.name } }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (isLocalMode) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }
    }
    
    return supabase.auth.onAuthStateChange(callback)
  },
}

// 模拟文件存储
const mockFiles = new Map<string, any>()

// 文件存储相关函数
export const storage = {
  async uploadFile(file: File, path: string) {
    if (isLocalMode) {
      // 模拟文件上传
      const fileId = 'mock-file-' + Date.now()
      mockFiles.set(fileId, { file, path, url: URL.createObjectURL(file) })
      return { data: { path: fileId }, error: null }
    }
    
    const { data, error } = await supabase.storage
      .from('pdf-files')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
    return { data, error }
  },

  async getFileUrl(path: string) {
    if (isLocalMode) {
      // 模拟获取文件URL
      const fileData = mockFiles.get(path)
      return fileData ? fileData.url : ''
    }
    
    const { data } = supabase.storage.from('pdf-files').getPublicUrl(path)
    return data.publicUrl
  },

  async deleteFile(path: string) {
    if (isLocalMode) {
      // 模拟删除文件
      mockFiles.delete(path)
      return { error: null }
    }
    
    const { error } = await supabase.storage.from('pdf-files').remove([path])
    return { error }
  },
}

// 模拟数据库
const mockProcessedFiles: any[] = []

// 数据库相关函数
export const database = {
  async createProcessedFile(record: any) {
    if (isLocalMode) {
      // 模拟数据库插入
      const newRecord = {
        ...record,
        id: 'mock-record-' + Date.now(),
        created_at: new Date().toISOString(),
      }
      mockProcessedFiles.unshift(newRecord)
      return { data: newRecord, error: null }
    }
    
    const { data, error } = await supabase
      .from('processed_files')
      .insert([record])
      .select()
      .single()
    return { data, error }
  },

  async getProcessedFiles(userId?: string) {
    if (isLocalMode) {
      // 模拟数据库查询
      const files = userId 
        ? mockProcessedFiles.filter(f => f.user_id === userId)
        : mockProcessedFiles
      return { data: files, error: null }
    }
    
    let query = supabase
      .from('processed_files')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    return { data, error }
  },

  async deleteProcessedFile(id: string) {
    if (isLocalMode) {
      // 模拟数据库删除
      const index = mockProcessedFiles.findIndex(f => f.id === id)
      if (index > -1) {
        mockProcessedFiles.splice(index, 1)
      }
      return { error: null }
    }
    
    const { error } = await supabase
      .from('processed_files')
      .delete()
      .eq('id', id)
    return { error }
  },
}

export const admin = {
  async listUsers() {
    if (isLocalMode) {
      return { data: mockUsers.map(u => ({ id: u.id, email: u.email, name: u.user_metadata?.name || '', role: u.user_metadata?.role || 'user', disabled: !!u.disabled, created_at: u.created_at })), error: null }
    }
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    return { data, error }
  },
  async disableUser(id: string, disabled: boolean) {
    if (isLocalMode) {
      const u = mockUsers.find(x => x.id === id)
      if (u) u.disabled = disabled
      return { error: null }
    }
    const { error } = await supabase.from('profiles').update({ disabled }).eq('id', id)
    return { error }
  },
  async deleteUser(id: string) {
    if (isLocalMode) {
      const i = mockUsers.findIndex(x => x.id === id)
      if (i > -1) mockUsers.splice(i, 1)
      if (mockUser?.id === id) {
        mockUser = null
        mockSession = null
      }
      return { error: null }
    }
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    return { error }
  },
}
