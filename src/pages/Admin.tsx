import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFile } from '../contexts/FileContext'
import Notification from '../components/Notification'
import { useAuth } from '../contexts/AuthContext'
import { admin } from '../utils/supabase'

const Admin: React.FC = () => {
  const { processedFiles } = useFile()
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    ;(async () => {
      try {
        const resp = await fetch('/.netlify/functions/list-users')
        if (resp.ok) {
          const json = await resp.json()
          setUsers(json.users || [])
        } else {
          const { data } = await admin.listUsers()
          setUsers(data || [])
        }
      } catch {
        const { data } = await admin.listUsers()
        setUsers(data || [])
      }
    })()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">后台管理</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700">返回首页</Link>
        </div>

        {!user || user.role !== 'admin' ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-700">该页面仅限管理员访问，请使用管理员账户登录。</p>
            <Link to="/login" className="mt-4 inline-block text-blue-600">前往登录</Link>
          </div>
        ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">处理记录</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">时间</th>
                  <th className="py-2 pr-4">类型</th>
                  <th className="py-2 pr-4">原始文件</th>
                  <th className="py-2 pr-4">页数</th>
                </tr>
              </thead>
              <tbody>
                {processedFiles.map((f) => (
                  <tr key={f.id} className="border-b">
                    <td className="py-2 pr-4">{new Date(f.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{f.fileType}</td>
                    <td className="py-2 pr-4">{f.originalName}</td>
                    <td className="py-2 pr-4">{f.pageCount}</td>
                  </tr>
                ))}
                {processedFiles.length === 0 && (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={4}>暂无记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {user && user.role === 'admin' && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">用户管理</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">邮箱</th>
                  <th className="py-2 pr-4">姓名</th>
                  <th className="py-2 pr-4">角色</th>
                  <th className="py-2 pr-4">状态</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2 pr-4">{u.disabled ? '已禁用' : '正常'}</td>
                    <td className="py-2 pr-4 space-x-2">
                      <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700" onClick={async () => { await admin.disableUser(u.id, !u.disabled); const { data } = await admin.listUsers(); setUsers(data || []) }}> {u.disabled ? '启用' : '禁用'} </button>
                      <button className="px-2 py-1 rounded bg-red-100 text-red-700" onClick={async () => { await admin.deleteUser(u.id); const { data } = await admin.listUsers(); setUsers(data || []) }}> 删除 </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={5}>暂无用户</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => {
              const header = ['id','email','name','role','disabled','created_at']
              const rows = users.map(u => [u.id,u.email,u.name,u.role,String(!!u.disabled),u.created_at])
              const csv = [header.join(','),...rows.map(r=>r.join(','))].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'users.csv'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}>导出用户列表</button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default Admin
