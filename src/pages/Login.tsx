import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUI } from '../contexts/UIContext'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const { signIn, signUp } = useAuth()
  const { setLoading, showNotification } = useUI()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      showNotification('请填写所有必填字段', 'error')
      return
    }

    if (isRegister && !name) {
      showNotification('请填写姓名', 'error')
      return
    }

    if (isRegister && password.length < 6) {
      showNotification('密码必须6位或6位以上，否则注册不成功', 'error')
      return
    }

    setLoading(true)
    
    try {
      if (isRegister) {
        await signUp(email, password, name)
        showNotification('注册成功！请登录', 'success')
        setIsRegister(false)
      } else {
        await signIn(email, password)
        showNotification('登录成功！', 'success')
        navigate('/')
      }
    } catch (error: any) {
      showNotification(error.message || '操作失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRegister ? '注册账户' : '用户登录'}
          </h1>
          <p className="text-gray-600">
            {isRegister ? '创建您的PDF处理工具账户' : '登录以使用更多功能'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入您的姓名"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入密码"
                  required
                />
              </div>
              {isRegister && (
                <p className="mt-2 text-xs text-gray-500">密码必须6位或6位以上，否则注册不成功</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            >
              {isRegister ? '注册' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isRegister ? '已有账户？立即登录' : '没有账户？立即注册'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              注册即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            访客用户也可以直接使用PDF处理功能
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full mt-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
          >
            继续作为访客使用
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
