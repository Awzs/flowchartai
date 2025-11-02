# 2025-11 阶段 0 准入准备
- 已补充 T0 评审材料：PoC 评估、DisplayRegistry 说明、上下文契约草案、质量保障预案和迁移脚本记录（docs/Vilearning项目需求文档/*）。
- 新建 mindmaps 表及 REST 路由，支持思维导图生成后的持久化与查询（src/db/schema.ts, src/app/api/mindmaps/*）。
- `ai-chat-sidebar` 落地思维导图保存链路：解析后调用 `/api/mindmaps`，缓存保存 ID，埋点包含 `latencyMs` 指标。
- 新增 `scripts/migrations/draft-boards-displays.ts` 输出 boards/displays/contexts 建表与迁移 SQL，dry-run 已验证。
- 引入 Vitest，补充 mindmap-converter 单测，`pnpm test` 打通自动化测试。