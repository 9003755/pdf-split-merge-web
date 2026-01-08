import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Scissors, Eye, Save } from 'lucide-react'
import { useFile } from '../contexts/FileContext'
import { useUI } from '../contexts/UIContext'
import { useAuth } from '../contexts/AuthContext'
import { splitPDF, downloadFile, formatFileSize, generatePDFThumbnailFromUrl } from '../utils/pdfUtils'
import { database } from '../utils/supabase'
import { PDFFile, PDFPage } from '../types'
import FileUploader from '../components/FileUploader'
import Notification from '../components/Notification'

const Split: React.FC = () => {
  const { currentFile, addProcessedFile } = useFile()
  const { loading, setLoading, showNotification } = useUI()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [pages, setPages] = useState<PDFPage[]>([])
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [fileName, setFileName] = useState('')
  const [splitMode, setSplitMode] = useState<'single' | 'range' | 'custom'>('custom')
  const [pageRange, setPageRange] = useState('')

  useEffect(() => {
    if (currentFile) {
      initializePages()
      setFileName(`拆分_${currentFile.name}`)
    }
  }, [currentFile])

  const initializePages = () => {
    if (!currentFile) return
    
    const pageArray: PDFPage[] = []
    for (let i = 1; i <= currentFile.pageCount; i++) {
      pageArray.push({
        pageNumber: i,
        thumbnail: '',
        selected: false,
      })
    }
    setPages(pageArray)

    ;(async () => {
      const updated = [...pageArray]
      for (let i = 0; i < updated.length; i++) {
        try {
          const thumb = await generatePDFThumbnailFromUrl(currentFile.url, updated[i].pageNumber, 150)
          updated[i] = { ...updated[i], thumbnail: thumb }
          setPages(prev => {
            const next = [...prev]
            next[i] = updated[i]
            return next
          })
        } catch {}
      }
    })()
  }

  const handlePageSelect = (pageNumber: number) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNumber)) {
        return prev.filter(p => p !== pageNumber)
      } else {
        return [...prev, pageNumber].sort((a, b) => a - b)
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([])
    } else {
      setSelectedPages(pages.map(p => p.pageNumber))
    }
  }

  const handleRangeChange = (range: string) => {
    setPageRange(range)
    const pageNumbers = parsePageRange(range)
    setSelectedPages(pageNumbers)
  }

  const parsePageRange = (range: string): number[] => {
    const pages: number[] = []
    const parts = range.split(',').map(p => p.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()))
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i <= currentFile!.pageCount) {
              pages.push(i)
            }
          }
        }
      } else {
        const page = parseInt(part)
        if (!isNaN(page) && page <= currentFile!.pageCount) {
          pages.push(page)
        }
      }
    }
    
    return [...new Set(pages)].sort((a, b) => a - b)
  }

  const handleSplit = async () => {
    if (!currentFile || selectedPages.length === 0) {
      showNotification('请选择要拆分的页面', 'error')
      return
    }

    if (!fileName.trim()) {
      showNotification('请输入输出文件名', 'error')
      return
    }

    setLoading(true)
    try {
      // 获取原始文件
      const response = await fetch(currentFile.url)
      const blob = await response.blob()
      const file = new File([blob], currentFile.name, { type: 'application/pdf' })
      
      // 拆分PDF
      const splitBlob = await splitPDF(file, selectedPages)
      
      // 下载文件
      downloadFile(splitBlob, `${fileName}.pdf`)
      
      // 保存处理记录
      const processedFile = {
        id: Date.now().toString(),
        userId: user?.id,
        originalName: currentFile.name,
        fileUrl: URL.createObjectURL(splitBlob),
        fileType: 'split' as const,
        pageCount: selectedPages.length,
        operationData: {
          pages: selectedPages,
          fileName: fileName,
        },
        createdAt: new Date(),
      }
      
      addProcessedFile(processedFile)
      
      // 保存到数据库（如果用户已登录）
      if (user) {
        await database.createProcessedFile({
          user_id: user.id,
          original_name: currentFile.name,
          file_url: processedFile.fileUrl,
          file_type: 'split',
          page_count: selectedPages.length,
          operation_data: processedFile.operationData,
        })
      }
      
      showNotification(`PDF拆分成功！共提取 ${selectedPages.length} 页`, 'success')
    } catch (error) {
      showNotification('PDF拆分失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!currentFile) {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">请先上传PDF文件</h2>
            <p className="text-gray-600 mb-6">您需要先上传一个PDF文件才能使用拆分功能</p>
            <FileUploader onFileUpload={(files) => {
              // 处理文件上传逻辑将在FileContext中处理
            }} />
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：页面预览 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  页面预览
                </h2>
                <div className="text-sm text-gray-600">
                  共 {currentFile.pageCount} 页
                </div>
              </div>

              {/* 页面选择工具栏 */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {selectedPages.length === pages.length ? '取消全选' : '全选'}
                </button>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => handleRangeChange(e.target.value)}
                    placeholder="例如: 1-5, 8, 10-12"
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">页码范围</span>
                </div>
              </div>

              {/* 页面网格 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {pages.map((page) => (
                  <div
                    key={page.pageNumber}
                    onClick={() => handlePageSelect(page.pageNumber)}
                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                      selectedPages.includes(page.pageNumber)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded flex items-center justify-center mb-2 overflow-hidden">
                      {page.thumbnail ? (
                        <img src={page.thumbnail} alt={`第 ${page.pageNumber} 页`} className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        第 {page.pageNumber} 页
                      </div>
                    </div>
                    {selectedPages.includes(page.pageNumber) && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {selectedPages.indexOf(page.pageNumber) + 1}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：设置面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Scissors className="w-5 h-5 mr-2" />
                拆分设置
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    已选择页面
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedPages.length > 0 ? (
                      <div>
                        <div>共 {selectedPages.length} 页</div>
                        <div className="text-xs mt-1">
                          页码: {selectedPages.join(', ')}
                        </div>
                      </div>
                    ) : (
                      '请选择要拆分的页面'
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输出文件名
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入文件名"
                  />
                </div>

                <button
                  onClick={handleSplit}
                  disabled={selectedPages.length === 0 || loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      处理中...
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      开始拆分
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">使用提示</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• 点击页面缩略图选择要提取的页面</li>
                  <li>• 支持跨页选择，如 1-5, 8, 10-12</li>
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

export default Split
