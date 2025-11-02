# 2025-02-19 构建修复记录
- `mind-elixir` 自 5.3 起只导出 `style.css`，组件应从 `mind-elixir/style.css` 引入。
- Next.js 15 对 App Route 的 `context.params` 类型为 Promise，需要 `await params`。
- `flowchart-callback-handler` 的待处理数据 `mode` 已拓展为 `AiAssistantMode`，支持 `text_to_mindmap`。
- 中间件内根据 `x-vercel-ip-country`/`cf-ipcountry` 读取地区，避免直接访问 `req.geo`。