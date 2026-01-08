import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Plus, Trash2, Move, Eye } from 'lucide-react'
import { useFile } from '../contexts/FileContext'
import { useUI } from '../contexts/UIContext'
import { useAuth } from '../contexts/AuthContext'
import { mergePDF, downloadFile, formatFileSize, getPDFPageCount } from '../utils/pdfUtils'
import { database } from '../utils/supabase'
import { PDFFile } from '../types'
import FileUploader from '../components/FileUploader'
import Notification from '../components/Notification'

const Merge: React.FC = () => {
  const { files, addFile } = useFile()
  const { loading, setLoading, showNotification } = useUI()
  const { user } = useAuth()
  
  const [mergeFiles, setMergeFiles] = useState<PDFFile[]>([])
  const [outputFileName, setOutputFileName] = useState('合并文件.pdf')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const pageCount = await getPDFPageCount(file)
        const pdfFile: PDFFile = {
          id: Date.now().toString() + i,
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          pageCount,
          uploadDate: new Date(),
        }
        
        setMergeFiles(prev => [...prev, pdfFile])
        showNotification(`文件 ${file.name} 添加成功`, 'success')
      } catch (error) {
        showNotification(`文件 ${file.name} 处理失败`, 'error')
      }
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setMergeFiles(prev => prev.filter(f => f.id !== fileId))
    showNotification('文件已移除', 'success')
  }

  const handleMoveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...mergeFiles]
    const [movedFile] = newFiles.splice(fromIndex, 1)
    newFiles.splice(toIndex, 0, movedFile)
    setMergeFiles(newFiles)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== dropIndex) {
      handleMoveFile(dragIndex, dropIndex)
    }
    setDragIndex(null)
  }

  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      showNotification('请至少添加2个PDF文件', 'error')
      return
    }

    if (!outputFileName.trim()) {
      showNotification('请输入输出文件名', 'error')
      return
    }

    setLoading(true)
    try {
      // 获取所有文件
      const fileBlobs = await Promise.all(
        mergeFiles.map(async (file) => {
          const response = await fetch(file.url)
          const blob = await response.blob()
          return new File([blob], file.name, { type: 'application/pdf' })
        })
      )
      
      // 合并PDF
      const mergedBlob = await mergePDF(fileBlobs)
      
      // 下载文件
      downloadFile(mergedBlob, outputFileName)
      
      // 保存处理记录
      const processedFile = {
        id: Date.now().toString(),
        userId: user?.id,
        originalName: mergeFiles.map(f => f.name).join(', '),
        fileUrl: URL.createObjectURL(mergedBlob),
        fileType: 'merge' as const,
        pageCount: mergeFiles.reduce((sum, file) => sum + file.pageCount, 0),
        operationData: {
          fileIds: mergeFiles.map(f => f.id),
          fileName: outputFileName,
        },
        createdAt: new Date(),
      }
      
      // 保存到数据库（如果用户已登录）
      if (user) {
        await database.createProcessedFile({
          user_id: user.id,
          original_name: processedFile.originalName,
          file_url: processedFile.fileUrl,
          file_type: 'merge',
          page_count: processedFile.pageCount,
          operation_data: processedFile.operationData,
        })
      }
      
      showNotification(`PDF合并成功！共 ${processedFile.pageCount} 页`, 'success')
    } catch (error) {
      showNotification('PDF合并失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = mergeFiles.reduce((sum, file) => sum + file.pageCount, 0)

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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：文件列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  PDF文件列表
                </h2>
                <div className="text-sm text-gray-600">
                  {mergeFiles.length} 个文件，共 {totalPages} 页
                </div>
              </div>

              {/* 文件上传区域 */}
              <div className="mb-6">
                <FileUploader 
                  onFileUpload={handleFileUpload}
                  multiple={true}
                />
              </div>

              {/* 文件列表 */}
              {mergeFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">已添加的文件</h3>
                  {mergeFiles.map((file, index) => (
                    <div
                      key={file.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 cursor-move"
                    >
                      <div className="flex items-center space-x-3">
                        <Move className="w-4 h-4 text-gray-400" />
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-600">
                            {formatFileSize(file.size)} • {file.pageCount} 页
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：合并设置 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">合并设置</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输出文件名
                  </label>
                  <input
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入输出文件名"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">合并预览</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>文件数量: {mergeFiles.length}</div>
                    <div>总页数: {totalPages}</div>
                    <div>总大小: {formatFileSize(mergeFiles.reduce((sum, file) => sum + file.size, 0))}</div>
                  </div>
                </div>

                <button
                  onClick={handleMerge}
                  disabled={mergeFiles.length < 2 || loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      处理中...
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      开始合并
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-md">
                <h4 className="text-sm font-medium text-green-900 mb-2">使用提示</h4>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• 拖拽文件调整合并顺序</li>
                  <li>• 支持批量上传多个PDF文件</li>
                  <li>• 文件将在24小时后自动删除</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Merge