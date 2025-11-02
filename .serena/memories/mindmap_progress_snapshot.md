# 2025-11-02 Mindmap 功能进展快照
- 侧栏已上线 `text_to_mindmap` 模式，`processAIConversation` 使用 DisplayRegistry 解析 `generate_mindmap` 工具输出，消息区嵌入 MindElixir 预览并展示节点/分支统计与原始 JSON。
- 成功解析后会将结构化结果写入 `canvasContextRef.lastMindmap`，同时为登录用户调用 `/api/mindmaps` 持久化到新建的 `mindmaps` 表；记录 `mindmap_generation` 计费并附带节点数、branch 数、fallback、`latencyMs` 等元数据。
- 失败场景统一 toast 提示并记录失败埋点，DisplayRegistry 的 mindmap 定义继续负责 JSON 校验、文本兜底和导出占位，为后续多 Display 渲染/持久化提供统一入口。
- 待办：思维导图尚未写回 Excalidraw 画布，extend 差分、PNG/SVG 导出与端到端测试仍需阶段 0 内补齐。