import * as PDFLib from 'pdf-lib'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

let pdfWorker: Worker | null = null
try {
  pdfWorker = new Worker(new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url), { type: 'module' })
  GlobalWorkerOptions.workerPort = pdfWorker
} catch (e) {
  GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5/build/pdf.worker.mjs'
}

/**
 * 获取PDF文件的页数
 */
export async function getPDFPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer)
    return pdf.getPageCount()
  } catch (error) {
    console.error('获取PDF页数失败:', error)
    throw new Error('无法读取PDF文件')
  }
}

/**
 * 生成PDF页面缩略图
 */
export async function generatePDFThumbnailFromUrl(url: string, pageNumber: number = 1, width: number = 150): Promise<string> {
  const loadingTask = getDocument(url)
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageNumber)

  const viewport = page.getViewport({ scale: 1 })
  const scale = width / viewport.width
  const scaledViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = Math.floor(scaledViewport.width)
  canvas.height = Math.floor(scaledViewport.height)

  const renderTask = page.render({ canvasContext: context, viewport: scaledViewport })
  await renderTask.promise
  return canvas.toDataURL()
}

/**
 * 拆分PDF文件
 */
export async function splitPDF(file: File, pages: number[]): Promise<Blob> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer)
    const newPdf = await PDFLib.PDFDocument.create()

    // 复制选中的页面
    const copiedPages = await newPdf.copyPages(pdf, pages.map(p => p - 1))
    copiedPages.forEach(page => newPdf.addPage(page))

    const pdfBytes = await newPdf.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  } catch (error) {
    console.error('拆分PDF失败:', error)
    throw new Error('PDF拆分失败')
  }
}

/**
 * 合并多个PDF文件
 */
export async function mergePDF(files: File[]): Promise<Blob> {
  try {
    const mergedPdf = await PDFLib.PDFDocument.create()

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFLib.PDFDocument.load(arrayBuffer)
      
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      pages.forEach(page => mergedPdf.addPage(page))
    }

    const pdfBytes = await mergedPdf.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  } catch (error) {
    console.error('合并PDF失败:', error)
    throw new Error('PDF合并失败')
  }
}

/**
 * 下载文件
 */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 文件大小格式化
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 验证PDF文件
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = ['application/pdf']

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '请选择PDF文件' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过50MB' }
  }

  return { valid: true }
}
