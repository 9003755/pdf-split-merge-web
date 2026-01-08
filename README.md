# PDF工具箱 - 在线PDF拆分合并工具

一个简单易用的在线PDF处理工具，支持PDF文件拆分、合并功能，无需安装软件，完全免费使用。

## 功能特性

### 🔄 PDF拆分
- 按页面拆分PDF文件
- 支持选择特定页面进行提取
- 支持跨页选择和页码范围输入（如：1-5, 8, 10-12）
- 自定义输出文件名

### 📑 PDF合并
- 将多个PDF文件合并为一个
- 支持拖拽调整文件顺序
- 实时预览合并效果
- 批量上传多个文件

### 👥 用户管理
- 访客用户：无需注册即可使用所有功能
- 注册用户：可保存处理历史，云端存储文件
- 文件自动清理：临时文件24小时后自动删除

### 📱 响应式设计
- 支持桌面端、平板和手机访问
- 触摸优化的移动端界面
- 现代化的卡片式布局

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **PDF处理**: PDF-Lib + PDF.js
- **后端服务**: Supabase (认证、存储、数据库)
- **图标库**: Lucide React
- **路由**: React Router DOM

## 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd pdf-split-merge
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env` 并填写您的Supabase配置：
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 构建生产版本
```bash
npm run build
```

## 部署

### Vercel部署（推荐）
1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 点击部署

### 其他静态托管
构建后的文件位于 `dist/` 目录，可部署到任何静态托管服务。

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── FileUploader.tsx # 文件上传组件
│   └── Notification.tsx # 通知组件
├── contexts/           # React Context
│   ├── AuthContext.tsx # 用户认证上下文
│   ├── FileContext.tsx # 文件处理上下文
│   └── UIContext.tsx   # UI状态上下文
├── pages/              # 页面组件
│   ├── Home.tsx        # 首页
│   ├── Login.tsx       # 登录注册页
│   ├── Split.tsx       # PDF拆分页
│   ├── Merge.tsx       # PDF合并页
│   └── History.tsx     # 历史记录页
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
│   ├── pdfUtils.ts     # PDF处理工具
│   └── supabase.ts     # Supabase客户端
└── App.tsx             # 主应用组件
```

## 核心功能实现

### PDF拆分
使用PDF-Lib库实现PDF页面提取，支持：
- 页面选择和范围输入
- 客户端处理，保护隐私
- 实时预览和进度显示

### PDF合并
使用PDF-Lib库实现多文件合并，支持：
- 拖拽排序
- 批量上传
- 合并预览

### 文件管理
- 基于Supabase的文件存储
- 用户认证和权限管理
- 临时文件自动清理

## 开发指南

### 添加新功能
1. 在 `src/types/` 中添加相关类型定义
2. 在 `src/components/` 中创建必要组件
3. 在 `src/pages/` 中创建页面组件
4. 更新路由配置

### 样式定制
- 使用Tailwind CSS进行样式定制
- 主色调可在配置文件中修改
- 支持暗色模式扩展

### 性能优化
- 文件处理使用Web Worker避免阻塞主线程
- 图片懒加载和虚拟滚动
- 代码分割和按需加载

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 支持

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件至：support@example.com

## 更新日志

### v1.0.0 (2024-01-08)
- ✨ 初始版本发布
- 🔄 PDF拆分功能
- 📑 PDF合并功能
- 👥 用户认证系统
- 📱 响应式设计
- 🚀 Vercel部署支持