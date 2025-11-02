# 2025-11 思维导图阶段 0 待办清单
- Canvas 写回：将 MindElixir 数据转成 Excalidraw 元素，替换现有流程图落地逻辑（replace/extend 分支齐全）。
- Extend 合并策略：在 `/api/mindmaps` 层或前端实现节点级 diff/merge，避免每次覆盖。
- 导出能力：补全 DisplayRegistry mindmap exporter 的 PNG/SVG 实现，并校验大图渲染性能。
- 质量闭环：新增端到端测试（生成→保存→读取）和监控告警（成功率、latency、错误率），对齐阶段 0 成功标准。
- 数据结构：推进 `boards/displays/contexts` 表及双写机制，与现有 flowcharts 数据做迁移演练。