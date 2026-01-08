import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

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

// 用户认证相关函数
export const auth = {
  async signUp(email: string, password: string, name: string) {
    if (isLocalMode) {
      // 模拟注册
      mockUser = {
        id: 'mock-user-' + Date.now(),
        email,
        user_metadata: { name },
        created_at: new Date().toISOString(),
      }
      mockSession = { user: mockUser }
      return { data: { user: mockUser, session: mockSession }, error: null }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    return { data, error }
  },

  async signIn(email: string, password: string) {
    if (isLocalMode) {
      // 模拟登录
      if (!mockUser) {
        return { data: null, error: { message: '用户不存在，请先注册' } }
      }
      
      if (email === mockUser.email) {
        mockSession = { user: mockUser }
        return { data: { user: mockUser, session: mockSession }, error: null }
      }
      
      return { data: null, error: { message: '邮箱或密码错误' } }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
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
    return user
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (isLocalMode) {
      // 模拟认证状态变化
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
