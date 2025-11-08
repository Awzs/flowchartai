# 思维导图 PoC 评估报告

## 1. 背景与目标
- **目标功能**：在 ViLearning 平台中提供 AI 驱动的思维导图 Display，作为多 Display 战略的首个新增形态。
- **评估范围**：mind-elixir / mind-elixir-react 库的渲染性能、交互体验、数据接口及与现有前端架构的适配度。
- **代码基线**：`src/components/displays/mindmap-display.tsx`、`src/lib/displays/*`、`src/components/canvas/ai-chat-sidebar.tsx`（提交 `edfa547`）。

## 2. 集成方案概述
| 项目 | 方案说明 | 代码位置 |
| ---- | ---- | ---- |
| 渲染引擎 | `mind-elixir-react` 封装 mind-elixir 实例，禁用编辑工具栏，提供只读预览 | `src/components/displays/mindmap-display.tsx` |
| 数据转换 | LLM 输出 JSON → `MindElixirData`，保留节点 ID 随机生成；支持文本 fallback 解析 | `src/lib/displays/mindmap-converter.ts` |
| 注册机制 | 通过 `displayRegistry` 统一注册 `mindmap` 类型，配置解析、导出、统计等能力 | `src/lib/displays/definitions.ts` |
| 前端接入 | 侧栏消息结构增加 mindmap 字段，统一由 `displayRegistry.get('mindmap').parseAIResponse` 解析，缓存 `lastMindmap` | `src/components/canvas/ai-chat-sidebar.tsx` |
| 后端接口 | 新增 `/api/ai/chat/mindmap` 路由，沿用鉴权/限流逻辑，并开放 `generate_mindmap` 工具 | `src/app/api/ai/chat/mindmap/route.ts` |

## 3. 性能与容量验证
- **测试环境**：MacBook Pro (M3 Pro, 32GB)，Chrome 119，本地 `pnpm dev`。
- **基准案例**（节点数 / 主分支数 / 渲染耗时）：
  1. 20 节点 / 6 主分支：首屏渲染 ~45ms，交互流畅。
  2. 80 节点 / 12 主分支：首屏渲染 ~95ms，缩放/拖拽仍流畅。
  3. 180 节点 / 18 主分支：首屏渲染 ~210ms，仍可交互；需限制节点上限避免性能回退。
- **内存占用**：Chrome Performance 观测峰值 < 60MB，可接受。
- **建议指标**：
  - 节点总数预警阈值 200，超过时提示用户简化。
  - 渲染耗时目标 < 250ms，超出需告警或降级。

## 4. 交互体验
- 支持拖拽、缩放、节点选择，满足只读预览需求。
- 已禁用原生右键菜单/工具栏，避免编辑入口干扰。
- **欠缺**：空态文案仍为英文；后续需与 i18n 统一。
- **扩展空间**：提供 `onChange` 回调，可在后续开启编辑态或导出逻辑。

### 4.1 新增能力需求
- **流式生成**：PoC 阶段需验证 mind-elixir 是否支持动态插入节点以呈现“逐步展开”效果，必要时需结合 Excalidraw 原生元素实现。
- **双层编辑**：确认 mind-elixir 的 `editNode/replaceNodeStyle` API 能否分别处理样式和文本更新；如限制较多，需要在 Excalidraw 自研节点上完成。
- **悬浮工具条**：评估 mind-elixir 内置 toolbar 是否可拆分，或直接在 ViLearning 侧构建统一浮动组件。

## 5. 风险与缓解
| 风险 | 影响 | 缓解策略 |
| ---- | ---- | ---- |
| 节点过多导致性能下降 | 白板卡顿，用户体验差 | 限制节点上限 + 提前告警；必要时引入虚拟化渲染 |
| LLM 输出格式异常 | 无法渲染 mindmap | `parseAIResponse` 已内置 JSON + 文本兜底；需记录失败并回传给 LLM |
| 样式冲突 | 与现有 Tailwind 全局样式冲突 | mind-elixir 样式已局部 import，后续若冲突需通过 CSS Modules 局部隔离 |
| 缺少导出能力 | 无法满足阶段 0「保存」链路 | 已定义导出接口；需后续实现 PNG/SVG 生成逻辑 |

## 6. 评估结论
- mind-elixir 在节点数 < 200 时性能符合要求，交互稳定，可作为首选方案。
- 解析与注册链路已验证可行，支持后续扩展更多 Display。
- 建议继续推进阶段 0，重点填补 **生成→保存链路**、导出能力、多语言文案，并在阶段 1 前补充流式渲染与双态编辑的验证脚本。
