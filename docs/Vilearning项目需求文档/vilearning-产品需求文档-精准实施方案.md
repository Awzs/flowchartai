# ViLearning 空间化学习平台产品需求文档（精准实施方案 - 修正版）

> 文档属性：Product Requirement Document (精准实施版 - 修正版)
> 版本：v2025-11-09-修正版
> 面向对象：产品、开发、设计团队
> 核心理念：**白板容器 + Display自治 + 快速验证**

---

## 1. 产品概述与核心策略

### 1.1 愿景
打造面向知识工作者的**多Display空间化学习工作台**，白板作为容器，各Display保持原生编辑能力，通过AI生成结构化知识。

### 1.2 核心策略（修正后）
1. **白板容器化**：CanvasDisplayHost统一管理位置、层级、导出，Display保持原生渲染
2. **Display自治**：MindMap用mind-elixir，Flowchart用Excalidraw，互不转换，各自演进
3. **快速验证**：硬编码实现双Display，验证容器架构价值
4. **模块化演进**：DisplayRegistry支持热插拔，新增Display不改动白板核心
5. **上下文驱动**：ContextEngine聚合多Display上下文，供AI使用

### 1.3 当前实现现状（2025-11-09 更新）
- **产品形态**：已实现CanvasDisplayHost容器 + MindMapDisplay/FlowchartDisplay双Display
- **数据结构**：`boards` + `displays`表已设计，BOARDS_V2_MODE=legacy待切换
- **AI能力**：侧栏支持text_to_mindmap和text_to_flowchart，生成后写入对应Display
- **基础设施**：DisplayRegistry已注册mindmap/flowchart，renderer已接入
- **结论**：架构底座已就绪，需强化容器能力和工具栏集成

---

## 2. 产品架构设计（修正后）

### 2.1 目标架构蓝图（修正版）

```
┌─────────────────────────────────────────────────────────────┐
│                  Board Canvas (白板容器层)                   │
│  - 位置/大小/层级/旋转管理 (react-rnd)                      │
│  - 全局选区/工具栏/对齐线/吸附网格                          │
│  - 统一导出/协作框架/权限控制                               │
│  - 事件总线 (Display间通信)                                 │
├─────────────────────────────────────────────────────────────┤
│  Display层 (自治渲染)                                        │
├─────────────────────────────────────────────────────────────┤
│  MindMap Display  │  Flowchart Display │  Quiz Display      │
│  (mind-elixir)    │  (Excalidraw)      │  (React)           │
│  - 原生渲染        │  - 原生渲染         │  - 原生渲染         │
│  - 自治编辑        │  - 自治编辑         │  - 自治编辑         │
│  - 内部工具栏      │  - 内部工具栏       │  - 内部工具栏       │
├─────────────────────────────────────────────────────────────┤
│                   DisplayRegistry (注册表)                    │
│  - 统一管理：type/renderer/exporter/schema/prompt/toolbar    │
│  - 热插拔：新增Display无需改动白板代码                      │
├─────────────────────────────────────────────────────────────┤
│                   ContextEngine (上下文引擎)                  │
│  - 聚合多Display上下文                                       │
│  - Token控制与优先级裁剪                                    │
├─────────────────────────────────────────────────────────────┤
│                     AI Generation Layer                     │
│  - 多模型路由 | 流式输出 | 结构化校验 | 降级策略            │
├─────────────────────────────────────────────────────────────┤
│                  数据存储层 (boards + displays)               │
└─────────────────────────────────────────────────────────────┘
```

**架构原则**：
- ✅ 不转换：MindElixir数据不转Excalidraw元素
- ✅ 容器化：白板统一管理位置、层级、导出
- ✅ 自治性：各Display保持原生引擎和编辑能力
- ✅ 可扩展：新增Display只需注册，不改动核心

### 2.2 关键组件设计（修正后）

#### DisplayRegistry增强
```typescript
interface DisplayDefinition {
  type: 'flowchart' | 'mindmap' | 'quiz' | 'document';
  name: string;
  description: string;
  
  // 渲染相关
  renderer: React.ComponentType<DisplayProps>;
  toolbar?: React.ComponentType;  // Display专用工具栏
  
  // 数据校验
  schema: ZodSchema;
  
  // AI生成
  prompt: DisplayPrompt;
  parseAIResponse: (payload: string) => { data: any; metadata?: any } | { error: string };
  
  // 导出
  exporter: {
    toPNG: (data: any) => Promise<Blob>;
    toSVG: (data: any) => Promise<string>;
    toJSON: (data: any) => string;
  };
  
  // 上下文
  contextExtractor: (data: any, selection?: any) => ContextSnapshot;
  
  // 交互
  shortcuts?: Record<string, string>;  // 快捷键描述
  
  // 元数据
  icon?: string;  // 图标URL或emoji
  defaultSize?: { width: number; height: number };
}
```

#### CanvasDisplayHost增强
```typescript
interface CanvasDisplayHostProps {
  // 基础能力
  displays: DisplayInstance[];
  onDisplaySelect: (displayId: string) => void;
  onDisplayUpdate: (displayId: string, updates: Partial<DisplayInstance>) => void;
  
  // 工具栏
  selectedDisplayType?: string;
  
  // 导出
  onExport: (format: 'png' | 'svg' | 'pdf' | 'json') => Promise<void>;
  
  // 协作
  isCollaborating?: boolean;
  userColors?: Record<string, string>;
}

// 增强特性
- 旋转手柄：支持0/90/180/270度旋转
- 对齐线：拖拽时显示对齐线（左对齐、右对齐、居中对齐）
- 吸附网格：支持开启/关闭网格吸附
- 多选框选：Shift+拖拽框选多个Display
- 层级管理：右键菜单"置于顶层"/"置于底层"
```

#### ContextEngine跨Display聚合
```typescript
interface ContextEngine {
  // 提取单个Display上下文
  extractDisplayContext(
    displayType: string,
    displayData: any,
    selection?: any
  ): DisplayContext;
  
  // 聚合多个Display上下文
  mergeContexts(contexts: DisplayContext[]): MergedContext;
  
  // Token控制
  trimContexts(contexts: MergedContext, limit: number): TrimmedContext;
}
```

---

## 3. 数据库设计（无需大改）

`boards` + `displays` 表结构已正确支持多Display，无需修改。

**boards表**：管理白板级信息
**displays表**：存储各Display数据（type, position, structured_payload, excalidraw_data）

---

## 4. 实施路径与里程碑（修正后）

### 4.1 总体时间线 (6-8周，缩短2周)

```
Week 1:   CanvasDisplayHost容器强化
Week 2:   MindMap Display增强（editable + 工具栏）
Week 3-4: 数据迁移（boards/displays启用）
Week 5:   DisplayRegistry完善（工具栏、快捷键、上下文）
Week 6:   ContextEngine跨Display聚合
Week 7-8: 测验Display实现（验证架构扩展性）
```

**时间缩短原因**：删除错误的MindElixir→Excalidraw转换工作，专注容器化和Display自治

### 4.2 阶段规划（修正后）

#### 阶段准备期 T0（已完成）
**目标**: 验证架构可行性，补齐基础能力

**已完成产出**:
1. ✅ 思维导图 PoC：mind-elixir渲染、交互、性能验证
2. ✅ DisplayRegistry草案：type/renderer/exporter/schema定义
3. ✅ CanvasDisplayHost：基础拖拽/缩放实现
4. ✅ 数据迁移设计：boards/displays表结构

**当前状态**: T0评审通过，进入阶段0正式开发

---

#### 阶段 0: CanvasDisplayHost容器强化（Week 1）
**目标**: 强化白板容器能力，支持专业级布局操作

**具体任务**:
1. 添加旋转手柄（0/90/180/270度）
2. 实现对齐线（左/右/居中/顶部/底部对齐）
3. 添加吸附网格（可开关，网格大小可调）
4. 实现多选框选（Shift+拖拽）
5. 添加层级管理（右键"置于顶层"/"置于底层"）
6. 实现Display成组（Group/Ungroup）

**交付物**:
- 可旋转、对齐、吸附的Display容器
- 多选和层级管理UI
- 性能测试报告（10个Display拖拽无卡顿）

**成功标准**:
- 拖拽响应时间<100ms
- 对齐线准确度±1px
- 所有操作可Undo/Redo

---

#### 阶段 1: MindMap Display增强（Week 2）
**目标**: 开放editable模式，实现原生编辑能力

**具体任务**:
1. MindMapDisplay支持editable=true
2. 实现mind-elixir浮动工具条（添加同级/子级、删除）
3. 添加主题切换（左右布局、鱼骨图、逻辑图）
4. 实现快捷键（Tab=添加子级, Enter=添加同级, Delete=删除, F2=编辑文本）
5. 添加节点样式面板（颜色、字体、图标）
6. 实现导出（mind-elixir原生导出PNG/SVG/JSON）

**交付物**:
- 完整功能的MindMap Display
- 工具栏和样式面板
- 导出实现

**成功标准**:
- 100节点渲染<200ms
- 快捷键响应<50ms
- 导出成功率100%

---

#### 阶段 2: 数据迁移启用（Week 3-4）
**目标**: 将BOARDS_V2_MODE切换为dual-write，迁移现有数据

**具体任务**:
1. 将BOARDS_V2_MODE设为dual-write
2. 实现flowcharts→boards/displays迁移脚本
3. mindmaps数据接入displays表
4. 更新前端读取路径（/api/boards, /api/displays）
5. 灰度发布与监控

**交付物**:
- 迁移脚本与回滚方案
- 双写兼容性测试
- 性能监控面板

**成功标准**:
- 迁移0数据丢失
- 新老数据读写正常
- 性能监控无警报

---

#### 阶段 3: DisplayRegistry完善（Week 5）
**目标**: 抽象Display管理，支持工具栏、快捷键、上下文

**具体任务**:
1. DisplayRegistry支持toolbar注册
2. 实现快捷键注册与冲突检测
3. 添加contextExtractor接口
4. 实现Display级权限控制
5. 添加Display模板系统

**交付物**:
- 可配置化工具栏
- 快捷键管理系统
- 上下文提取实现

**成功标准**:
- 新增Display无需改动白板代码
- 快捷键冲突检测准确率100%
- 上下文提取覆盖率≥80%

---

#### 阶段 4: ContextEngine跨Display（Week 6）
**目标**: 实现多Display上下文聚合，供AI使用

**具体任务**:
1. 实现DisplayContext提取
2. ContextEngine聚合多Display上下文
3. Token控制与优先级裁剪
4. 上下文缓存与命中率监控
5. 侧栏上下文预览优化

**交付物**:
- ContextEngine实现
- 上下文聚合API
- 监控面板

**成功标准**:
- 上下文命中率≥70%
- Token控制不超限
- 侧栏渲染延迟<100ms

---

#### 阶段 5: Quiz Display验证（Week 7-8）
**目标**: 实现第三个Display，验证架构扩展性

**具体任务**:
1. 定义Quiz Schema
2. 实现QuizDisplay组件（卡片式）
3. 间隔重复算法
4. 学习进度跟踪
5. 注册到DisplayRegistry

**交付物**:
- Quiz Display实现
- 学习面板
- 进度统计

**成功标准**:
- 新增Display代码量<500行
- 学习算法准确率符合预期
- 用户反馈渠道建立

---

## 5. 关键交互设计（补充）

### 5.1 Display级AI操作

**选中MindMap Display时**：
- 工具栏显示"AI续写""AI优化""AI改变布局"
- 侧栏AI输入框提示"基于当前思维导图..."

**选中Flowchart Display时**：
- 工具栏显示"AI扩展""AI简化"
- 侧栏AI输入框提示"基于当前流程图..."

**混合选区时**：
- 工具栏显示"AI分析关联"
- AI自动识别不同Display间的关系

### 5.2 模板系统

**课堂脚本模板**：
- 左侧MindMap（教学目标→知识点→案例）
- 右侧Flowchart（教学流程：导入→讲解→练习→总结）
- 底部Quiz（知识点检测）

**产品评审模板**：
- 顶部MindMap（用户痛点→解决方案→功能清单）
- 中部Flowchart（用户旅程）
- 右侧文档（竞品分析）

**AI生成模板流程**：
1. 用户选择模板类型
2. AI生成结构化数据（含多个Display）
3. 自动创建Display并布局
4. 用户可微调位置和内容

---

## 6. 技术实现细节（补充）

### 6.1 CanvasDisplayHost实现要点

```typescript
// 1. 旋转实现
const [rotation, setRotation] = useState(0);
const rotate = (angle: 0 | 90 | 180 | 270) => {
  setRotation(angle);
  // 保存到display.position.rotation
};

// 2. 对齐线
const [alignmentLines, setAlignmentLines] = useState([]);
useEffect(() => {
  // 监听拖拽，计算与其他Display的边缘对齐
  // 显示虚线提示
}, [displays]);

// 3. 吸附网格
const snapToGrid = (position: {x: number, y: number}, gridSize: number = 20) => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};

// 4. 多选
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const handleBoxSelect = (start: Point, end: Point) => {
  // 计算在矩形区域内的Display
  const ids = displays.filter(d => isInRect(d.position, start, end)).map(d => d.id);
  setSelectedIds(ids);
};
```

### 6.2 Display间通信

```typescript
// 事件总线
const DisplayEventBus = {
  emit: (event: string, data: any) => {
    window.dispatchEvent(new CustomEvent(`display:${event}`, { detail: data }));
  },
  on: (event: string, handler: (data: any) => void) => {
    window.addEventListener(`display:${event}`, handler);
  },
};

// 用例：MindMap节点点击→Flowchart高亮相关节点
DisplayEventBus.emit('mindmap:nodeSelect', { nodeId, topic });
DisplayEventBus.on('flowchart:highlight', (nodeIds) => { ... });
```

---

## 7. 风险与应对（更新）

| 风险 | 描述 | 影响 | 应对策略 |
|------|------|------|----------|
| 架构调整风险 | 删除转换器后需重新验证 | 中 | 已有CanvasDisplayHost基础，风险可控 |
| Display性能 | mind-elixir+Excalidraw同时运行 | 中 | 虚拟化、懒加载、Web Worker |
| 数据迁移 | flowcharts/mindmaps→displays | 高 | 双写策略、灰度发布、完整回滚方案 |
| 工具栏冲突 | 多Display工具栏状态管理 | 中 | 统一selection store、视觉提示 |
| 导出兼容性 | 不同Display导出格式差异 | 低 | 统一转换为SVG/Canvas合成 |

---

## 8. 验收标准

### 8.1 功能验收
- ✅ CanvasDisplayHost支持旋转、对齐、吸附、多选
- ✅ MindMap Display可编辑，工具栏完整
- ✅ 工具栏根据选区类型动态切换
- ✅ 支持导出包含所有Display的PNG/SVG
- ✅ 可创建≥3个Display类型（MindMap/Flowchart/Quiz）

### 8.2 性能验收
- ✅ 10个Display拖拽响应<100ms
- ✅ 100节点MindMap渲染<200ms
- ✅ 导出操作<5s

### 8.3 质量验收
- ✅ 单元测试覆盖率≥80%
- ✅ E2E测试覆盖核心流程
- ✅ 监控指标上报（节点数、操作耗时、错误率）

---

> 注：本文档已修正为"白板容器 + Display自治"架构，删除MindElixir→Excalidraw转换相关内容，更新实施路径和验收标准。
