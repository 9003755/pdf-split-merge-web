import React, { createContext, useContext, useState, ReactNode } from 'react'
import { PDFFile, ProcessedFile } from '../types'

interface FileContextType {
  files: PDFFile[]
  processedFiles: ProcessedFile[]
  currentFile: PDFFile | null
  setCurrentFile: (file: PDFFile | null) => void
  addFile: (file: PDFFile) => void
  removeFile: (fileId: string) => void
  addProcessedFile: (file: ProcessedFile) => void
  clearFiles: () => void
}

const FileContext = createContext<FileContextType | undefined>(undefined)

export const useFile = () => {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error('useFile must be used within a FileProvider')
  }
  return context
}

interface FileProviderProps {
  children: ReactNode
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [currentFile, setCurrentFile] = useState<PDFFile | null>(null)

  const addFile = (file: PDFFile) => {
    setFiles(prev => [...prev, file])
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (currentFile?.id === fileId) {
      setCurrentFile(null)
    }
  }

  const addProcessedFile = (file: ProcessedFile) => {
    setProcessedFiles(prev => [file, ...prev])
  }

  const clearFiles = () => {
    setFiles([])
    setCurrentFile(null)
  }

  const value = {
    files,
    processedFiles,
    currentFile,
    setCurrentFile,
    addFile,
    removeFile,
    addProcessedFile,
    clearFiles,
  }

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>
}