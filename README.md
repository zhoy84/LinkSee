# LinkSee - 在线工具箱 🚀

> 快速、无广告、隐私优先的图片转链接工具

## ✨ 功能特性

- 🖼️ **图片转链接** - 一键上传图片获取永久链接
- 📋 **多种上传方式** - 支持拖拽、点击选择、粘贴板粘贴
- 📜 **历史记录** - 自动保存最近 10 条记录到本地存储
- 🎨 **深色模式** - 极客风格 UI，响应式设计
- 🔒 **隐私优先** - 所有数据存储在本地，无后端存储

## 🛠️ 技术栈

- **框架**: React 19 + Vite
- **样式**: Tailwind CSS v4
- **图标**: Lucide React
- **工具**: clsx, tailwind-merge
- **部署**: Vercel / GitHub Pages

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

### 3. 构建生产版本

```bash
npm run build
```

## 🌐 Vercel 部署

### 方式一：GitHub 导入（推荐）

1. **推送代码到 GitHub**
   ```bash
   git push
   ```

2. **访问 Vercel**
   - 打开 [vercel.com](https://vercel.com)
   - 登录并点击 "Add New..." → "Project"

3. **导入仓库**
   - 选择 "Import Git Repository"
   - 找到 `LinkSee` 仓库
   - 点击 "Import"

4. **配置部署**（自动识别，无需修改）
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **点击 "Deploy"**
   - 等待 1-2 分钟完成
   - 获取生产环境 URL（如 `https://linksee-xxx.vercel.app`）

### 方式二：Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel
```

## 📁 项目结构

```
LinkSee/
├── index.html              # HTML 入口
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── vercel.json             # Vercel 部署配置
├── .gitignore              # Git 忽略文件
├── src/
│   ├── main.jsx            # React 入口
│   ├── App.jsx             # 主组件
│   ├── index.css           # 全局样式
│   ├── components/
│   │   ├── ImageUploader.jsx    # 图片上传组件
│   │   └── HistoryList.jsx      # 历史记录组件
│   └── utils/
│       └── api.js          # API 调用逻辑
└── dist/                   # 构建输出目录
```

## 🔧 API 说明

### 图片上传接口

- **端点**: `https://img.131213.xyz/upload`
- **方法**: POST
- **格式**: FormData
- **参数**: `file` (图片文件)

### 返回格式

```json
{
  "url": "https://..."
}
```

## 📝 功能详情

### 图片上传
- ✅ 拖拽上传
- ✅ 点击选择
- ✅ 粘贴板粘贴
- ✅ 进度条动画
- ✅ 错误处理

### 结果展示
- ✅ 图片预览
- ✅ 链接只读输入框
- ✅ 一键复制
- ✅ 复制成功提示

### 历史记录
- ✅ localStorage 存储
- ✅ 最多保留 10 条
- ✅ 时间戳显示
- ✅ 删除功能
- ✅ 复制链接功能

## 🎨 UI/UX 特性

- 深色模式主题
- 响应式设计（移动端友好）
- 卡片式布局
- 圆角 + 阴影效果
- 渐变背景
- 动画过渡

## 🔒 隐私与安全

- ✅ 无后端存储
- ✅ 所有数据本地存储
- ✅ 无广告追踪
- ✅ 无用户数据收集
- ✅ HTTPS 加密传输

## 📦 构建和部署

### 本地构建

```bash
npm run build
```

输出目录：`dist/`

### Vercel 环境变量（可选）

如果后续需要 API Key 等敏感信息，可在 Vercel 项目设置中添加：

1. 访问 Vercel 项目页面
2. 点击 "Settings" → "Environment Variables"
3. 添加变量（如 `API_KEY`）
4. 重新部署

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

ISC

---

**灵犀在线工具箱** © 2026 - LinkSee
