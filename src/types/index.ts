// 用户类型定义
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  role?: 'admin' | 'user';
  disabled?: boolean;
}

// 文件类型定义
export interface PDFFile {
  id: string;
  name: string;
  url: string;
  size: number;
  pageCount: number;
  uploadDate: Date;
}

// 处理记录类型
export interface ProcessedFile {
  id: string;
  userId?: string;
  originalName: string;
  fileUrl: string;
  fileType: 'split' | 'merge';
  pageCount: number;
  operationData: {
    pages?: number[];
    fileIds?: string[];
    fileName: string;
  };
  createdAt: Date;
}

// PDF页面类型
export interface PDFPage {
  pageNumber: number;
  thumbnail: string;
  selected: boolean;
}

// 拆分设置类型
export interface SplitSettings {
  mode: 'single' | 'range' | 'custom';
  pages: number[];
  fileName: string;
}

// 合并设置类型
export interface MergeSettings {
  fileIds: string[];
  fileName: string;
  order: number[];
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 文件上传响应
export interface UploadResponse {
  fileId: string;
  fileUrl: string;
  pages: number;
}

// PDF处理响应
export interface ProcessResponse {
  newFileId: string;
  downloadUrl: string;
  fileName: string;
}
