# ViLearning 品牌统一待修改清单（2025-02-14）

## 首页与核心组件
- **位置**：`src/components/blocks/hero/hero.tsx:546`
  - 原内容：`src="https://cdn.flowchartai.org/static/blocks/demo-1400.jpg"`
  - 建议调整为：将演示图放入 `public/blocks/demo-1400.jpg`，并改写为 `src="/blocks/demo-1400.jpg"`。
  - 完成

- **位置**：`src/components/blocks/features/features.tsx:59-81`
  - 原内容：`image`/`darkImage` 指向 `https://cdn.flowchartai.org/static/blocks/featureX.png`
  - 建议调整为：将四张特性图迁移至 `public/blocks/featureX.png`，代码改为相对路径 `'/blocks/feature1.png'` 等。
  - 完成

- **位置**：`src/components/blocks/features/features2.tsx:59-66`
  - 原内容：`src="https://cdn.flowchartai.org/static/blocks/dark-card.webp"` 与 `.../card.png`
  - 建议调整为：复制到 `public/blocks/dark-card.webp`、`public/blocks/card.png` 并改为 `/blocks/...`。
  - 完成

- **位置**：`src/components/blocks/ai-capabilities/ai-capabilities.tsx:64`
  - 原内容：`src="https://cdn.flowchartai.org/static/blocks/ai_capabilities.png"`
  - 建议调整为：迁移至 `public/blocks/ai_capabilities.png`，改用 `/blocks/ai_capabilities.png`。
  - 完成

- **位置**：`src/components/blocks/how-it-works/how-it-works.tsx:96`
  - 原内容：`src="https://cdn.flowchartai.org/static/blocks/howitworks1.png"`
  - 建议调整为：迁移至 `public/blocks/howitworks1.png`，改用 `/blocks/howitworks1.png`。
  - 完成

- **位置**：`src/components/blocks/logo-cloud/logo-cloud.tsx:14-84`
  - 原内容：Logo 图标指向 `https://cdn.flowchartai.org/static/svg/*.svg`
  - 建议调整为：将所需品牌 SVG 放入 `public/images/logos/`（或统一目录），并改为 `/images/logos/nvidia.svg` 等。
  - 完成

- **位置**：`src/app/[locale]/(marketing)/(pages)/about/page.tsx:49`
  - 原内容：`src="https://cdn.flowchartai.org/static/vilearning_logo.png"`
  - 建议调整为：将头像存入 `public/images/avatars/vilearning.png`（若已存在则复用），并改写为 `/images/avatars/vilearning.png`。
  - 完成

- **位置**：`src/app/[locale]/(marketing)/ai/{text,image,video,audio}/page.tsx:38`
  - 原内容：各 AI 预告页头像均使用 `https://cdn.flowchartai.org/static/vilearning_logo.png`
  - 建议调整为：统一引用本地 `/images/avatars/vilearning.png`。

## 基础配置
- **位置**：`next.config.ts:49`
  - 原内容：`hostname: 'cdn.flowchartai.org'`
  - 建议调整为：若改用自托管资源，可移除此远程域（已移除）；若仍需 CDN，请替换为新的 ViLearning CDN 域名。

- **位置**：`wrangler.jsonc:44`——暂未调整
  - 原内容：`"STORAGE_PUBLIC_URL": "https://cdn.flowchartai.org"`
  - 建议调整为：更新为新的静态资源域名或本地存储前缀（如 `https://cdn.vilearning.io`）。

## AI 助手提示词
- **位置**：`src/lib/displays/definitions.ts:177`
  - 原内容：`systemPrompt: 'You are a Flowchart AI assistant...'`
  - 建议调整为：改写为 `You are a ViLearning assistant...`，突出 ViLearning 空间化学习定位。

- **位置**：`src/lib/prompts/image-flowchart.ts:1`
  - 原内容：``You are FlowChart AI...``
  - 建议调整为：``You are ViLearning, an AI canvas assistant...`` 并同步后文品牌描述。

- **位置**：`src/app/api/ai/chat/flowchart/route.ts:122`
  - 原内容：`You are FlowChart AI, an assistant...`
  - 建议调整为：改为 `You are ViLearning...`，保持对话提示与品牌一致。

## 内容资源与对外文案——已删除content/blogw文件夹下的文件
- **位置**：`content/blog/*` 多个文件的 frontmatter（例如 `content/blog/how-to-create-flowchart-in-word.mdx:4` 等 12 处）
  - 原内容：`image: https://cdn.flowchartai.org/...`
  - 建议调整为：将封面图移动至 `public/images/blog/`，并改写为本地路径（如 `/images/blog/how-to-create-flowchart-in-word.webp`）。

- **位置**：`content/blog/*` 内文 CTA（如 `content/blog/how-to-make-flowchart-in-ppt.mdx:228`、`flowchart-maker-guide.mdx:161` 等）
  - 原内容：`https://flowchartai.org` 或 “Flowchart AI” 文案
  - 建议调整为：替换为 `https://vilearning.io`（或正式站点域名）及 “ViLearning” 品牌描述。

- **位置**：`README.md:13,35,42,434`
  - 原内容：演示链接、媒体资源均指向 `flowchartai.org` / `cdn.flowchartai.org`
  - 建议调整为：更新为 ViLearning 官方站点、新 CDN 或本地静态资源，确保开源文档与品牌一致。

## 其他脚本与工具链
- **位置**：`scripts/test-cdn-resources.js`、`scripts/purge-cdn-cache.js`、`scripts/update-asset-paths.js`、`scripts/test-new-images.js`、`scripts/test-cdn.js`
  - 原内容：默认使用 `https://cdn.flowchartai.org` 作为资源域
  - 建议调整为：同步更新为新的静态资源域名，或在迁移完成后废弃相关脚本。
