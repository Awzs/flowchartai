# DisplayRegistry 使用说明

## 1. 设计目标
- 提供统一的 Display 注册、解析、导出与上下文适配入口，支撑流程图、思维导图等多形态内容的动态扩展。
- 降低前端组件耦合度，确保新 Display 引入时无需修改核心容器。

## 2. 核心概念
| 名称 | 说明 | 代码位置 |
| ---- | ---- | ---- |
| `DisplayType` | Display 的类型枚举，当前包含 `flowchart` 与 `mindmap` | `src/lib/displays/registry.ts` |
| `DisplayDefinition` | 描述单个 Display 需要的 schema、prompt、exporter、解析器等配置 | 同上 |
| `displayRegistry` | 单例注册表，负责注册、获取、列举 Display 定义 | 同上 |
| `registerDisplay` | 注册辅助函数，用于将 `DisplayDefinition` 注入 registry | 同上 |

## 3. 注册流程
1. 在 `src/lib/displays/definitions.ts` 中编写 Display 定义：
   ```ts
   registerDisplay({
     type: 'mindmap',
     name: '思维导图',
     description: 'AI生成的层次化思维导图',
     schema: { ... },
     prompt: MINDMAP_PROMPT,
     exporter: mindMapExporter,
     parseAIResponse: (payload) => { ... },
   });
   ```
2. 在需要初始化注册表的入口（如 `src/components/canvas/ai-chat-sidebar.tsx`）引入该模块：
   ```ts
   import '@/lib/displays/definitions';
   ```
   通过 side-effect 运行所有注册逻辑。
3. 在任意模块使用：
   ```ts
   const mindmapDisplay = displayRegistry.get('mindmap');
   if (mindmapDisplay?.parseAIResponse) {
     const result = mindmapDisplay.parseAIResponse(aiOutput);
   }
   ```

## 4. schema / exporter / parser 约定
- **Schema**：需提供 `validate/toJSON/fromJSON`，用于渲染前校验数据及持久化转换。默认实现保持原样，可按需扩展。
- **Exporter**：约定三个导出方法：
  - `toPNG(data): Promise<Blob>`
  - `toSVG(data): Promise<string>`
  - `toJSON(data): string`
  当前思维导图导出暂为 TODO，需要后续结合 `html2canvas`/`dom-to-image` 实现。
- **parseAIResponse**：输入可为字符串或 JSON，需返回 `{ data?, error?, metadata? }`，方便前端显示错误和统计信息。mindmap 定义中已实现 JSON + 文本兜底解析。

## 5. 前端集成要点
- 在 `ai-chat-sidebar` 中统一使用 `displayRegistry` 解析 LLM 输出，保证未来新增 Display 时逻辑复用。
- 将解析结果与统计信息（节点数、是否 fallback）放入消息对象，便于 UI 展示与埋点统计。
- `canvasContextRef` 中缓存 `lastMindmap`，后续 extend 模式可直接读取。

## 6. 扩展指引
- 新增 Display 时：
  1. 在 `definitions.ts` 注册定义。
  2. 实现渲染组件（建议放在 `src/components/displays/`）。
  3. 在适用的前端容器中引入渲染组件；若需要后台生成能力，同步扩展 API 路由与工具定义。
- 后续计划：
  - 抽象 DisplayHost，自动根据 DisplayType 渲染对应组件。
  - 在 Registry 中引入持久化适配层，统一保存/导出逻辑。

## 7. Palette / 流式 / 编辑元数据

- **Palette 元信息**：为适配左侧通用组件栏，`DisplayDefinition` 可额外暴露 `paletteMeta`（icon、默认尺寸、快捷键、是否支持拖拽创建）。Mindmap、Flowchart、便签等均通过该字段描述，前端即可动态渲染按钮。
- **流式渲染 hook**：新增可选的 `streamHandler`，用于在 SSE 过程中逐步写入白板（如 Mindmap 节点增量生成）。当 handler 存在时，AI 侧栏在接收 chunk 时调用对应逻辑。
- **双态编辑配置**：Display 可提供 `editingBehaviors`，包含 `styleToolbar`（按钮集合）和 `textEditor`（字体、字号、对齐可选项），以支撑“点击浮出样式工具条、双击进入文本编辑”的统一体验。
