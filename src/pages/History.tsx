import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Trash2, FileText, Split, Merge, Calendar, Clock } from 'lucide-react'
import { useFile } from '../contexts/FileContext'
import { useUI } from '../contexts/UIContext'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../utils/supabase'
import { ProcessedFile } from '../types'
import { formatFileSize } from '../utils/pdfUtils'
import Notification from '../components/Notification'

const History: React.FC = () => {
  const { processedFiles } = useFile()
  const { loading, setLoading, showNotification } = useUI()
  const { user } = useAuth()
  const [historyFiles, setHistoryFiles] = useState<ProcessedFile[]>([])

  useEffect(() => {
    loadHistory()
  }, [user, processedFiles])

  const loadHistory = async () => {
    if (!user) {
      // 访客用户只显示当前会话的处理记录
      setHistoryFiles(processedFiles)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await database.getProcessedFiles(user.id)
      if (error) throw error

      if (data) {
        const files: ProcessedFile[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          originalName: item.original_name,
          fileUrl: item.file_url,
          fileType: item.file_type,
          pageCount: item.page_count,
          operationData: item.operation_data,
          createdAt: new Date(item.created_at),
        }))
        setHistoryFiles(files)
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
      showNotification('加载历史记录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (file: ProcessedFile) => {
    // 创建下载链接
    const link = document.createElement('a')
    link.href = file.fileUrl
    link.download = file.operationData.fileName || `${file.fileType}_${Date.now()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showNotification('文件下载已开始', 'success')
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('确定要删除这个文件吗？')) {
      return
    }

    setLoading(true)
    try {
      // 如果是注册用户，从数据库删除
      if (user) {
        const { error } = await database.deleteProcessedFile(fileId)
        if (error) throw error
      }

      // 从本地状态中删除
      setHistoryFiles(prev => prev.filter(f => f.id !== fileId))
      
      showNotification('文件已删除', 'success')
    } catch (error) {
      console.error('删除文件失败:', error)
      showNotification('删除文件失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileIcon = (fileType: 'split' | 'merge') => {
    return fileType === 'split' ? (
      <Split className="w-5 h-5 text-blue-600" />
    ) : (
      <Merge className="w-5 h-5 text-green-600" />
    )
  }

  const getFileTypeText = (fileType: 'split' | 'merge') => {
    return fileType === 'split' ? '拆分' : '合并'
  }

  if (!user && historyFiles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Notification />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">暂无处理记录</h2>
            <p className="text-gray-600 mb-6">
              访客用户的历史记录仅在当前会话中保留，登录后可永久保存处理记录
            </p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">处理历史</h1>
          <p className="text-gray-600">
            {user ? '查看您所有的PDF处理记录' : '查看当前会话的处理记录'}
          </p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{historyFiles.length}</div>
                <div className="text-sm text-gray-600">总处理文件数</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Split className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {historyFiles.filter(f => f.fileType === 'split').length}
                </div>
                <div className="text-sm text-gray-600">拆分文件数</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Merge className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {historyFiles.filter(f => f.fileType === 'merge').length}
                </div>
                <div className="text-sm text-gray-600">合并文件数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        {historyFiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无处理记录</h3>
            <p className="text-gray-600 mb-6">
              您还没有处理过任何PDF文件，开始处理文件后这里会显示历史记录
            </p>
            <Link
              to="/"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              开始处理文件
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">处理记录</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {historyFiles.map((file) => (
                <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {getFileIcon(file.fileType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            file.fileType === 'split' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {getFileTypeText(file.fileType)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {file.pageCount} 页
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {file.operationData.fileName || file.originalName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          原文件: {file.originalName}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(file.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(file)}
                        className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </button>
                      
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default History