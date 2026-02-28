# AI Paper Reading Platform - Frontend

> **仓库地址**: `[YOUR_FRONTEND_REPO_URL]`
> **在线地址**: `[YOUR_FRONTEND_DEPLOY_URL]`
> **后端仓库**: `[YOUR_BACKEND_REPO_URL]`

AI论文阅读平台前端应用，基于 React + TypeScript + Vite 构建，提供简洁美观的用户界面。

## 技术栈

- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router** - 路由管理
- **TanStack Query** - 数据请求与缓存
- **Zustand / Context** - 状态管理
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI组件库
- **Sonner** - Toast通知

## 核心功能

### 论文浏览
- 论文列表展示与筛选
- 论文详情查看
- arXiv分类浏览
- 标签筛选
- 论文搜索

### AI功能
- AI论文摘要生成
- AI智能问答（支持多轮对话）
- AI论文深度分析
- AI论文评分
- AI标签推荐

### 用户功能
- 用户注册与登录
- 收藏夹管理
- 收藏管理
- 阅读列表
- 阅读进度追踪
- 笔记与批注

### 订阅功能
- **团队订阅** - 订阅12个AI团队的每日论文摘要
- **分类订阅** - 按arXiv分类订阅
- **标签订阅** - 按主题标签订阅
- **每日推送** - 自动生成个性化日报

## 项目结构

```
src/
├── pages/                    # 页面组件
│   ├── Index.tsx            # 首页
│   ├── Papers.tsx           # 论文列表
│   ├── PaperDetail.tsx      # 论文详情
│   ├── DailyPapers.tsx      # 每日论文
│   ├── TeamDigest.tsx       # 团队摘要
│   ├── AIQAAssistant.tsx    # AI问答
│   ├── Bookmarks.tsx        # 收藏
│   ├── Collections.tsx      # 收藏夹
│   ├── ReadingList.tsx      # 阅读列表
│   ├── Profile.tsx          # 用户资料
│   └── Settings.tsx         # 设置
├── components/               # 可复用组件
│   ├── Navbar.tsx           # 导航栏
│   ├── PaperActionsPanel.tsx # 论文操作面板
│   ├── AISummary.tsx        # AI摘要组件
│   ├── AIReadingAssistant.tsx # AI阅读助手
│   ├── AnnotationEditor.tsx  # 批注编辑器
│   └── ui/                  # shadcn/ui组件
├── lib/                     # 工具库
│   └── api.ts               # API客户端
├── contexts/                # React Context
│   └── AuthContext.tsx      # 认证上下文
├── hooks/                   # 自定义Hooks
│   ├── useArticles.ts       # 论文数据Hook
│   ├── useBookmarks.ts      # 收藏Hook
│   └── ...
├── types/                   # TypeScript类型定义
│   └── api.ts               # API类型
├── App.tsx                  # 应用根组件
└── main.tsx                 # 应用入口
```

## 快速开始

### 1. 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 2. 安装依赖

```bash
# 克隆仓库
git clone [YOUR_FRONTEND_REPO_URL]
cd ai-muse-blog

# 安装依赖
npm install
```

### 3. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
# API地址（开发环境）
VITE_API_BASE_URL=http://localhost:8000/api/v1

# API地址（生产环境）
# VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 应用将在 http://localhost:5173 启动
```

### 5. 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 主要页面

| 页面 | 路径 | 说明 | 认证 |
|------|------|------|------|
| 首页 | `/` | 平台首页 | 否 |
| 论文列表 | `/papers` | 浏览所有论文 | 否 |
| 论文详情 | `/papers/:id` | 查看论文详情 | 否 |
| 每日论文 | `/daily` | 每日新增论文 | 否 |
| 团队摘要 | `/daily-digest` | 团队日报摘要 | 否 |
| AI问答 | `/ai-qa` | AI智能问答 | 否 |
| 收藏 | `/bookmarks` | 我的收藏 | 是 |
| 收藏夹 | `/collections` | 收藏夹管理 | 是 |
| 阅读列表 | `/reading-list` | 阅读列表 | 是 |
| 阅读进度 | `/reading-progress` | 阅读进度统计 | 是 |
| 设置 | `/settings` | 账户设置 | 是 |

## API配置

在 `src/lib/api.ts` 中配置API客户端：

```typescript
// 自动从环境变量读取API地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
```

### API调用示例

```typescript
import { api } from '@/lib/api';

// 获取论文列表
const papers = await api.papers.list({ page: 1, page_size: 20 });

// 获取论文详情
const paper = await api.papers.get('paper-id');

// AI分析（需要登录）
const analysis = await api.daily.analyze({
  paper_id: 'paper-id',
  analysis_type: 'full'
});
```

## 认证流程

应用使用JWT Token进行认证：

1. 用户登录后，Token存储在 `localStorage`
2. 每次API请求自动携带Token
3. Token过期后自动跳转登录页

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <PleaseLogin />;
  }

  return <div>Welcome {user.username}</div>;
}
```

## 状态管理

### 认证状态

使用 `AuthContext` 管理全局认证状态：

```typescript
const { isAuthenticated, user, login, logout } = useAuth();
```

### 数据获取

使用 TanStack Query 进行数据获取和缓存：

```typescript
import { usePapers } from '@/hooks/useArticles';

function PapersList() {
  const { data, isLoading, error } = usePapers({ page: 1 });

  if (isLoading) return <Loader />;
  if (error) return <Error message={error.message} />;

  return <PaperList papers={data} />;
}
```

## 样式定制

### 主题配置

在 `src/hooks/useTheme.tsx` 中配置主题：

```typescript
const darkMode = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  // ...
};
```

### Tailwind配置

在 `tailwind.config.js` 中扩展样式：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        // ...
      }
    }
  }
}
```

## 部署

### Vercel部署（推荐）

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Docker部署

```bash
# 构建镜像
docker build -t ai-paper-frontend .

# 运行容器
docker run -p 5173:5173 ai-paper-frontend
```

### 静态托管

```bash
# 构建静态文件
npm run build

# 将 dist 目录部署到任意静态托管服务
# 如：GitHub Pages, Netlify, Cloudflare Pages等
```

## 环境变量

| 变量名 | 说明 | 默认值 | 是否必需 |
|--------|------|--------|----------|
| `VITE_API_BASE_URL` | 后端API地址 | http://localhost:8000/api/v1 | 是 |

## 支持的AI团队

订阅功能支持以下12个AI团队：

```
qwen - 通义千问
seed - Seed团队
deepseek - DeepSeek
llama-meta - LLaMA/Meta
baichuan - 百川
zhipu - 智谱AI
yi - 零一万物
internlm - 书生
chatgpt-openai - OpenAI
claude-anthropic - Anthropic
gemini-google - Google
mistral - Mistral
```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发指南

### 添加新页面

1. 在 `src/pages/` 创建新组件
2. 在 `src/App.tsx` 中添加路由
3. 更新导航菜单（如需要）

### 添加新API调用

1. 在 `src/lib/api.ts` 中添加API方法
2. 在 `src/types/api.ts` 中定义类型
3. 创建自定义Hook（可选）

## 常见问题

### Q: API请求失败怎么办？
A: 检查 `.env` 文件中的 `VITE_API_BASE_URL` 是否正确配置。

### Q: 如何切换到生产API？
A: 修改 `.env` 文件中的 `VITE_API_BASE_URL` 为生产环境地址。

### Q: 页面刷新后登录状态丢失？
A: 检查浏览器 `localStorage` 中是否有 `access_token`。

## 许可证

MIT License

## 联系方式

- **项目主页**: `[YOUR_PROJECT_HOMEPAGE]`
- **问题反馈**: `[YOUR_ISSUES_URL]`

---

**后端仓库**: [YOUR_BACKEND_REPO_URL]
