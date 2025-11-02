# 2025-11-02（B）思维导图链路现状复盘
- DisplayRegistry 与 mindmap Display 已合入主干：`src/lib/displays/*` 提供解析/导出占位，`MindMapDisplay` 负责 MindElixir 预览，导出能力仍为 TODO。
- 侧栏 `ai-chat-sidebar` 支持 `text_to_mindmap`：解析后的导图会写入消息区、缓存 `lastMindmap`，并在登录状态下调用 `/api/mindmaps` 将数据落地 `mindmaps` 表（extend 暂未实现节点级合并，Canvas 写回仍缺失）。
- 后端新增 `/api/mindmaps` 路由及 `mindmaps` 表，`pnpm db:push` 已执行；迁移草案和 dry-run 脚本已提交，但 `boards/displays/contexts` 表仍在规划阶段。
- 准备期文档资产（PoC 评估、DisplayRegistry 使用说明、上下文契约草案、质量保障预案、数据迁移草案）已补齐；质量侧新增 `mindmap-converter` 单测和埋点 `latencyMs`，端到端测试与监控告警待后续补充。
- 下一步需聚焦：导图写回 Excalidraw、extend 差分策略、PNG/SVG 导出、端到端测试与监控闭环。