# 2025-11-02（A） 思维导图链路现状复盘
- 本地分支已引入 DisplayRegistry 雏形及 mindmap Display 解析/渲染（src/lib/displays/*, src/components/displays/mindmap-display.tsx），但导出能力仍为 TODO。
- 侧栏聊天组件新增 text_to_mindmap 模式与 mindmap_generation 计费上报（src/components/canvas/ai-chat-sidebar.tsx），当前仅在消息列表内预览思维导图，尚未写回画布或后端。
- 新增 /api/ai/chat/mindmap 接口用于 mindmap 工具调用，需要登录后方可使用，暂未与上下文/持久化串联。
- 与 PRD 的阶段 0 要求相比，生成→保存闭环、PoC 评估文档、测试与监控基线仍缺失，后续规划需优先补齐。
