import React, { useRef, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { validatePDFFile } from '../utils/pdfUtils'

interface FileUploaderProps {
  onFileUpload: (files: FileList) => void
  multiple?: boolean
  maxSize?: number
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileUpload, 
  multiple = false, 
  maxSize = 50 * 1024 * 1024 // 50MB
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      handleFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFiles = (files: FileList) => {
    setError(null)
    
    // 验证文件
    const validFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validatePDFFile(file)
      
      if (!validation.valid) {
        setError(validation.error || '文件验证失败')
        return
      }
      
      if (file.size > maxSize) {
        setError(`文件大小不能超过 ${maxSize / (1024 * 1024)}MB`)
        return
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      const dt = new DataTransfer()
      validFiles.forEach(file => dt.items.add(file))
      onFileUpload(dt.files)
    }
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            上传PDF文件
          </h3>
          <p className="text-gray-600 mb-4">
            拖拽文件到此处，或点击选择文件
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
          >
            选择文件
          </button>
          <p className="text-sm text-gray-500 mt-2">
            支持PDF格式，最大50MB
          </p>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default FileUploader