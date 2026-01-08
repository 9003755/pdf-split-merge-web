import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, Split, Merge, ArrowRight, User, History, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFile } from '../contexts/FileContext'
import { useUI } from '../contexts/UIContext'
import { validatePDFFile, getPDFPageCount } from '../utils/pdfUtils'
import { PDFFile } from '../types'
import FileUploader from '../components/FileUploader'
import Notification from '../components/Notification'

const Home: React.FC = () => {
  const { user, signOut } = useAuth()
  const { addFile, setCurrentFile } = useFile()
  const { loading, setLoading, showNotification } = useUI()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = async (files: FileList) => {
    const file = files[0]
    if (!file) return

    const validation = validatePDFFile(file)
    if (!validation.valid) {
      showNotification(validation.error || '文件验证失败', 'error')
      return
    }

    setLoading(true)
    try {
      const pageCount = await getPDFPageCount(file)
      const pdfFile: PDFFile = {
        id: Date.now().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        pageCount,
        uploadDate: new Date(),
      }

      addFile(pdfFile)
      setCurrentFile(pdfFile)
      showNotification(`文件上传成功！共 ${pageCount} 页`, 'success')
    } catch (error) {
      showNotification('文件处理失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification />
      
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">PDF工具箱</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/history"
                className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <History className="w-4 h-4 mr-2" />
                历史记录
              </Link>
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-gray-700">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    退出
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-200"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            轻松拆分和合并PDF文件
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            简单易用的在线PDF处理工具，支持按页面拆分、多文件合并，无需安装软件，完全免费使用
          </p>
        </div>

        {/* 文件上传区域 */}
        <div className="mb-12">
          <FileUploader onFileUpload={handleFileUpload} />
        </div>

        {/* 功能选择 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Link
            to="/split"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition duration-300 border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Split className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">拆分PDF</h3>
            </div>
            <p className="text-gray-600 mb-6">
              将PDF文件按页面拆分，支持选择特定页面、跨页提取，可以自定义输出文件名
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              立即使用
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link
            to="/merge"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition duration-300 border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <Merge className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">合并PDF</h3>
            </div>
            <p className="text-gray-600 mb-6">
              将多个PDF文件合并为一个，支持拖拽排序，实时预览合并效果
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              立即使用
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>

        {/* 使用说明 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">使用说明</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">上传文件</h4>
              <p className="text-gray-600">拖拽或点击上传PDF文件，支持批量处理</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">选择操作</h4>
              <p className="text-gray-600">选择拆分或合并功能，按页面指引操作</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">下载结果</h4>
              <p className="text-gray-600">处理完成后立即下载，文件24小时后自动删除</p>
            </div>
          </div>
        </div>

        {/* 功能特点 */}
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">安全可靠</h4>
            <p className="text-sm text-gray-600">文件处理在本地完成，保护您的隐私</p>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">快速处理</h4>
            <p className="text-sm text-gray-600">优化的算法，快速完成PDF处理</p>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">无需安装</h4>
            <p className="text-sm text-gray-600">基于浏览器，无需下载安装软件</p>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">完全免费</h4>
            <p className="text-sm text-gray-600">所有功能完全免费使用</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home