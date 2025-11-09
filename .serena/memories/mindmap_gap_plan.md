# 2025-11 Mindmap 阶段性差距
- 当前思维导图仅通过 CanvasDisplayHost 悬浮卡片呈现，未写回 Excalidraw，编辑能力默认关闭；AI 生成链路 100% 走 /api/mindmaps。
- boards/displays/contexts 表及 API/迁移脚本已就绪，但 BOARDS_V2_MODE 默认 legacy，前端也未集成 ContextEngine/boards 读写。
- 后续计划需聚焦：MindElixir→Excalidraw 转换器与 Frame/toolbar、mindmap extend 合并策略、启用 boards dual-write、串联上下文采集。