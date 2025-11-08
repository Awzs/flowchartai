# ViLearning 空间化学习平台产品需求文档（精准实施方案）

> 文档属性：Product Requirement Document (精准实施版)
> 版本：v2025-11-01-精准实施
> 面向对象：产品、开发、设计团队
> 核心理念：**快速验证 + 模块化演进**

---

## 1. 产品概述与核心策略

### 1.1 愿景
打造面向知识工作者的**多Display空间化学习工作台**，通过AI生成结构化知识，支持快速验证和长期维护。

### 1.2 核心策略
1. **快速验证优先**：先硬编码实现思维导图Display，验证多Display价值
2. **模块化演进**：每个功能独立模块，支持热插拔和持续迭代
3. **兼容迁移**：激进重构数据结构，但提供平滑迁移路径
4. **上下文驱动**：浅层→深层上下文积累，形成项目级知识网络

### 1.3 当前实现现状（2025-11 基线）
- **产品形态**：仍为单 Display 流程图画布，前端围绕 Excalidraw 与 `/api/ai/chat/flowchart` 构建，未引入思维导图组件或多 Display 容器。
- **数据结构**：数据库仅存在 `flowcharts` 表（`src/db/schema.ts`），尚无 `boards`、`displays`、`contexts` 等支持多 Display 的结构，迁移脚本亦未成形。
- **AI 能力**：`AiAssistantMode` 仅定义文本/图片生成流程图两种模式；上下文传递为轻量级 JSON，缺乏 ContextEngine 描述的提取、裁剪与缓存。
- **基础设施**：未建立 DisplayRegistry/Prompt 管理，侧栏与服务端逻辑耦合较紧；测试、监控、质量度量针对新增模块尚未规划。
- **结论**：项目尚处于「阶段 0 准备」之前，需完成 PoC 与底座搭建后方可按原阶段计划推进。

---

## 2. 产品架构设计

### 2.1 目标架构蓝图

```
┌─────────────────────────────────────────────────────────────┐
│                     Display层 (多类型展示)                    │
├─────────────────────────────────────────────────────────────┤
│  流程图Display  │ 思维导图Display │ 测验Display  │ ...       │
├─────────────────────────────────────────────────────────────┤
│                   DisplayRegistry (注册表)                    │
│     统一管理：Schema校验 | Prompt配置 | 渲染组件 | 导出策略    │
├─────────────────────────────────────────────────────────────┤
│                   ContextEngine (上下文引擎)                  │
│   选区上下文 │ 结构化快照 │ 项目上下文 │ Token控制           │
├─────────────────────────────────────────────────────────────┤
│                     AI Generation Layer                     │
│          多模型路由 | 重试机制 | 结构化校验 | 降级策略        │
├─────────────────────────────────────────────────────────────┤
│                  数据存储层 (boards + displays)               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 关键组件设计

#### DisplayRegistry (注册表)
```typescript
interface DisplayDefinition {
  type: 'flowchart' | 'mindmap' | 'quiz';
  name: string;
  schema: ZodSchema;           // 数据结构校验
  prompt: DisplayPrompt;       // Prompt配置
  renderer: React.ComponentType; // 渲染组件
  exporter: ExportStrategy;    // 导出策略
  contextExtractor: ContextExtractor; // 上下文提取
}

// 使用示例
const displayRegistry = {
  flowchart: new DisplayDefinition({...}),
  mindmap: new DisplayDefinition({...}),
  quiz: new DisplayDefinition({...})
};
```

#### ContextEngine (上下文引擎)
```typescript
interface ContextSnapshot {
  selection?: NodeSelection;        // 选区上下文
  lastDisplay?: DisplaySnapshot;    // 最近一次结构化输出
  project?: ProjectContext;         // 项目级上下文
  conversation?: MessageHistory;    // 对话历史
}

interface ContextEngine {
  extractSelection(excalidrawAPI): SelectionContext;
  mergeContexts(contexts: ContextSnapshot[]): MergedContext;
  controlTokenLimit(context: MergedContext, limit: number): TrimmedContext;
}
```

---

## 3. 数据库设计 (boards + displays)

### 3.1 表结构设计

#### boards 表 (工作板)
```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  display_type VARCHAR(50) NOT NULL,  -- 'flowchart' | 'mindmap' | 'quiz' | 'mixed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 索引
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_boards_updated_at ON boards(updated_at DESC);
```

#### displays 表 (具体内容)
```sql
CREATE TABLE displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  display_type VARCHAR(50) NOT NULL,  -- 'flowchart' | 'mindmap' | 'quiz'
  display_name VARCHAR(255) NOT NULL,

  -- 核心数据
  excalidraw_data JSONB,               -- Excalidraw原生数据
  structured_payload JSONB,            -- 结构化数据 (Mermaid/Markdown/Quiz Schema)
  ai_snapshot JSONB,                   -- AI原始输出快照

  -- 上下文信息
  ai_model VARCHAR(100),               -- 使用的AI模型
  prompt_version VARCHAR(50),          -- Prompt版本
  tokens_used INTEGER DEFAULT 0,

  -- 元数据
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 800,
  height INTEGER DEFAULT 600,
  z_index INTEGER DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 索引
CREATE INDEX idx_displays_board_id ON displays(board_id);
CREATE INDEX idx_displays_type ON displays(display_type);
CREATE INDEX idx_displays_updated_at ON displays(updated_at DESC);
```

#### contexts 表 (上下文存储)
```sql
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  context_type VARCHAR(50) NOT NULL,   -- 'selection' | 'project' | 'conversation'

  -- 上下文数据
  context_key VARCHAR(255),            -- 上下文键名
  context_value JSONB NOT NULL,        -- 上下文内容

  -- 元数据
  token_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE, -- 可选过期时间

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 索引
CREATE INDEX idx_contexts_board_id ON contexts(board_id);
CREATE INDEX idx_contexts_type ON contexts(context_type);
CREATE INDEX idx_contexts_expires ON contexts(expires_at) WHERE expires_at IS NOT NULL;
```

### 3.2 数据迁移策略

#### Phase 1: 创建新表
```sql
-- 并行创建新表，不影响现有功能
CREATE TABLE boards_new (...);
CREATE TABLE displays_new (...);
CREATE TABLE contexts_new (...);
```

#### Phase 2: 迁移数据
```sql
-- 将现有flowcharts迁移到新结构
INSERT INTO boards_new (
  SELECT
    id,
    user_id,
    'Untitled Flowchart',
    description,
    'flowchart_cover.png',
    'flowchart',
    created_at,
    updated_at
  FROM flowcharts
);

INSERT INTO displays_new (
  SELECT
    id,                    -- board_id
    id as display_id,
    'flowchart',
    'Main Flowchart',
    data,                  -- excalidraw_data
    NULL,                  -- structured_payload
    ai_generated_data,     -- ai_snapshot
    ai_model,
    prompt_version,
    tokens_used,
    0, 0, 800, 600, 1,     -- position/size
    created_at,
    updated_at
  FROM flowcharts
);
```

#### Phase 3: 切换流量
```sql
-- 灰度切换读写到新表
-- 监控错误率，无问题则全量切换
```

---

## 4. 实施路径与里程碑

### 4.1 总体时间线 (8-10周)

```
Week 1-2: 快速思维导图Display硬编码实现
Week 3-4: 新数据结构设计与迁移脚本
Week 5-6: DisplayRegistry架构重构
Week 7-8: 上下文工程浅层实现
Week 9-10: 测验模块独立面板设计
```

### 4.2 阶段规划

#### 阶段准备期 T0（Week 0）
**目标**: 补齐基础能力，确保阶段 0 推进具备可执行性

**必要产出**:
1. **思维导图 PoC**：以 mind-elixir 为主方案，完成渲染、交互与性能验证，输出评估记录与备选库判断。
2. **DisplayRegistry 草案**：定义最小可行接口（类型定义、注册流程、Prompt 配置约束），先纳入现有流程图作为首条记录。
3. **数据迁移设计**：给出 `boards/displays/contexts` 表结构草稿及迁移脚本雏形，明确双写、灰度与回滚策略。
4. **上下文契约**：梳理前后端上下文采集接口，定义 Canvas Snapshot/AI Context 的结构与扩展点。
5. **质量保障预案**：列出阶段 0 及后续的自动化测试、监控指标与验收方式。

所有产出完成并评审通过后，进入阶段 0 正式开发。

> 【2025-11-02 进度】PoC 评估、DisplayRegistry 使用说明、上下文契约草案、质量保障预案、数据迁移草案已编写并归档，迁移脚本 `scripts/migrations/draft-boards-displays.ts` 可 dry-run 输出建表/迁移 SQL，`mindmaps` 表已通过 `pnpm db:push` 建立；当前待发起 T0 评审及 `boards/displays/contexts` 表的正式实施。

---

#### 阶段 0: 快速验证思维导图 (Week 1-2)
**目标**: 在现有架构上硬编码实现思维导图Display，快速验证价值

**具体任务**:
1. 思维导图库选型与集成 (mind-elixir优先)
2. 硬编码思维导图Prompt (参考流程图)
3. 创建MindMapDisplay组件
4. 侧栏添加"思维导图模式"切换
5. 实现基本的生成→渲染→保存链路

**交付物**:
- ✅ 可用的思维导图生成功能
- ✅ 基础编辑能力 (节点增删改)
- ✅ 数据持久化到flowcharts表

**成功标准**:
- 完成思维导图 PoC 成果的正式落地，核心风险关闭
- 用户可以生成简单思维导图，生成成功率 ≥80%，响应时间 <5s
- 对新模式的基础测试脚本与手动验证步骤齐备，可复用到下一阶段

> 【2025-11-02 进度】侧栏已上线 `text_to_mindmap` 模式，调用 `/api/ai/chat/mindmap` 生成 MindElixir 数据并在消息区预览，支持登录用户持久化至 `mindmaps` 表。尚未将思维导图写入 Excalidraw 画布，extend 差分策略与端到端测试/监控埋点仍在排期。
- 2025-11-02-13:20-已验证：现在的现状是流程图可以在白板上生成，但是思维导图现在只是在侧边栏中预览，后续需要调整思维导图也能在白板上显示。

---

#### 阶段 1: 数据结构激进重构 (Week 3-4)
**目标**: 重构为boards + displays关系表，设计ContextEngine

**具体任务**:
1. 设计并创建新表结构
2. 编写数据迁移脚本 (Python/Node.js)
3. 创建DataAccess层抽象 (支持新旧表并行)
4. 更新API路由支持boards/displays
5. 实现ContextEngine基础功能

**交付物**:
- ✅ 新数据库schema
- ✅ 迁移脚本 + 测试
- ✅ 向下兼容的数据访问层
- ✅ 灰度发布与回滚预案（含监控指标）

**成功标准**:
- 新老数据读写正常，迁移 0 数据丢失
- 新 API 功能完整，性能监控未触发警报
- 自动化迁移验证脚本通过，关键指标纳入监控面板

---

#### 阶段 2: DisplayRegistry架构 (Week 5-6)
**目标**: 抽象多Display可扩展架构，迁移思维导图为"第一公民"

**具体任务**:
1. 实现DisplayRegistry核心逻辑
2. 抽象DisplayHost容器组件
3. 将思维导图迁移为Registry条目
4. 更新AI路由支持多Display
5. 实现Prompt配置化管理

**交付物**:
- ✅ 可扩展的Display架构
- ✅ 流程图/思维导图双Display
- ✅ 配置化的Prompt管理

**成功标准**:
- 新 Display 热插拔无问题，流程图/思维导图均通过回归测试
- Display 切换流畅，核心页面指标符合性能基线
- 代码复用度提升 ≥50%，并纳入单元/集成测试覆盖

---

#### 阶段 3: 上下文工程浅层实现 (Week 7-8)
**目标**: 实现选区上下文、项目上下文的存储与使用

**具体任务**:
1. 完善ContextEngine (选区提取、Token控制)
2. 实现contexts表读写逻辑
3. 优化侧栏上下文预览
4. 添加上下文命中率监控
5. 设计上下文缓存策略

**交付物**:
- ✅ 选区上下文自动采集
- ✅ 上下文预览与编辑
- ✅ 性能监控面板

**成功标准**:
- 上下文命中率 ≥70%，Token 控制不超限
- 用户体验流畅，侧栏渲染延迟维持在 <100ms
- 上下文采集、缓存、淘汰流程有监控与报警

---

#### 阶段 4: 测验模块独立面板 (Week 9-10)
**目标**: 实现类似Anki的独立学习面板

**具体任务**:
1. 定义Quiz Schema (题目、答案、难度、标签)
2. 设计QuizDisplay组件 (卡片式)
3. 实现学习算法 (间隔重复)
4. 添加学习进度跟踪
5. 集成到DisplayRegistry

**交付物**:
- ✅ Quiz生成与渲染
- ✅ 独立学习面板
- ✅ 进度统计

**成功标准**:
- 生成测验结构化成功率 ≥80%，学习面板操作流畅
- 进度数据准确且可导出，数据接口具备单元/集成测试
- 关键交互纳入监控告警，用户反馈渠道建立

---

## 5. 关键交互设计

### 5.1 流程图编辑交互优化

#### 问题分析
当前困惑：**何时何地能编辑流程图？**

#### 解决方案：多状态编辑模式

**模式 1: 即时编辑模式** (默认)
- 选中任意流程图节点 → 直接可编辑
- 双击文本 → 进入编辑状态
- 右键节点 → 显示编辑菜单 (删除、复制、改变形状)

**模式 2: 批量编辑模式**
- 侧栏添加"编辑模式"开关
- 开启后显示所有节点编辑控件
- 支持批量选择、批量修改

**模式 3: AI协作模式**
- 选中节点 → 侧栏显示"基于此节点扩展"
- AI自动生成相关节点
- 用户确认后合并到流程图

#### 交互流程设计

```
用户操作流程:
1. 进入白板 → 显示所有Display
2. 鼠标悬停 → 高亮可编辑元素
3. 点击节点 → 进入编辑状态 (蓝色边框)
4. 编辑方式:
   - 直接修改文本 (Enter确认)
   - 右键菜单 (删除/复制/样式)
   - 拖拽连接 (创建新连接)
   - AI扩展 (发送到侧栏)
5. 保存时机:
   - 自动保存 (每30秒)
   - 手动保存 (Ctrl+S)
   - 退出时提醒
```

---

### 5.2 多Display切换体验

#### 侧栏Display选择器
```
┌─────────────────┐
│  Display Type   │
├─────────────────┤
│ ○ 流程图        │
│ ● 思维导图      │
│ ○ 测验          │
├─────────────────┤
│ [切换到流程图]  │
│ [切换到思维导图]│
│ [切换到测验]    │
│ [混合模式]      │
└─────────────────┘
```

#### 白板Display切换动画
- 流程图 → 思维导图: Excalidraw元素淡出，思维导图元素淡入
- 过渡时间: 300ms
- 位置记忆: 切换回来保持之前视图位置

---

### 5.3 上下文交互设计

#### 侧栏上下文预览
```
┌─────────────────┐
│  当前上下文      │
├─────────────────┤
│ ✓ 选区: 3个节点 │
│ ○ 最新思维导图   │
│ ○ 项目说明      │
│ [编辑上下文]     │
└─────────────────┘
```

#### Token使用可视化
```
┌─────────────────┐
│ Token使用: 1200/1500 │
│ ████████░░     │
├─────────────────┤
│ 超出限制的上下文 │
│ ○ 项目说明 (已移除) │
│ ○ 历史对话 (已移除) │
└─────────────────┘
```

### 5.4 AI 侧栏模式与流式生成

- **模式切换**：侧栏顶部加入「生成」与「对白板提问」双模式，生成模式会将结果落到画布，对话模式仅输出文本。模式切换时保留各自历史，防止上下文污染。
- **模型选择**：输入框左侧保留模型下拉（默认模型 + 预留多模型位），即便早期只有一个模型，也以禁用态展示，降低未来改版成本。
- **流式输出**：LLM 返回 SSE chunk 时，侧栏逐条显示节点，白板同步增量绘制，用户可随时中断或接受已生成部分。进度条以“已生成节点/总估算”展示。

### 5.5 左侧组件栏（通用节点）

- 参照 BoardMix，最左侧常驻基础元素：容器、形状/流程图、连接线、文本、思维导图、便签、画笔、表格、文档、卡片看板，下方「更多」展开额外组件。
- 组件配置通过 DisplayRegistry 暴露 `paletteMeta`（图标、默认尺寸、快捷键），支持后续对模板/新 Display 的扩展。
- 思维导图按钮默认插入空 Frame，可关联 AI 入口；流程图按钮沿用现有 Excalidraw 元素，确保两类节点都能被统一的浮动工具条编辑。

### 5.6 双层编辑体验

- **样式态**：单击节点（Mindmap 或 Flowchart）浮出统一的 inline toolbar，提供加子节点/同级、主题色、粗细、链接、评论等；流程图和思维导图共享 UI，仅项可根据类型显隐。
- **文本态**：双击或快捷键进入文本编辑，出现字体/字号/加粗等迷你面板，支持输入法与多语言。退出时同步写回 Excalidraw 元素与结构化数据。
- **悬浮组件**：浮动 toolbar、文本面板需要有“停靠”策略，避免遮挡。Mindmap 需要跟随节点移动，流程图则可对齐边缘。

---

## 6. 技术实现细节

### 6.1 思维导图库选型: mind-elixir

#### 选型理由
- ✅ MIT许可证，商业友好
- ✅ 支持React (mind-elixir-react)
- ✅ 轻量级 (gzip ~50KB)
- ✅ 功能完整 (拖拽、缩放、导出)
- ✅ 社区活跃，issue响应快

#### 集成方案
```typescript
// components/displays/MindMapDisplay.tsx
import { MindElixir, E } from 'mind-elixir-react';

interface MindMapDisplayProps {
  data: MindMapData;
  editable: boolean;
  onChange: (data: MindMapData) => void;
}

export const MindMapDisplay: React.FC<MindMapDisplayProps> = ({
  data,
  editable,
  onChange
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const mind = new E(ref.current, {
      direction: 1, // 1: left to right, 2: top to bottom
      editable: editable,
      contextMenu: editable,
      draggable: editable,
      contextMenuOption: {
        enable: true,
        allows: ['add_sibling', 'add_child', 'remove_node', 'edit_node']
      }
    });

    // 加载数据
    mind.install({
      name: data.name,
      ...data
    });

    // 监听变化
    mind.bus.on('operation', (operation) => {
      onChange(mind.getData());
    });

    return () => {
      mind.destroy();
    };
  }, [data, editable, onChange]);

  return <div ref={ref} className="w-full h-full" />;
};
```

#### 数据结构转换
```typescript
// lib/converters/mindmap-converter.ts
interface AIOutputMindMap {
  root: string;
  children: Array<{
    node: string;
    children?: Array<{ node: string; children?: ... }>;
  }>;
}

// 转换为mind-elixir格式
export function convertAIMindMapToMindElixir(
  aiOutput: AIOutputMindMap
): MindElixirData {
  return {
    name: aiOutput.root,
    ...convertChildren(aiOutput.children)
  };
}
```

---

### 6.2 测验模块设计: 独立学习面板

#### 数据模型
```typescript
interface QuizQuestion {
  id: string;
  type: 'single' | 'multiple' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];        // 选择题
  correct_answer: string | string[]; // 答案
  explanation?: string;      // 解析
  difficulty: 1 | 2 | 3;     // 难度等级
  tags: string[];            // 标签
}

interface QuizSet {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  created_at: Date;
  updated_at: Date;
}

interface LearningSession {
  id: string;
  user_id: string;
  quiz_set_id: string;
  current_question_index: number;
  correct_count: number;
  total_count: number;
  start_time: Date;
  end_time?: Date;
}
```

#### 学习算法 (间隔重复)
```typescript
// lib/learning/spaced-repetition.ts
interface ReviewRecord {
  question_id: string;
  ease_factor: number;       // 记忆难度系数 (初始2.5)
  interval: number;          // 复习间隔 (天)
  repetitions: number;       // 已复习次数
  next_review_date: Date;    // 下次复习日期
}

// 计算下次复习间隔
export function calculateNextReview(
  record: ReviewRecord,
  isCorrect: boolean
): ReviewRecord {
  const newRecord = { ...record };

  if (isCorrect) {
    // 答对了，增加间隔
    if (newRecord.repetitions === 0) {
      newRecord.interval = 1;
    } else if (newRecord.repetitions === 1) {
      newRecord.interval = 6;
    } else {
      newRecord.interval = Math.round(newRecord.interval * newRecord.ease_factor);
    }
    newRecord.repetitions++;
    newRecord.ease_factor = Math.max(
      1.3,
      newRecord.ease_factor - (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))
    );
  } else {
    // 答错了，重置
    newRecord.interval = 1;
    newRecord.repetitions = 0;
    newRecord.ease_factor = Math.max(1.3, newRecord.ease_factor - 0.2);
  }

  newRecord.next_review_date = new Date();
  newRecord.next_review_date.setDate(
    newRecord.next_review_date.getDate() + newRecord.interval
  );

  return newRecord;
}
```

#### 独立学习面板组件
```typescript
// components/quiz/QuizPanel.tsx
export const QuizPanel: React.FC = () => {
  const [currentQuizSet, setCurrentQuizSet] = useState<QuizSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmitAnswer = () => {
    setShowExplanation(true);
    updateLearningRecord();
  };

  return (
    <div className="quiz-panel">
      {/* 进度指示器 */}
      <ProgressBar
        current={currentQuestionIndex + 1}
        total={currentQuizSet.questions.length}
      />

      {/* 问题卡片 */}
      <QuizQuestionCard
        question={currentQuestion.question}
        options={currentQuestion.options}
        selectedAnswer={selectedAnswer}
        onSelect={setSelectedAnswer}
        showExplanation={showExplanation}
        explanation={currentQuestion.explanation}
      />

      {/* 操作按钮 */}
      <div className="quiz-actions">
        {!showExplanation ? (
          <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer}>
            提交答案
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentQuestionIndex < currentQuizSet.questions.length - 1
              ? '下一题'
              : '完成测验'}
          </Button>
        )}
      </div>
    </div>
  );
};
```

---

### 6.3 上下文工程实现

#### ContextEngine核心逻辑
```typescript
// lib/context/engine.ts
export class ContextEngine {
  constructor(
    private aiProvider: AIProvider,
    private tokenLimit: number = 1500
  ) {}

  async extractSelection(excalidrawAPI: ExcalidrawImperativeAPI): Promise<SelectionContext> {
    const selectedElements = excalidrawAPI.getSceneElements()
      .filter(el => el.isSelected);

    const context: SelectionContext = {
      type: 'selection',
      nodes: selectedElements.map(el => ({
        id: el.id,
        text: el.text,
        type: el.type,
        position: { x: el.x, y: el.y }
      })),
      timestamp: Date.now()
    };

    return context;
  }

  async buildContextualPrompt(
    userInput: string,
    contexts: ContextSnapshot[]
  ): Promise<string> {
    let tokenCount = 0;
    const contextParts: string[] = [];

    // 按优先级添加上下文
    for (const context of contexts) {
      if (context.type === 'selection' && context.nodes.length > 0) {
        const selectionText = `选中节点: ${context.nodes.map(n => n.text).join(', ')}`;
        const estimatedTokens = this.estimateTokens(selectionText);

        if (tokenCount + estimatedTokens <= this.tokenLimit) {
          contextParts.push(selectionText);
          tokenCount += estimatedTokens;
        }
      }
      // ... 其他上下文类型
    }

    // 组装最终prompt
    return `用户问题: ${userInput}

上下文信息:
${contextParts.join('\n')}

请基于上述上下文回答用户问题。`;
  }

  private estimateTokens(text: string): number {
    // 粗略估算: 1 token ≈ 4 字符
    return Math.ceil(text.length / 4);
  }
}
```

#### 上下文存储与缓存
```typescript
// lib/context/storage.ts
export class ContextStorage {
  async saveContext(boardId: string, context: ContextSnapshot): Promise<void> {
    await db.contexts.upsert({
      board_id: boardId,
      context_type: context.type,
      context_key: context.key || `${context.type}_${Date.now()}`,
      context_value: JSON.stringify(context),
      token_count: context.tokenCount,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  async getContext(boardId: string, type?: ContextType): Promise<ContextSnapshot[]> {
    const contexts = await db.contexts.findMany({
      where: {
        board_id: boardId,
        ...(type && { context_type: type }),
        expires_at: { gt: new Date() } // 过滤过期上下文
      },
      orderBy: { updated_at: 'desc' }
    });

    return contexts.map(c => JSON.parse(c.context_value));
  }

  async cleanupExpiredContexts(): Promise<void> {
    await db.contexts.deleteMany({
      where: { expires_at: { lt: new Date() } }
    });
  }
}
```

---

## 7. API设计

### 7.1 多Display统一API

#### 生成Display内容
```typescript
// app/api/ai/display/route.ts
POST /api/ai/display

Request:
{
  display_type: 'mindmap' | 'quiz',
  prompt: string,
  board_id: string,
  context?: ContextSnapshot[],
  options?: {
    max_nodes?: number,
    difficulty?: 1 | 2 | 3
  }
}

Response (Streaming):
{
  type: 'text' | 'tool-call',
  content: string,
  toolName?: 'generate_mindmap' | 'generate_quiz',
  args?: {
    structured_data: JSON,
    description: string
  }
}
```

#### 保存Display
```typescript
// app/api/display/route.ts
POST /api/display

Request:
{
  board_id: string,
  display_type: 'mindmap',
  data: {
    excalidraw_data?: JSON,        // 白板数据
    structured_payload: JSON,      // 思维导图/测验结构数据
    position?: { x, y, width, height }
  }
}

Response:
{
  success: true,
  display_id: string,
  display_url: string
}
```

### 7.2 上下文管理API

#### 提取选区上下文
```typescript
// app/api/context/selection/route.ts
POST /api/context/selection

Request:
{
  board_id: string,
  selected_element_ids: string[]
}

Response:
{
  selection_context: SelectionContext,
  token_count: number
}
```

#### 构建上下文
```typescript
// app/api/context/build/route.ts
POST /api/context/build

Request:
{
  board_id: string,
  user_prompt: string,
  context_types: ('selection' | 'project' | 'conversation')[]
}

Response:
{
  contextual_prompt: string,
  included_contexts: ContextSnapshot[],
  token_count: number,
  token_limit: number
}
```

---

## 8. 性能优化策略

### 8.1 渲染优化

#### 虚拟化白板
```typescript
// components/canvas/VirtualizedCanvas.tsx
import { FixedSizeGrid as Grid } from 'react-window';

export const VirtualizedCanvas = ({ displays }: { displays: Display[] }) => {
  // 只渲染视口内的Display，其他延迟加载
  return (
    <Grid
      columnCount={10}
      columnWidth={400}
      height={600}
      rowCount={10}
      rowHeight={300}
      width={800}
    >
      {({ columnIndex, rowIndex }) => {
        // 懒加载Display组件
        return <LazyDisplay index={rowIndex * 10 + columnIndex} />;
      }}
    </Grid>
  );
};
```

#### 思维导图性能优化
```typescript
// 限制节点数量
const MAX_NODES = 120;

// 虚拟滚动 (大量节点时)
const useVirtualization = (nodes: MindNode[], visibleCount: number) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleNodes = useMemo(() => {
    const startIndex = Math.floor(scrollTop / NODE_HEIGHT);
    return nodes.slice(startIndex, startIndex + visibleCount);
  }, [nodes, scrollTop]);

  return { visibleNodes, setScrollTop };
};
```

### 8.2 上下文缓存优化

#### LRU缓存
```typescript
// lib/context/cache.ts
export class ContextCache {
  private cache = new LRUCache<string, ContextSnapshot>({
    max: 100,
    ttl: 1000 * 60 * 10 // 10分钟缓存
  });

  get(boardId: string): ContextSnapshot[] | null {
    return this.cache.get(`board:${boardId}`) || null;
  }

  set(boardId: string, contexts: ContextSnapshot[]): void {
    this.cache.set(`board:${boardId}`, contexts);
  }

  invalidate(boardId: string): void {
    this.cache.delete(`board:${boardId}`);
  }
}
```

---

## 9. 风险与应对

### 9.1 技术风险

| 风险 | 描述 | 影响 | 应对策略 |
|------|------|------|----------|
| 思维导图库不稳定 | mind-elixir可能不适合复杂场景 | 中 | 提前测试，准备备选库 (reactflow-mindmap) |
| 数据迁移失败 | 新旧数据不一致 | 高 | 多轮测试，逐步迁移，回滚机制 |
| 性能下降 | 多Display同时渲染卡顿 | 中 | 虚拟化、懒加载、Worker线程 |
| Token超限 | 上下文过多导致请求失败 | 中 | 优先级裁剪，分批处理 |
| 底座缺失 | DisplayRegistry/ContextEngine 尚未落地 | 高 | 设立 T0 准备里程碑，完成 PoC 与接口评审后再推进 |
| 质量保障不足 | 缺少针对新模块的测试与监控 | 高 | 同步建设自动化测试、监控告警与验收脚本 |

### 9.2 产品风险

| 风险 | 描述 | 影响 | 应对策略 |
|------|------|------|----------|
| 用户不接受多Display | 学习成本高 | 高 | 渐进式引导，默认保持流程图 |
| 思维导图价值不明 | 用户使用率低 | 中 | A/B测试，收集反馈，快速迭代 |
| 上下文工程复杂 | 实现难度大 | 中 | 先简后繁，分阶段实现 |
| 节奏预估过于乐观 | 阶段依赖项多，延误影响整体路线 | 中 | 每阶段结束前回顾预备条件，必要时滚动调整计划 |

---

## 10. 验收标准

### 10.1 功能验收

#### 思维导图Display
- [ ] 生成成功率 ≥80%
- [ ] 节点上限默认120个
- [ ] 渲染时间 <2s
- [ ] 基础编辑操作流畅
- [ ] 数据持久化正常
- [ ] 基础自动化测试（单测/端到端）覆盖生成与保存链路
- [ ] 监控面板提供关键指标（成功率、延迟、错误率）

#### 数据重构
- [ ] 新老数据读写100%兼容
- [ ] 迁移脚本零数据丢失
- [ ] API响应时间无明显下降
- [ ] 并发读写稳定
- [ ] 灰度发布策略与回滚脚本验证通过
- [ ] 数据质量监控上线并持续观测一周

#### 上下文工程
- [ ] 选区上下文自动采集
- [ ] 上下文命中率 ≥70%
- [ ] Token控制有效
- [ ] 用户体验流畅
- [ ] 上下文缓存淘汰策略有监控告警
- [ ] 前后端契约文档同步维护

### 10.2 性能验收

#### 压力测试指标
- [ ] 单板Display数量: 10个 → <2s渲染
- [ ] 思维导图节点: 120个 → <1s交互
- [ ] 上下文上下文: 50个 → <200ms构建prompt
- [ ] 数据库查询: P95 <100ms

### 10.3 质量验收

#### 代码质量
- [ ] 测试覆盖率 ≥80%
- [ ] TypeScript严格模式0错误
- [ ] ESLint规则0警告
- [ ] Bundle大小无明显增加
- [ ] 性能、可用性、错误监控指标齐备
- [ ] 阶段性质量报告归档，便于回溯

#### 用户体验
- [ ] Display切换 <300ms动画
- [ ] 侧栏响应 <100ms
- [ ] 错误提示清晰友好
- [ ] 移动端适配

---

## 11. 资源与时间评估

### 11.1 人力投入 (单人开发)

| 阶段 | 周期 | 主要工作 | 风险缓冲 |
|------|------|----------|----------|
| 阶段T0 | 1周 | PoC、Registry、迁移与上下文准备 | +1天 |
| 阶段0 | 2周 | 思维导图硬编码 | +2天 |
| 阶段1 | 2周 | 数据迁移 | +3天 |
| 阶段2 | 2周 | 架构重构 | +3天 |
| 阶段3 | 2周 | 上下文工程 | +2天 |
| 阶段4 | 2周 | 测验模块 | +2天 |
| **总计** | **11周** | **核心功能** | **+13天** |

### 11.2 技术债务

- [ ] 单元测试补全
- [ ] E2E测试覆盖
- [ ] 文档完善
- [ ] 性能监控接入
- [ ] 错误追踪系统

---

## 12. 后续规划 (阶段5+)

### 12.1 深层上下文工程
- 项目文档聚合
- 跨Display知识图谱
- 智能推荐相关Display

### 12.2 测验模块增强
- Markdown/CSV导出
- 学习报告生成
- 社区题库

### 12.3 生态扩展
- Skill插件体系
- 并行模型支持
- API开放平台

---

## 13. 文档协同与版本管理

- **版本管理**：PRD、实施总结、迁移方案、测试计划需同步维护版本号，每次阶段评审更新变更记录。
- **跨团队同步**：产品/研发/设计需在阶段边界召开评审会议，确认上一阶段交付已满足准入条件，再批准下一阶段开始。
- **文档归档**：PoC 报告、数据迁移脚本说明、上下文契约、监控指标配置等需归档在 `docs/Vilearning项目需求文档/`，并在 README 中链接。
- **反馈循环**：每阶段结束产出经验总结与质量报告，输入 `serena` 记忆或团队知识库，为后续迭代提供决策依据。

---

**总结**: 本方案采用"快速验证 + 模块化演进"策略，约11周内实现多Display空间化学习平台，通过准备期 PoC → 硬编码验证 → 架构重构 → 功能迭代的路径，既保证快速出成果，又为长期维护奠定基础。关键在于先验证用户价值，再投入时间重构架构，最终形成可持续扩展的产品形态。
