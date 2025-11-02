<div align="center">
  <img src="public/vilearning_logo.png" alt="ViLearning Logo" width="120" height="120">

  # ViLearning

  **Build Context-Driven Spatial Learning Canvases with AI**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)

  [🌐 Live Demo](https://flowchartai.org) • [📖 Documentation](#documentation) • [🚀 Self-Host](#self-hosting-guide) • [💬 Discord](https://discord.gg/Pfdyhqqu)
</div>

---

## 🎯 What is ViLearning?

ViLearning 是一个 **AI 驱动的空间化学习画布**，通过上下文工程、顶级大模型矩阵与多 Display 输出，把散落的知识与资料升级为可协同的知识网络。无论你是知识工作者、学生还是团队协作者，都可以在 ViLearning 中快速编织思维导图、流程图、测验卡片与时间线，让分散的信息在一个画布中自然生长。

### ✨ Key Features

- **🧠 上下文工程管线**：汇聚项目提示、白板快照与资料引用，确保顶级模型专注重点信息
- **🌀 顶级大模型矩阵**：当前测试阶段优选 DeepSeek，后续可按需切换多款模型，匹配推理或结构化能力
- **🔧 多 Display 工厂**：流程图、思维导图、测验卡片、时间线等多种可视化形态一键生成
- **🌌 空间化学习画布**：拖拽 Display、组织节点、构建多线程学习路线，形成可协同的知识网络
- **🌱 分支与追溯**：任意节点开启分支对话，保留上下文快照，比较不同学习或执行方案
- **👥 团队协同即将上线**：团队工作区、角色权限、治理报表已经纳入路线图
- **🔒 自主可控**：支持自托管部署，未来开放模型指标与治理能力，满足隐私与合规需求
- **🧩 Display SDK（筹备中）**：构建你自己的可视化组件，扩展 ViLearning 的知识呈现方式

### 🎬 See It In Action

![ViLearning Demo](https://cdn.flowchartai.org/static/demo.mp4)

*把资料、指令与分支对话集中在一个空间化画布里，随时切换 Display 与模型*

## 🚀 Quick Start

### Option 1: Use Our Hosted Version
Visit [flowchartai.org](https://flowchartai.org) and start creating flowcharts immediately. Free tier includes 1 AI generation per day.

### Option 2: Self-Host (Recommended for Privacy)
Follow our [Self-Hosting Guide](#self-hosting-guide) below to run ViLearning on your own infrastructure.

## 🛠️ Technology Stack

ViLearning is built with modern, production-ready technologies:

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI components
- **Canvas**: Excalidraw integration with Mermaid support
- **AI**: OpenRouter API (supports multiple AI models)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth (Google, GitHub OAuth)
- **Payments**: Creem integration for subscriptions
- **Storage**: Cloudflare R2 / AWS S3 compatible
- **Deployment**: Vercel, Cloudflare Workers, or self-hosted

## 🎯 Use Cases

ViLearning 服务于多种学习与协同场景：

- **📚 通用知识工作者**：聚合研究资料、会议纪要与策略路线，构建上下文驱动的项目战术板
- **🎓 商科留学生规划**：整合语言考试、背景提升、实习求职节奏，以时间线+流程图跟踪整体进展
- **🧠 ADHD 多线程学习者**：将任务按能量曲线与奖励机制拆分，使用 Display 管理多线程学习进度
- **🤝 团队协作**：在白板上沉淀 OKR、实验日志与复盘，不同分支保留完整上下文快照
- **🧪 课程与测验设计**：快速把课堂笔记、错题与补强建议生成测验卡片，提升复习效率

## 🏠 Self-Hosting Guide

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **pnpm** installed
- **PostgreSQL database** (local or cloud)
- **OpenRouter API key** for AI functionality
- **Google/GitHub OAuth apps** for authentication
- **Cloudflare R2** or **AWS S3** for file storage (optional)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/tanchaowen84/flowchartai.git
cd flowchartai

# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/flowchartai"

# Authentication (Required)
BETTER_AUTH_SECRET="your-random-secret-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# AI Service (Required)
ARK_API_KEY="your-ark-api-key"
ARK_DEEPSEEK_MODEL_ID="deepseek-v3-1-250821"
AI_DEFAULT_MODEL_KEY="deepseek-v3-1"
# Optional fallback via OpenRouter
OPENROUTER_API_KEY="optional-openrouter-api-key"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

# Storage (Optional - for file uploads)
STORAGE_REGION="auto"
STORAGE_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY_ID="your-r2-access-key"
STORAGE_SECRET_ACCESS_KEY="your-r2-secret-key"
STORAGE_BUCKET_NAME="flowchart-ai"
STORAGE_PUBLIC_URL="https://cdn.yourdomain.com"

# Email (Optional - for notifications)
RESEND_API_KEY="your-resend-api-key"

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate database schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Open database studio
pnpm db:studio
```

### 4. Configure Services

#### 火山引擎 Ark（AI 必填）
1. 前往 [火山方舟控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apikey)
2. 创建并复制 Ark API Key
3. 在 `.env.local` 中设置 `ARK_API_KEY`、`ARK_DEEPSEEK_MODEL_ID`（可使用默认值）以及 `AI_DEFAULT_MODEL_KEY`

#### OpenRouter（可选备用）
1. 注册 [OpenRouter](https://openrouter.ai/)
2. 创建 API Key
3. 在 `.env.local` 中设置 `OPENROUTER_API_KEY`（如有自定义域名同时设置 `OPENROUTER_BASE_URL`）

#### Google OAuth (Required for Authentication)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add client ID and secret to `.env.local`

#### Cloudflare R2 (Optional for File Storage)
1. Create R2 bucket in Cloudflare dashboard
2. Generate R2 API tokens
3. Configure custom domain for public access
4. Add credentials to `.env.local`

### 5. Run Development Server

```bash
# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see your ViLearning instance!

### 6. Production Deployment

#### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Configure custom domain (optional)
```

#### Deploy to Your Own Server

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### 7. Configuration Options

#### Subscription Plans (Optional)
If you want to offer paid plans, configure Creem:

```env
# Creem Payment (Optional)
CREEM_API_KEY="your-creem-api-key"
CREEM_API_URL="https://api.creem.io"
CREEM_WEBHOOK_SECRET="your-webhook-secret"

# Product IDs for different plans
NEXT_PUBLIC_CREEM_PRODUCT_ID_HOBBY_MONTHLY="prod_xxx"
NEXT_PUBLIC_CREEM_PRODUCT_ID_HOBBY_YEARLY="prod_xxx"
NEXT_PUBLIC_CREEM_PRODUCT_ID_PROFESSIONAL_MONTHLY="prod_xxx"
NEXT_PUBLIC_CREEM_PRODUCT_ID_PROFESSIONAL_YEARLY="prod_xxx"
```

#### Feature Toggles
Customize which features are enabled in `src/config/website.tsx`:

```typescript
features: {
  enableDocsPage: false,        // Documentation pages
  enableAIPages: false,         // AI showcase pages
  enableUpgradeCard: true,      // Upgrade prompts
  enableDiscordWidget: false,   // Discord integration
}
```

## 🔧 Customization

### Branding
- Replace `public/vilearning_logo.png` with your logo
- Update `src/config/website.tsx` for site metadata
- Modify `messages/en.json` for text content

### AI Models
ViLearning supports multiple AI providers through OpenRouter:
- Google Gemini (default)
- OpenAI GPT models
- Anthropic Claude
- And many more

Change the model in `src/app/api/ai/chat/flowchart/route.ts`:

```typescript
const model = 'google/gemini-2.5-flash'; // Change to your preferred model
```

### Styling
- Built with Tailwind CSS 4
- Customize themes in `tailwind.config.js`
- Component styles in `src/components/ui/`

## 📊 Usage Limits

### Free Tier (Self-Hosted)
- **Unlimited** flowchart creation and editing
- **1 AI generation per day** per user (configurable)
- **Unlimited** exports and sharing

### Paid Tiers (If Enabled)
- **Hobby**: 500 AI generations/month
- **Professional**: 1000 AI generations/month

Limits are configurable in `src/lib/ai-usage.ts`:

```typescript
export const AI_USAGE_LIMITS = {
  FREE_USER_DAILY: 1,           // Change daily limit
  HOBBY_USER_MONTHLY: 500,      // Change hobby limit
  PROFESSIONAL_USER_MONTHLY: 1000, // Change pro limit
} as const;
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs**: [Open an issue](https://github.com/tanchaowen84/flowchartai/issues) with detailed reproduction steps
- 💡 **Feature Requests**: Share your ideas for new features or improvements
- 🔧 **Code Contributions**: Submit pull requests for bug fixes or new features
- 📖 **Documentation**: Help improve our documentation and guides
- 🌍 **Translations**: Add support for new languages

### Development Setup

```bash
# Fork the repository and clone your fork
git clone https://github.com/YOUR_USERNAME/flowchartai.git
cd flowchartai

# Install dependencies
pnpm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test thoroughly
pnpm dev

# Commit your changes
git commit -m "feat: add your feature description"

# Push to your fork and create a pull request
git push origin feature/your-feature-name
```

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Write **meaningful commit messages** following conventional commits
- Add **JSDoc comments** for public functions
- Ensure **responsive design** for UI changes

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Verify connection string format
DATABASE_URL="postgresql://username:password@host:port/database"
```

#### AI Generation Not Working
- Verify OpenRouter API key is valid
- Check API quota and billing status
- Ensure model is available (try `google/gemini-2.5-flash`)

#### Authentication Issues
- Verify OAuth redirect URIs match exactly
- Check client ID and secret are correct
- Ensure OAuth apps are enabled and published

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate database types
pnpm db:generate
```

### Getting Help

- 📖 Check our [documentation](#documentation)
- 💬 Join our [Discord community](https://discord.gg/Pfdyhqqu)
- 🐛 [Open an issue](https://github.com/tanchaowen84/flowchartai/issues) on GitHub
- 📧 Email us at [usw20020102@gmail.com](mailto:usw20020102@gmail.com)

## 🔒 Security

### Reporting Security Issues

If you discover a security vulnerability, please email us at [usw20020102@gmail.com](mailto:usw20020102@gmail.com) instead of opening a public issue.

### Security Features

- **Authentication**: Secure OAuth integration with major providers
- **Data Encryption**: All data encrypted in transit and at rest
- **API Security**: Rate limiting and request validation
- **Privacy**: No tracking, minimal data collection
- **Self-Hosting**: Complete data control and privacy

## 📄 License

ViLearning is open source software licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 ViLearning

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

ViLearning is built on the shoulders of amazing open source projects:

- **[Excalidraw](https://excalidraw.com/)** - The amazing drawing canvas that powers our editor
- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[Tailwind CSS](https://tailwindcss.com/)** - The utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Low-level UI primitives
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM for SQL databases
- **[Better Auth](https://www.better-auth.com/)** - Modern authentication library

Special thanks to the [MkSaaS](https://mksaas.com) template that provided the foundation for this project.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tanchaowen84/flowchartai&type=Date)](https://star-history.com/#tanchaowen84/flowchartai&Date)

---

<div align="center">
  <p>Made with ❤️ by the ViLearning team</p>
  <p>
    <a href="https://flowchartai.org">Website</a> •
    <a href="https://github.com/tanchaowen84/flowchartai">GitHub</a> •
    <a href="https://discord.gg/Pfdyhqqu">Discord</a> •
    <a href="https://x.com/tanchaowen84">Twitter</a>
  </p>
</div>
